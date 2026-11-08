from django.contrib import admin

from .models import City, Hotel
from django.utils.html import format_html


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'city', 'is_active')
    list_filter = ('city', 'is_active')
    search_fields = ('name', 'address', 'city__name')
    list_select_related = ('city',)

    fieldsets = (
        ('ძირითადი ინფორმაცია', {
            'fields': ('name', 'city', 'description', 'address'),
        }),
        ('ფოტო და სტატუსი', {
            'fields': ('photo', 'photo_preview', 'is_active'),
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