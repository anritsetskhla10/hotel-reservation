from django.contrib import admin
from django.utils.html import format_html

from .forms import RoomAdminForm
from .models import City, Hotel, HotelPhoto, Room, RoomPhoto


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


class RoomInline(admin.StackedInline):
    model = Room
    form = RoomAdminForm
    extra = 0
    show_change_link = True

    fields = (
        ('room_number', 'name'),
        ('room_type', 'capacity', 'price_per_night'),
        'description',
        'photo',
        ('is_featured', 'is_active'),
    )


class HotelPhotoInline(admin.TabularInline):
    model = HotelPhoto
    extra = 0


class RoomPhotoInline(admin.TabularInline):
    model = RoomPhoto
    extra = 0


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    inlines = (RoomInline, HotelPhotoInline)
    list_display = ('id', 'name', 'city', 'owner', 'publication_status', 'is_active')
    list_filter = ('city', 'publication_status', 'is_active')
    search_fields = ('name', 'address', 'city__name', 'owner__username')
    list_select_related = ('city', 'owner')

    fieldsets = (
        ('ძირითადი ინფორმაცია', {
            'fields': ('name', 'city', 'owner', 'description', 'address'),
        }),
        ('ფოტო და სტატუსი', {
            'fields': ('photo', 'photo_preview', 'publication_status', 'is_active'),
        }),
    )

    readonly_fields = ('photo_preview',)

    @admin.display(description='ფოტოს წინასწარი ხედი')
    def photo_preview(self, obj):
        if not obj or not obj.photo:
            return 'ფოტო ჯერ არ არის ატვირთული'

        return format_html(
            '<img src="{}" style="max-width: 300px; max-height: 200px;" alt="სასტუმროს ფოტო">',
            obj.photo.url,
        )

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    inlines = (RoomPhotoInline,)
    form = RoomAdminForm
    list_display = (
        'room_number',
        'name',
        'hotel',
        'room_type',
        'price_per_night',
        'capacity',
        'is_featured',
        'is_active',
    )
    list_filter = (
        'hotel__city',
        'hotel',
        'room_type',
        'is_featured',
        'is_active',
    )
    search_fields = ('room_number', 'name', 'hotel__name')
    list_select_related = ('hotel',)
    readonly_fields = ('photo_preview',)

    fieldsets = (
        ('ძირითადი ინფორმაცია', {
            'fields': (
                'hotel',
                'room_number',
                'name',
                'room_type',
                'description',
            ),
        }),
        ('ფასი და ტევადობა', {
            'fields': ('price_per_night', 'capacity'),
        }),
        ('ფოტო', {
            'fields': ('photo', 'photo_preview'),
        }),
        ('სტატუსი', {
            'fields': ('is_featured', 'is_active'),
        }),
    )

    @admin.display(description='ფოტოს წინასწარი ხედი')
    def photo_preview(self, obj):
        if not obj or not obj.photo:
            return 'ფოტო ჯერ არ არის ატვირთული'

        return format_html(
            '<img src="{}" style="max-width: 300px; max-height: 200px;" alt="ნომრის ფოტო">',
            obj.photo.url,
        )
