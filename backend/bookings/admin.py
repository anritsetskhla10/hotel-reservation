from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.template.response import TemplateResponse

from .forms import BookingCreateForm
from .models import Booking
from .services import BookingConflict, cancel_booking, create_booking


# ჯავშნების ადმინისტრირება
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

    # გაუქმების მოქმედების უფლება
    def has_cancel_permission(self, request):
        return (
            request.user.is_staff
            and request.user.has_perm('bookings.change_booking')
        )

    # მონიშნული ჯავშნების გაუქმება
    @admin.action(
        permissions=['cancel'],
        description='არჩეული ჯავშნების გაუქმება',
    )
    def cancel_selected_bookings(self, request, queryset):
        for booking_id in queryset.values_list('pk', flat=True):
            try:
                cancel_booking(user=request.user, booking_id=booking_id)
            except BookingConflict as error:
                self.message_user(
                    request,
                    f'#{booking_id}: {error}',
                    level=messages.WARNING,
                )

        self.message_user(request, 'გაუქმების მოქმედება შესრულდა.')

    # ჯავშნის დამატების საკუთარი გვერდი
    def add_view(self, request, form_url='', extra_context=None):
        if not self.has_add_permission(request):
            raise PermissionDenied

        form = BookingCreateForm(
            request.POST if request.method == 'POST' else None
        )

        if request.method == 'POST' and form.is_valid():
            data = form.cleaned_data

            # ჯავშნის შექმნა და ადმინისტრირების ჟურნალში ჩაწერა
            try:
                with transaction.atomic():
                    booking = create_booking(
                        user=request.user,
                        room_id=data['room'].pk,
                        contact_name=data['contact_name'],
                        contact_phone=data['contact_phone'],
                        check_in=data['check_in'],
                        check_out=data['check_out'],
                    )
                    self.log_addition(request, booking, 'ჯავშანი შეიქმნა.')
            except ValidationError as error:
                for message in error.messages:
                    form.add_error(None, message)
            else:
                return self.response_add(request, booking)

        # ფორმის შაბლონისთვის მონაცემების მომზადება
        request.current_app = self.admin_site.name
        context = {
            **self.admin_site.each_context(request),
            'title': 'ჯავშნის დამატება',
            'form': form,
            **(extra_context or {}),
        }
        return TemplateResponse(
            request,
            'admin/bookings/booking/add_booking.html',
            context,
        )

    # არსებული ჯავშნის პირდაპირი რედაქტირების შეზღუდვა
    def has_change_permission(self, request, obj=None):
        return False

    # ჯავშნის წაშლის შეზღუდვა
    def has_delete_permission(self, request, obj=None):
        return False
