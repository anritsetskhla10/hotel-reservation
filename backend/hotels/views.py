from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from django.db.models import Exists, OuterRef

from .models import City, Hotel, Room
from .serializers import (
    CitySerializer, HotelDetailSerializer, HotelListFilters, HotelSerializer,
    RoomDetailSerializer, RoomListFilters, RoomSerializer,
)
from bookings.services import overlapping_bookings


# ქალაქების საჯარო სია
class CityListView(ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = City.objects.all()
    serializer_class = CitySerializer


# სასტუმროების სია ქალაქის ფილტრით
class HotelListView(ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = HotelSerializer

    def get_queryset(self):
        # შემოსული ფილტრის შემოწმება
        filters = HotelListFilters(data=self.request.query_params)
        filters.is_valid(raise_exception=True)

        # აქტიური და გამოქვეყნებული სასტუმროები
        hotels = Hotel.objects.filter(
            is_active=True,
            publication_status=Hotel.PublicationStatus.PUBLISHED,
        ).select_related('city')
        city_id = filters.validated_data.get('city')

        if city_id is not None:
            hotels = hotels.filter(city_id=city_id)

        return hotels


# სასტუმროს დეტალები გალერეით
class HotelDetailView(RetrieveAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Hotel.objects.filter(
        is_active=True,
        publication_status=Hotel.PublicationStatus.PUBLISHED,
    ).select_related('city').prefetch_related('gallery')
    serializer_class = HotelDetailSerializer


# ნომრების საჯარო სია
class RoomListView(ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = RoomSerializer

    def get_queryset(self):
        # ძებნის პარამეტრების შემოწმება
        filters = RoomListFilters(data=self.request.query_params.dict())
        filters.is_valid(raise_exception=True)
        values = filters.validated_data

        rooms = Room.objects.filter(
            is_active=True,
            hotel__is_active=True,
            hotel__publication_status=Hotel.PublicationStatus.PUBLISHED,
        ).select_related('hotel__city')

        # არჩეული ფილტრების გამოყენება
        if 'hotel' in values:
            rooms = rooms.filter(hotel_id=values['hotel'])

        if 'room_type' in values:
            rooms = rooms.filter(room_type=values['room_type'])

        if 'guests' in values:
            rooms = rooms.filter(capacity__gte=values['guests'])

        if 'min_price' in values:
            rooms = rooms.filter(price_per_night__gte=values['min_price'])

        if 'max_price' in values:
            rooms = rooms.filter(price_per_night__lte=values['max_price'])

        if 'is_featured' in values:
            rooms = rooms.filter(is_featured=values['is_featured'])

        # არჩეულ პერიოდში დაკავებული ნომრების გამორიცხვა
        if 'check_in' in values:
            overlapping = overlapping_bookings(
                values['check_in'],
                values['check_out'],
            ).filter(room_id=OuterRef('pk'))

            rooms = rooms.filter(~Exists(overlapping))

        # ფასით დალაგება
        sort = values.get('sort')
        if sort == 'price_asc':
            return rooms.order_by('price_per_night', 'pk')
        if sort == 'price_desc':
            return rooms.order_by('-price_per_night', 'pk')

        return rooms


# ნომრის დეტალები გალერეით
class RoomDetailView(RetrieveAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Room.objects.filter(
        is_active=True,
        hotel__is_active=True,
        hotel__publication_status=Hotel.PublicationStatus.PUBLISHED,
    ).select_related('hotel__city').prefetch_related('gallery')
    serializer_class = RoomDetailSerializer
