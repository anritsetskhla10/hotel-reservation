from decimal import Decimal

from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.generics import ListCreateAPIView, UpdateAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsSiteUser

from .models import Hotel, Room


# მფლობელის სასტუმროს მონაცემები
class MyHotelSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    publication_status_display = serializers.CharField(
        source='get_publication_status_display',
        read_only=True,
    )

    class Meta:
        model = Hotel
        fields = (
            'id', 'name', 'city', 'city_name', 'address', 'description', 'photo',
            'is_active', 'publication_status', 'publication_status_display',
        )
        read_only_fields = ('id', 'is_active', 'publication_status')


# საკუთარი სასტუმროების სია და დამატება
class MyHotelListCreateView(ListCreateAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = MyHotelSerializer

    def get_queryset(self):
        return Hotel.objects.filter(owner=self.request.user).select_related('city')

    # მფლობელისა და საწყისი სტატუსის მინიჭება
    def perform_create(self, serializer):
        serializer.save(
            owner=self.request.user,
            publication_status=Hotel.PublicationStatus.PENDING,
        )


# საკუთარი სასტუმროს რედაქტირება
class MyHotelEditView(UpdateAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    parser_classes = [MultiPartParser, JSONParser]
    serializer_class = MyHotelSerializer
    http_method_names = ['patch', 'options']

    def get_queryset(self):
        return Hotel.objects.select_for_update().filter(owner=self.request.user)

    @transaction.atomic
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


# ნომრის მონაცემების შემოწმება
class MyRoomSerializer(serializers.ModelSerializer):
    capacity = serializers.IntegerField(
        min_value=1,
        max_value=2147483647,
        required=False,
    )
    price_per_night = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
    )
    room_type_display = serializers.CharField(
        source='get_room_type_display',
        read_only=True,
    )

    class Meta:
        model = Room
        fields = (
            'id', 'room_number', 'name', 'room_type', 'room_type_display',
            'description', 'price_per_night', 'capacity', 'photo', 'is_active',
            'is_featured',
        )
        read_only_fields = ('id', 'is_active')

    # ტიპის მიხედვით ტევადობის განსაზღვრა
    def validate(self, attrs):
        current_type = self.instance.room_type if self.instance else None
        room_type = attrs.get('room_type', current_type)

        if room_type == current_type and 'capacity' not in attrs:
            return attrs

        fixed_capacity = Room.FIXED_CAPACITIES.get(room_type)
        if fixed_capacity is not None:
            attrs['capacity'] = fixed_capacity
        elif 'capacity' not in attrs:
            default_capacity = Room.DEFAULT_CAPACITIES.get(room_type)
            if default_capacity is None:
                raise serializers.ValidationError({
                    'capacity': 'მიუთითეთ ტევადობა.'
                })
            attrs['capacity'] = default_capacity

        return attrs


# საკუთარი სასტუმროს ნომრების სია და დამატება
class MyRoomListCreateView(ListCreateAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = MyRoomSerializer

    def get_queryset(self):
        hotel = get_object_or_404(
            Hotel,
            pk=self.kwargs['hotel_id'],
            owner=self.request.user,
        )
        return hotel.rooms.all()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # მფლობელობის შემოწმება და სასტუმროს დაბლოკვა
        hotel = get_object_or_404(
            Hotel.objects.select_for_update(),
            pk=self.kwargs['hotel_id'],
            owner=request.user,
        )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        room_number = serializer.validated_data['room_number']

        # იმავე სასტუმროში განმეორებული ნომრის შემოწმება
        duplicate = {'room_number': 'ამ სასტუმროში ნომერი უკვე არსებობს.'}
        if hotel.rooms.filter(room_number=room_number).exists():
            raise serializers.ValidationError(duplicate)

        try:
            with transaction.atomic():
                serializer.save(hotel=hotel)
        except IntegrityError as error:
            if hotel.rooms.filter(room_number=room_number).exists():
                raise serializers.ValidationError(duplicate) from error
            raise

        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ნომრის რედაქტირების ველები
class MyRoomEditSerializer(MyRoomSerializer):
    class Meta(MyRoomSerializer.Meta):
        read_only_fields = ('id', 'is_featured')


# საკუთარი ნომრის ნაწილობრივი რედაქტირება
class MyRoomEditView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    parser_classes = [MultiPartParser, JSONParser]

    @transaction.atomic
    def patch(self, request, hotel_id, room_id):
        room = get_object_or_404(
            Room.objects.select_for_update(),
            pk=room_id,
            hotel_id=hotel_id,
            hotel__owner=request.user,
        )
        serializer = MyRoomEditSerializer(
            room,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        # სხვა ნომრებთან დუბლირების შემოწმება
        room_number = serializer.validated_data.get('room_number', room.room_number)
        other_rooms = Room.objects.filter(hotel_id=hotel_id).exclude(pk=room.pk)
        duplicate = {'room_number': 'ამ სასტუმროში ნომერი უკვე არსებობს.'}
        if other_rooms.filter(room_number=room_number).exists():
            raise serializers.ValidationError(duplicate)

        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError as error:
            if other_rooms.filter(room_number=room_number).exists():
                raise serializers.ValidationError(duplicate) from error
            raise

        return Response(serializer.data)


# გამორჩეულობის მნიშვნელობის შემოწმება
class MyRoomFeaturedSerializer(serializers.Serializer):
    is_featured = serializers.BooleanField()


# ნომრის გამორჩეულობის შეცვლა
class MyRoomFeaturedView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    parser_classes = [JSONParser]

    @transaction.atomic
    def patch(self, request, hotel_id, room_id):
        room = get_object_or_404(
            Room.objects.select_for_update(),
            pk=room_id,
            hotel_id=hotel_id,
            hotel__owner=request.user,
        )
        serializer = MyRoomFeaturedSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        room.is_featured = serializer.validated_data['is_featured']
        room.save(update_fields=['is_featured'])

        return Response(serializer.data)
