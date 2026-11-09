from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from django.db.models import Exists, OuterRef

from .models import City, Hotel, Room
from .serializers import CitySerializer, HotelListFilters, HotelSerializer, RoomListFilters, RoomSerializer
from bookings.services import overlapping_bookings



class CityListView(ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = City.objects.all()
    serializer_class = CitySerializer

class HotelListView(ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = HotelSerializer

    def get_queryset(self):
        filters = HotelListFilters(data=self.request.query_params)
        filters.is_valid(raise_exception=True)

        hotels = Hotel.objects.filter(is_active=True).select_related('city')
        city_id = filters.validated_data.get('city')

        if city_id is not None:
            hotels = hotels.filter(city_id=city_id)

        return hotels

class HotelDetailView(RetrieveAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Hotel.objects.filter(is_active=True).select_related('city')
    serializer_class = HotelSerializer

class RoomListView(ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = RoomSerializer

    def get_queryset(self):
        filters = RoomListFilters(data=self.request.query_params.dict())
        filters.is_valid(raise_exception=True)
        values = filters.validated_data

        rooms = Room.objects.filter(
            is_active=True,
            hotel__is_active=True,
        ).select_related('hotel__city')

        if 'hotel' in values:
            rooms = rooms.filter(hotel_id=values['hotel'])

        if 'room_type' in values:
            rooms = rooms.filter(room_type=values['room_type'])

        if 'min_price' in values:
            rooms = rooms.filter(price_per_night__gte=values['min_price'])

        if 'max_price' in values:
            rooms = rooms.filter(price_per_night__lte=values['max_price'])

        if 'is_featured' in values:
            rooms = rooms.filter(is_featured=values['is_featured'])

        if 'check_in' in values:
            overlapping = overlapping_bookings(
                values['check_in'],
                values['check_out'],
            ).filter(room_id=OuterRef('pk'))

            rooms = rooms.filter(~Exists(overlapping))

        return rooms

class RoomDetailView(RetrieveAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Room.objects.filter(
        is_active=True,
        hotel__is_active=True,
    ).select_related('hotel__city')
    serializer_class = RoomSerializer