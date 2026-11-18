from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.generics import GenericAPIView, ListAPIView, ListCreateAPIView
from rest_framework.response import Response

from accounts.permissions import IsSiteUser

from .models import Booking
from .serializers import BookingCreateSerializer, BookingListFilters, BookingSerializer
from .services import (
    BookingConflict, OwnHotelBookingDenied, cancel_booking, create_booking,
    decide_booking,
)


# საკუთარი ჯავშნების სია და ახალი მოთხოვნის შექმნა
class BookingListCreateView(ListCreateAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    serializer_class = BookingSerializer

    def get_queryset(self):
        bookings = Booking.objects.filter(
            user=self.request.user,
        ).select_related('room__hotel__city')

        # ქალაქის ფილტრის შემოწმება
        filters = BookingListFilters(data=self.request.query_params.dict())
        filters.is_valid(raise_exception=True)

        city_id = filters.validated_data.get('city')
        if city_id is not None:
            bookings = bookings.filter(room__hotel__city_id=city_id)

        return bookings

    # სერიალიზერის არჩევა მოთხოვნის მეთოდით
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer

        return BookingSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # მოთხოვნის შექმნა მოლოდინის სტატუსით
        try:
            booking = create_booking(
                user=request.user,
                status=Booking.Status.PENDING,
                **serializer.validated_data,
            )
        except OwnHotelBookingDenied as error:
            raise PermissionDenied({
                'code': 'own_hotel_booking',
                'detail': str(error),
            }) from error
        except DjangoValidationError as error:
            # სერვისის შეცდომის API პასუხად გარდაქმნა
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


# ჯავშნის გაუქმება
class BookingCancelView(GenericAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    serializer_class = BookingSerializer

    def post(self, request, pk):
        try:
            booking = cancel_booking(user=request.user, booking_id=pk)
        except BookingConflict as error:
            return Response(
                {'detail': str(error)},
                status=status.HTTP_409_CONFLICT,
            )
        except (DjangoPermissionDenied, DjangoValidationError) as error:
            raise NotFound('ჯავშანი ვერ მოიძებნა.') from error

        return Response(self.get_serializer(booking).data)


# მფლობელის სასტუმროებში შემოსული მოთხოვნები
class IncomingBookingListView(ListAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(
            room__hotel__owner=self.request.user,
        ).select_related('room__hotel__city')


# მფლობელის მიერ დადასტურება ან უარყოფა
class BookingDecisionView(GenericAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsSiteUser]
    serializer_class = BookingSerializer
    confirm = False

    def post(self, request, pk):
        try:
            booking = decide_booking(
                owner=request.user,
                booking_id=pk,
                confirm=self.confirm,
            )
        except Booking.DoesNotExist as error:
            raise NotFound('ჯავშანი ვერ მოიძებნა.') from error
        except BookingConflict as error:
            return Response(
                {'detail': str(error)},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(self.get_serializer(booking).data)
