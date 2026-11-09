from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from hotels.models import Room

from .models import Booking


def validate_booking_dates(check_in, check_out):
    if check_in is None or check_out is None:
        raise ValidationError(
            'შესვლისა და გასვლის ორივე თარიღი აუცილებელია.'
        )

    errors = {}

    if check_in < timezone.localdate():
        errors['check_in'] = 'შესვლის თარიღი წარსულში არ უნდა იყოს.'

    if check_out <= check_in:
        errors['check_out'] = 'გასვლის თარიღი შესვლაზე გვიან უნდა იყოს.'

    if errors:
        raise ValidationError(errors)

    return (check_out - check_in).days


def has_booking_overlap(room, check_in, check_out):
    return Booking.objects.filter(
        room=room,
        status=Booking.Status.CONFIRMED,
        check_in__lt=check_out,
        check_out__gt=check_in,
    ).exists()


@transaction.atomic
def create_booking(
    *,
    user,
    room_id,
    contact_name,
    contact_phone,
    check_in,
    check_out,
):
    if not user.is_authenticated or not user.is_active:
        raise PermissionDenied('დაჯავშნისთვის საჭიროა სისტემაში შესვლა.')

    nights = validate_booking_dates(check_in, check_out)

    try:
        room = Room.objects.select_for_update().get(pk=room_id)
    except Room.DoesNotExist:
        raise ValidationError({'room': 'ნომერი ვერ მოიძებნა.'})

    if not room.is_active or not room.hotel.is_active:
        raise ValidationError({'room': 'ამ ნომრის დაჯავშნა მიუწვდომელია.'})

    if has_booking_overlap(room, check_in, check_out):
        raise ValidationError({
            'room': 'არჩეულ პერიოდში ნომერი უკვე დაჯავშნილია.'
        })

    booking = Booking(
        user=user,
        room=room,
        contact_name=contact_name,
        contact_phone=contact_phone,
        check_in=check_in,
        check_out=check_out,
        price_per_night=room.price_per_night,
        total_price=room.price_per_night * nights,
    )
    booking.full_clean()
    booking.save()

    return booking


@transaction.atomic
def cancel_booking(*, user, booking_id):
    if not user.is_authenticated or not user.is_active:
        raise PermissionDenied('საჭიროა სისტემაში შესვლა.')

    try:
        booking = Booking.objects.select_for_update().get(pk=booking_id)
    except Booking.DoesNotExist:
        raise ValidationError({'booking': 'ჯავშანი ვერ მოიძებნა.'})

    can_manage = (
        user.is_staff
        and user.has_perm('bookings.change_booking')
    )

    if booking.user_id != user.pk and not can_manage:
        raise PermissionDenied('ამ ჯავშნის გაუქმების უფლება არ გაქვთ.')

    if booking.status == Booking.Status.CANCELLED:
        return booking

    booking.status = Booking.Status.CANCELLED
    booking.cancelled_at = timezone.now()
    booking.save(update_fields=['status', 'cancelled_at'])

    return booking