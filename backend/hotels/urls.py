from django.urls import path

from .views import CityListView, HotelDetailView, HotelListView, RoomDetailView, RoomListView

app_name = 'hotels'

urlpatterns = [
    path('cities/', CityListView.as_view(), name='city-list'),
    path('hotels/', HotelListView.as_view(), name='hotel-list'),
    path('hotels/<int:pk>/', HotelDetailView.as_view(), name='hotel-detail'),
    path('rooms/', RoomListView.as_view(), name='room-list'),
    path('rooms/<int:pk>/', RoomDetailView.as_view(), name='room-detail'),
]