from django.conf import settings
from django.db import models


class Booking(models.Model):
    # ჯავშნის სტატუსები
    class Status(models.TextChoices):
        PENDING = 'pending', 'მოლოდინში'
        CONFIRMED = 'confirmed', 'დადასტურებული'
        REJECTED = 'rejected', 'უარყოფილი'
        CANCELLED = 'cancelled', 'გაუქმებული'

    # ჯავშნის ავტორი და არჩეული ნომერი
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='bookings',
    )
    room = models.ForeignKey(
        'hotels.Room',
        on_delete=models.PROTECT,
        related_name='bookings',
    )

    # ჯავშნის საკონტაქტო მონაცემები
    contact_name = models.CharField(max_length=200)
    contact_phone = models.CharField(max_length=20)
    check_in = models.DateField()
    check_out = models.DateField()

    # დაჯავშნისას დაფიქსირებული ფასები
    price_per_night = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        editable=False,
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        editable=False,
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.CONFIRMED,
        editable=False,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
        editable=False,
    )

    class Meta:
        # ახალი ჯავშნები პირველ რიგში
        ordering = ['-created_at']
        verbose_name = 'ჯავშანი'
        verbose_name_plural = 'ჯავშნები'

        constraints = [
            # გასვლა შესვლის შემდეგ უნდა იყოს
            models.CheckConstraint(
                condition=models.Q(check_out__gt=models.F('check_in')),
                name='booking_checkout_after_checkin',
            ),

            # ფასები დადებითი უნდა იყოს
            models.CheckConstraint(
                condition=models.Q(price_per_night__gt=0),
                name='booking_nightly_price_positive',
            ),
            models.CheckConstraint(
                condition=models.Q(total_price__gt=0),
                name='booking_total_price_positive',
            ),

            # სტატუსისა და გაუქმების დროის შესაბამისობა
            models.CheckConstraint(
                condition=(
                    models.Q(
                        status__in=('pending', 'confirmed', 'rejected'),
                        cancelled_at__isnull=True,
                    )
                    | models.Q(
                        status='cancelled',
                        cancelled_at__isnull=False,
                    )
                ),
                name='booking_status_matches_cancellation',
            ),
        ]

    def __str__(self):
        return f'ჯავშანი #{self.pk} — ნომერი {self.room_id}'
