from rest_framework import serializers

from hotels.serializers import CitySerializer

from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='room.hotel.name', read_only=True)
    hotel_photo = serializers.ImageField(source='room.hotel.photo', read_only=True)
    city = CitySerializer(source='room.hotel.city', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    room_photo = serializers.ImageField(source='room.photo', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True,
    )

    class Meta:
        model = Booking
        fields = (
            'id',
            'room',
            'room_name',
            'room_photo',
            'hotel_name',
            'hotel_photo',
            'city',
            'contact_name',
            'contact_phone',
            'check_in',
            'check_out',
            'price_per_night',
            'total_price',
            'status',
            'status_display',
        )
        read_only_fields = fields

class BookingListFilters(serializers.Serializer):
    city = serializers.IntegerField(required=False, min_value=1)


class BookingCreateSerializer(serializers.Serializer):
    room = serializers.IntegerField(source='room_id', min_value=1)
    contact_name = serializers.CharField(max_length=200)
    contact_phone = serializers.CharField(max_length=20)
    check_in = serializers.DateField()
    check_out = serializers.DateField()