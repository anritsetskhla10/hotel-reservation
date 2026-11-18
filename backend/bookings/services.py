from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from hotels.models import Hotel, Room

from .models import Booking


# საკუთარ სასტუმროში დაჯავშნის შეცდომა
class OwnHotelBookingDenied(PermissionDenied):
    pass


# ჯავშნის მდგომარეობასთან დაკავშირებული კონფლიქტი
class BookingConflict(Exception):
    pass


# თარიღების შემოწმება და ღამეების რაოდენობა
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


# პერიოდთან გადაფარული დადასტურებული ჯავშნები
def overlapping_bookings(check_in, check_out):
    return Booking.objects.filter(
        status=Booking.Status.CONFIRMED,
        check_in__lt=check_out,
        check_out__gt=check_in,
    )


# კონკრეტული ნომრის დაკავებულობის შემოწმება
def has_booking_overlap(room, check_in, check_out):
    return overlapping_bookings(check_in, check_out).filter(room=room).exists()


# ახალი ჯავშნის შექმნა
@transaction.atomic
def create_booking(
    *,
    user,
    room_id,
    contact_name,
    contact_phone,
    check_in,
    check_out,
    status=Booking.Status.CONFIRMED,
):
    if not user.is_authenticated or not user.is_active:
        raise PermissionDenied('დაჯავშნისთვის საჭიროა სისტემაში შესვლა.')

    nights = validate_booking_dates(check_in, check_out)

    # ნომრის დაბლოკვა ტრანზაქციის დასრულებამდე
    try:
        room = Room.objects.select_for_update().get(pk=room_id)
    except Room.DoesNotExist:
        raise ValidationError({'room': 'ნომერი ვერ მოიძებნა.'})

    hotel = room.hotel
    if hotel.owner_id == user.pk:
        raise OwnHotelBookingDenied('საკუთარ სასტუმროში ნომერს ვერ დაჯავშნით.')

    # ნომრისა და სასტუმროს ხელმისაწვდომობა
    if (
        not room.is_active
        or not hotel.is_active
        or hotel.publication_status != Hotel.PublicationStatus.PUBLISHED
    ):
        raise ValidationError({'room': 'ამ ნომრის დაჯავშნა მიუწვდომელია.'})

    if has_booking_overlap(room, check_in, check_out):
        raise ValidationError({
            'room': 'არჩეულ პერიოდში ნომერი უკვე დაჯავშნილია.'
        })

    # მიმდინარე ფასის დაფიქსირება და ჯამის გამოთვლა
    booking = Booking(
        user=user,
        room=room,
        contact_name=contact_name,
        contact_phone=contact_phone,
        check_in=check_in,
        check_out=check_out,
        price_per_night=room.price_per_night,
        total_price=room.price_per_night * nights,
        status=status,
    )
    booking.full_clean()
    booking.save()

    return booking


# ჯავშნის გაუქმება
@transaction.atomic
def cancel_booking(*, user, booking_id):
    if not user.is_authenticated or not user.is_active:
        raise PermissionDenied('საჭიროა სისტემაში შესვლა.')

    try:
        booking = Booking.objects.select_for_update().get(pk=booking_id)
    except Booking.DoesNotExist:
        raise ValidationError({'booking': 'ჯავშანი ვერ მოიძებნა.'})

    # ავტორის ან შესაბამისი უფლების მქონე ადმინისტრატორის დაშვება
    can_manage = (
        user.is_staff
        and user.has_perm('bookings.change_booking')
    )

    if booking.user_id != user.pk and not can_manage:
        raise PermissionDenied('ამ ჯავშნის გაუქმების უფლება არ გაქვთ.')

    if booking.status == Booking.Status.CANCELLED:
        return booking

    if booking.status == Booking.Status.REJECTED:
        raise BookingConflict('უარყოფილი მოთხოვნის გაუქმება შეუძლებელია.')

    booking.status = Booking.Status.CANCELLED
    booking.cancelled_at = timezone.now()
    booking.save(update_fields=['status', 'cancelled_at'])

    return booking


# მფლობელის მიერ მოთხოვნის დადასტურება ან უარყოფა
@transaction.atomic
def decide_booking(*, owner, booking_id, confirm):
    if not owner.is_authenticated or not owner.is_active or owner.is_staff:
        raise PermissionDenied

    # მფლობელის ჯავშნისა და დაკავშირებული ობიექტების მოძებნა
    owned_bookings = Booking.objects.filter(room__hotel__owner=owner)
    room_id = owned_bookings.values_list('room_id', flat=True).get(pk=booking_id)
    room = Room.objects.select_for_update().get(pk=room_id)
    hotel = Hotel.objects.select_for_update().get(pk=room.hotel_id)

    if hotel.owner_id != owner.pk:
        raise Booking.DoesNotExist

    booking = owned_bookings.select_for_update(of=('self',)).get(
        pk=booking_id,
        room=room,
    )

    new_status = Booking.Status.CONFIRMED if confirm else Booking.Status.REJECTED

    # განმეორებული მოქმედება იმავე შედეგს აბრუნებს
    if booking.status == new_status:
        return booking

    if booking.status != Booking.Status.PENDING:
        raise BookingConflict(
            'გადაწყვეტილების მიღება მხოლოდ მოლოდინში მყოფ მოთხოვნაზეა შესაძლებელი.'
        )

    # დადასტურებამდე ხელმისაწვდომობის ხელახლა შემოწმება
    if confirm:
        if (
            not room.is_active
            or not hotel.is_active
            or hotel.publication_status != Hotel.PublicationStatus.PUBLISHED
        ):
            raise BookingConflict('ამ ნომრის დაჯავშნა მიუწვდომელია.')

        if booking.check_in < timezone.localdate():
            raise BookingConflict('შესვლის თარიღი უკვე გასულია.')

        if has_booking_overlap(room, booking.check_in, booking.check_out):
            raise BookingConflict('არჩეულ პერიოდში ნომერი უკვე დაჯავშნილია.')

    booking.status = new_status
    booking.save(update_fields=['status'])

    return booking
