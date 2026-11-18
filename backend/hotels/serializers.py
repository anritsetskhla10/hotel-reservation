from rest_framework import serializers
from decimal import Decimal

from .models import City, Hotel, HotelPhoto, Room, RoomPhoto
from bookings.services import validate_booking_dates


# ქალაქის მონაცემები
class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ('id', 'name')


# სასტუმროს მონაცემები ქალაქის ინფორმაციით
class HotelSerializer(serializers.ModelSerializer):
    city = CitySerializer(read_only=True)

    class Meta:
        model = Hotel
        fields = ('id', 'name', 'description', 'address', 'photo', 'city')


# სასტუმროების ფილტრის შემოწმება
class HotelListFilters(serializers.Serializer):
    city = serializers.IntegerField(required=False, min_value=1)


# ნომრის მონაცემები სასტუმროსა და ქალაქის ინფორმაციით
class RoomSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    city = CitySerializer(source='hotel.city', read_only=True)
    room_type_display = serializers.CharField(
        source='get_room_type_display',
        read_only=True,
    )

    class Meta:
        model = Room
        fields = (
            'id',
            'hotel',
            'hotel_name',
            'city',
            'room_number',
            'name',
            'room_type',
            'room_type_display',
            'description',
            'price_per_night',
            'capacity',
            'photo',
            'is_featured',
        )


# სასტუმროს დამატებითი ფოტო
class HotelPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelPhoto
        fields = ('id', 'image', 'caption')


# ნომრის დამატებითი ფოტო
class RoomPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomPhoto
        fields = ('id', 'image', 'caption')


# სასტუმროს დეტალები გალერეით
class HotelDetailSerializer(HotelSerializer):
    gallery = HotelPhotoSerializer(many=True, read_only=True)

    class Meta(HotelSerializer.Meta):
        fields = HotelSerializer.Meta.fields + ('gallery',)


# ნომრის დეტალები გალერეით
class RoomDetailSerializer(RoomSerializer):
    gallery = RoomPhotoSerializer(many=True, read_only=True)

    class Meta(RoomSerializer.Meta):
        fields = RoomSerializer.Meta.fields + ('gallery',)


# ნომრების ძებნის პარამეტრების შემოწმება
class RoomListFilters(serializers.Serializer):
    sort = serializers.ChoiceField(
        choices=('price_asc', 'price_desc'),
        required=False,
    )
    hotel = serializers.IntegerField(required=False, min_value=1)
    guests = serializers.IntegerField(required=False, min_value=1)
    room_type = serializers.ChoiceField(
        choices=Room.RoomType.choices,
        required=False,
    )
    min_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.00'),
        required=False,
    )
    max_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.00'),
        required=False,
    )
    is_featured = serializers.BooleanField(required=False)
    check_in = serializers.DateField(required=False)
    check_out = serializers.DateField(required=False)

    def validate(self, attrs):
        min_price = attrs.get('min_price')
        max_price = attrs.get('max_price')

        # ფასის საზღვრების შემოწმება
        if min_price is not None and max_price is not None:
            if min_price > max_price:
                raise serializers.ValidationError({
                    'max_price': 'მაქსიმალური ფასი მინიმალურზე ნაკლებია.'
                })

        # შესვლისა და გასვლის თარიღების შემოწმება
        if 'check_in' in attrs or 'check_out' in attrs:
            validate_booking_dates(
                attrs.get('check_in'),
                attrs.get('check_out'),
            )

        return attrs