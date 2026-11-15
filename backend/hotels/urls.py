from django.urls import path

from .views import CityListView, HotelDetailView, HotelListView, RoomDetailView, RoomListView
from .availability import RoomAvailabilityView
from .owner_gallery import (
    MyHotelPhotoDetailView, MyHotelPhotoListCreateView,
    MyRoomPhotoDetailView, MyRoomPhotoListCreateView,
)
from .owner_views import (
    MyHotelEditView, MyHotelListCreateView, MyRoomEditView, MyRoomFeaturedView,
    MyRoomListCreateView,
)

app_name = 'hotels'

urlpatterns = [
    path('cities/', CityListView.as_view(), name='city-list'),
    path('hotels/', HotelListView.as_view(), name='hotel-list'),
    path('my/hotels/', MyHotelListCreateView.as_view(), name='my-hotel-list'),
    path('my/hotels/<int:pk>/', MyHotelEditView.as_view(), name='my-hotel-edit'),
    path(
        'my/hotels/<int:hotel_id>/photos/',
        MyHotelPhotoListCreateView.as_view(),
        name='my-hotel-photo-list',
    ),
    path(
        'my/hotels/<int:hotel_id>/photos/<int:pk>/',
        MyHotelPhotoDetailView.as_view(),
        name='my-hotel-photo-detail',
    ),
    path(
        'my/hotels/<int:hotel_id>/rooms/',
        MyRoomListCreateView.as_view(),
        name='my-room-list',
    ),
    path(
        'my/hotels/<int:hotel_id>/rooms/<int:room_id>/',
        MyRoomEditView.as_view(),
        name='my-room-edit',
    ),
    path(
        'my/hotels/<int:hotel_id>/rooms/<int:room_id>/photos/',
        MyRoomPhotoListCreateView.as_view(),
        name='my-room-photo-list',
    ),
    path(
        'my/hotels/<int:hotel_id>/rooms/<int:room_id>/photos/<int:pk>/',
        MyRoomPhotoDetailView.as_view(),
        name='my-room-photo-detail',
    ),
    path(
        'my/hotels/<int:hotel_id>/rooms/<int:room_id>/featured/',
        MyRoomFeaturedView.as_view(),
        name='my-room-featured',
    ),
    path('hotels/<int:pk>/', HotelDetailView.as_view(), name='hotel-detail'),
    path('rooms/', RoomListView.as_view(), name='room-list'),
    path('rooms/<int:pk>/', RoomDetailView.as_view(), name='room-detail'),
    path(
        'rooms/<int:pk>/availability/',
        RoomAvailabilityView.as_view(),
        name='room-availability',
    ),
]
