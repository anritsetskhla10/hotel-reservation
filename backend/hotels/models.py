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
