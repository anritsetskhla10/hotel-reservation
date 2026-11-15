from rest_framework.permissions import BasePermission


class IsSiteUser(BasePermission):
    message = 'ადმინისტრატორის ანგარიში გამოიყენეთ Django Admin-ში.'

    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and user.is_active and not user.is_staff
