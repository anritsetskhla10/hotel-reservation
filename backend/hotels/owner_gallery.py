from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.authentication import SessionAuthentication
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import JSONParser, MultiPartParser

from accounts.permissions import IsSiteUser

from .models import Hotel, HotelPhoto, Room, RoomPhoto


class MyHotelPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelPhoto
        fields = ('id', 'image', 'caption', 'position')


class MyHotelPhotoDetailSerializer(MyHotelPhotoSerializer):
    class Meta(MyHotelPhotoSerializer.Meta):
        read_only_fields = ('image',)


class MyRoomPhotoSerializer(MyHotelPhotoSerializer):
    class Meta(MyHotelPhotoSerializer.Meta):
        model = RoomPhoto


class MyRoomPhotoDetailSerializer(MyRoomPhotoSerializer):
    class Meta(MyRoomPhotoSerializer.Meta):
        read_only_fields = ('image',)


class MyHotelPhotoListCreateView(ListCreateAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    parser_classes = [MultiPartParser]
    serializer_class = MyHotelPhotoSerializer
    parent_field = 'hotel'

    def get_parent_queryset(self):
        return Hotel.objects.filter(
            pk=self.kwargs['hotel_id'],
            owner=self.request.user,
        )

    def get_queryset(self):
        return get_object_or_404(self.get_parent_queryset()).gallery.all()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        self.parent = get_object_or_404(self.get_parent_queryset().select_for_update())
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(**{self.parent_field: self.parent})


class MyRoomPhotoListCreateView(MyHotelPhotoListCreateView):
    serializer_class = MyRoomPhotoSerializer
    parent_field = 'room'

    def get_parent_queryset(self):
        return Room.objects.filter(
            pk=self.kwargs['room_id'],
            hotel_id=self.kwargs['hotel_id'],
            hotel__owner=self.request.user,
        )


class MyHotelPhotoDetailView(RetrieveUpdateDestroyAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    parser_classes = [JSONParser, MultiPartParser]
    serializer_class = MyHotelPhotoDetailSerializer
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_owned_photos(self):
        return HotelPhoto.objects.filter(
            hotel_id=self.kwargs['hotel_id'],
            hotel__owner=self.request.user,
        )

    def get_queryset(self):
        photos = self.get_owned_photos()
        if self.request.method in ('PATCH', 'DELETE'):
            return photos.select_for_update()
        return photos

    @transaction.atomic
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @transaction.atomic
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class MyRoomPhotoDetailView(MyHotelPhotoDetailView):
    serializer_class = MyRoomPhotoDetailSerializer

    def get_owned_photos(self):
        return RoomPhoto.objects.filter(
            room_id=self.kwargs['room_id'],
            room__hotel_id=self.kwargs['hotel_id'],
            room__hotel__owner=self.request.user,
        )
