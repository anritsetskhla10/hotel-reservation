from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Contact information', {'fields': ('phone',)}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Personal information', {
            'fields': ('first_name', 'last_name', 'email', 'phone'),
        }),
    )

    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'phone',
        'is_staff',
    )