from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
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
    # გამოქვეყნების სტატუსები
    class PublicationStatus(models.TextChoices):
        PENDING = 'pending', 'განხილვის მოლოდინში'
        PUBLISHED = 'published', 'გამოქვეყნებული'

    # სასტუმროს მფლობელი
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='owned_hotels',
        null=True,
        blank=True,
        limit_choices_to={'is_staff': False},
        verbose_name='მფლობელი',
    )
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

    # ახალი სასტუმრო განხილვას ელოდება
    publication_status = models.CharField(
        max_length=9,
        choices=PublicationStatus.choices,
        default=PublicationStatus.PENDING,
        verbose_name='გამოქვეყნების სტატუსი',
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'სასტუმრო'
        verbose_name_plural = 'სასტუმროები'

    def __str__(self):
        return self.name


class Room(models.Model):
    # ნომრის ტიპები
    class RoomType(models.TextChoices):
        SINGLE = 'single', 'ერთადგილიანი'
        DOUBLE = 'double', 'ორადგილიანი ორმაგი საწოლით'
        TWIN = 'twin', 'ორადგილიანი ცალკე საწოლებით'
        TRIPLE = 'triple', 'სამადგილიანი'
        FAMILY = 'family', 'საოჯახო'
        DELUXE = 'deluxe', 'დელუქსი'
        OTHER = 'other', 'სხვა'

    # ტიპის მიხედვით ფიქსირებული ტევადობა
    FIXED_CAPACITIES = {
        RoomType.SINGLE: 1,
        RoomType.DOUBLE: 2,
        RoomType.TWIN: 2,
        RoomType.TRIPLE: 3,
    }

    # საწყისი, შესაცვლელი ტევადობა
    DEFAULT_CAPACITIES = {
        RoomType.FAMILY: 4,
        RoomType.DELUXE: 2,
    }

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
            # ოთახის ნომერი სასტუმროს ფარგლებში უნიკალურია
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

    # ტევადობის შესაბამისობა ნომრის ტიპთან
    def clean(self):
        super().clean()
        fixed_capacity = self.FIXED_CAPACITIES.get(self.room_type)
        if fixed_capacity is not None and self.capacity != fixed_capacity:
            raise ValidationError({
                'capacity': f'ამ ტიპის ნომრის ტევადობა უნდა იყოს {fixed_capacity}.',
            })

    def __str__(self):
        return f'{self.name} — №{self.room_number}'


# სასტუმროს დამატებითი ფოტოები
class HotelPhoto(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='gallery')
    image = models.ImageField('ფოტო', upload_to='hotels/gallery/')
    caption = models.CharField('აღწერა', max_length=200, blank=True)
    position = models.PositiveIntegerField('რიგითობა', default=0)

    class Meta:
        ordering = ['position', 'pk']
        verbose_name = 'სასტუმროს დამატებითი ფოტო'
        verbose_name_plural = 'სასტუმროს გალერეა'

    def __str__(self):
        return self.caption or self.image.name


# ნომრის დამატებითი ფოტოები
class RoomPhoto(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='gallery')
    image = models.ImageField('ფოტო', upload_to='rooms/gallery/')
    caption = models.CharField('აღწერა', max_length=200, blank=True)
    position = models.PositiveIntegerField('რიგითობა', default=0)

    class Meta:
        ordering = ['position', 'pk']
        verbose_name = 'ნომრის დამატებითი ფოტო'
        verbose_name_plural = 'ნომრის გალერეა'

    def __str__(self):
        return self.caption or self.image.name
