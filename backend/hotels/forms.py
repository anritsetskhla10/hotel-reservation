import json

from django import forms

from .models import Room


# ნომრის ადმინისტრირების ფორმა
class RoomAdminForm(forms.ModelForm):
    class Meta:
        model = Room
        fields = '__all__'

    # ტევადობის მართვის JavaScript
    class Media:
        js = ('hotels/room-capacity.js',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['capacity'].required = False

        # ტევადობის წესების გადაცემა ბრაუზერისთვის
        self.fields['room_type'].widget.attrs.update({
            'data-fixed-capacities': json.dumps(Room.FIXED_CAPACITIES),
            'data-default-capacities': json.dumps(Room.DEFAULT_CAPACITIES),
        })

    # ტიპის მიხედვით ტევადობის შემოწმება და შევსება
    def clean(self):
        cleaned_data = super().clean()
        room_type = cleaned_data.get('room_type')

        if not room_type or 'capacity' in self.errors:
            return cleaned_data

        fixed_capacity = Room.FIXED_CAPACITIES.get(room_type)

        # ძველი ჩანაწერის შეუსაბამო ტევადობის შესწორება
        if (
            fixed_capacity is not None
            and self.instance.pk
            and self.instance.room_type == room_type
            and self.instance.capacity != fixed_capacity
        ):
            if cleaned_data.get('capacity') != fixed_capacity:
                self.add_error(
                    'capacity',
                    f'მიუთითეთ {fixed_capacity} ან შეარჩიეთ შესაბამისი ნომრის ტიპი.',
                )
        elif fixed_capacity is not None:
            cleaned_data['capacity'] = fixed_capacity
        elif cleaned_data.get('capacity') is None:
            default_capacity = Room.DEFAULT_CAPACITIES.get(room_type)

            if default_capacity is None:
                self.add_error('capacity', 'მიუთითეთ ტევადობა, მინიმუმ 1 სტუმარი.')
            else:
                cleaned_data['capacity'] = default_capacity

        return cleaned_data
