from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

class City(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'ქალაქი'
        verbose_name_plural = 'ქალაქები'

    def __str__(self):
        return self.name


class Hotel(models.Model):
    city = models.ForeignKey(
        City,
        on_delete=models.PROTECT,
        related_name='hotels',
    )
    name = models.CharField(max_length=200)
    description = models.TextField()
    address = models.CharField(max_length=255)
    photo = models.ImageField(upload_to='hotels/')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'სასტუმრო'
        verbose_name_plural = 'სასტუმროები'

    def __str__(self):
        return self.name


class Room(models.Model):
    class RoomType(models.TextChoices):
        SINGLE = 'single', 'ერთადგილიანი'
        DOUBLE = 'double', 'ორადგილიანი'
        DELUXE = 'deluxe', 'დელუქსი'

    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.PROTECT,
        related_name='rooms',
    )
    room_number = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    room_type = models.CharField(
        max_length=10,
        choices=RoomType.choices,
    )
    description = models.TextField()
    price_per_night = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    capacity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
    )
    photo = models.ImageField(upload_to='rooms/')
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['hotel_id', 'room_number']
        verbose_name = 'ნომერი'
        verbose_name_plural = 'ნომრები'

        constraints = [
            models.UniqueConstraint(
                fields=['hotel', 'room_number'],
                name='unique_room_number_per_hotel',
            ),
            models.CheckConstraint(
                condition=models.Q(price_per_night__gt=0),
                name='room_price_positive',
            ),
            models.CheckConstraint(
                condition=models.Q(capacity__gte=1),
                name='room_capacity_at_least_one',
            ),
        ]

    def __str__(self):
        return f'{self.name} — №{self.room_number}'
