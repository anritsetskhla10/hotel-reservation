from django.contrib import admin

from .models import Booking
from .services import cancel_booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'room',
        'check_in',
        'check_out',
        'total_price',
        'status',
    )
    list_filter = ('status', 'room__hotel__city')
    search_fields = ('user__username', 'room__room_number')
    list_select_related = ('user', 'room')
    actions = ('cancel_selected_bookings',)

    def has_cancel_permission(self, request):
        return (
            request.user.is_staff
            and request.user.has_perm('bookings.change_booking')
        )

    @admin.action(
        permissions=['cancel'],
        description='არჩეული ჯავშნების გაუქმება',
    )
    def cancel_selected_bookings(self, request, queryset):
        for booking_id in queryset.values_list('pk', flat=True):
            cancel_booking(user=request.user, booking_id=booking_id)

        self.message_user(request, 'გაუქმების მოქმედება შესრულდა.')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False