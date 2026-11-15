from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET

from django.db import IntegrityError, transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth import authenticate, login, logout

from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import JSONParser
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


from .permissions import IsSiteUser
from .serializers import LoginSerializer, RegisterSerializer


@require_GET
def csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})


@method_decorator(csrf_protect, name='dispatch')
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user = serializer.save()
        except IntegrityError as error:
            raise ValidationError({
                'detail': 'მომხმარებლის სახელი ან ელფოსტა უკვე გამოყენებულია.'
            }) from error

        return Response(
            {'id': user.pk, 'username': user.username},
            status=status.HTTP_201_CREATED,
        )


@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(request, **serializer.validated_data)
        if user is None:
            raise ValidationError({
                'detail': 'მომხმარებლის სახელი ან პაროლი არასწორია.'
            })

        if user.is_staff:
            raise PermissionDenied({
                'code': 'admin_only',
                'detail': IsSiteUser.message,
            })

        login(request, user)

        return Response({
            'id': user.pk,
            'username': user.username,
            'csrfToken': get_token(request),
        })

class MeView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]

    def get(self, request):
        user = request.user

        return Response({
            'id': user.pk,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone': user.phone,
        })

class LogoutView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
