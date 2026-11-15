from django import forms

from hotels.models import Hotel, Room

from .models import Booking


class RoomChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, room):
        return f'{room.hotel.name} — {room}'


class BookingCreateForm(forms.ModelForm):
    room = RoomChoiceField(
        label='ნომერი',
        queryset=Room.objects.filter(
            is_active=True,
            hotel__is_active=True,
            hotel__publication_status=Hotel.PublicationStatus.PUBLISHED,
        ).select_related('hotel'),
    )

    class Meta:
        model = Booking
        fields = (
            'room',
            'contact_name',
            'contact_phone',
            'check_in',
            'check_out',
        )
        widgets = {
            'check_in': forms.DateInput(
                format='%Y-%m-%d',
                attrs={'type': 'date'},
            ),
            'check_out': forms.DateInput(
                format='%Y-%m-%d',
                attrs={'type': 'date'},
            ),
        }
