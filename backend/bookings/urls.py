from django.urls import path

from .views import (
    BookingCancelView, BookingDecisionView, BookingListCreateView,
    IncomingBookingListView,
)

app_name = 'bookings'

urlpatterns = [
    path('', BookingListCreateView.as_view(), name='booking-list'),
    path('incoming/', IncomingBookingListView.as_view(), name='booking-incoming'),
    path('<int:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('<int:pk>/confirm/', BookingDecisionView.as_view(confirm=True), name='booking-confirm'),
    path('<int:pk>/reject/', BookingDecisionView.as_view(), name='booking-reject'),
]
