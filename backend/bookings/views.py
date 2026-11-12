from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.generics import GenericAPIView, ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Booking
from .serializers import BookingCreateSerializer, BookingListFilters, BookingSerializer
from .services import cancel_booking, create_booking



class BookingListCreateView(ListCreateAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        bookings = Booking.objects.select_related('room__hotel__city')

        if not (user.is_staff and user.has_perm('bookings.view_booking')):
            bookings = bookings.filter(user=user)

        filters = BookingListFilters(data=self.request.query_params.dict())
        filters.is_valid(raise_exception=True)

        city_id = filters.validated_data.get('city')
        if city_id is not None:
            bookings = bookings.filter(room__hotel__city_id=city_id)

        return bookings

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer

        return BookingSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            booking = create_booking(
                user=request.user,
                **serializer.validated_data,
            )
        except DjangoValidationError as error:
            if hasattr(error, 'error_dict'):
                detail = error.message_dict
            else:
                detail = error.messages

            raise ValidationError(detail) from error

        response_data = BookingSerializer(
            booking,
            context=self.get_serializer_context(),
        ).data
        return Response(response_data, status=status.HTTP_201_CREATED)

class BookingCancelView(GenericAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer

    def post(self, request, pk):
        try:
            booking = cancel_booking(user=request.user, booking_id=pk)
        except (DjangoPermissionDenied, DjangoValidationError) as error:
            raise NotFound('ჯავშანი ვერ მოიძებნა.') from error

        return Response(self.get_serializer(booking).data)