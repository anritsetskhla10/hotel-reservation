from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.services import overlapping_bookings

from .models import Hotel, Room


class AvailabilityQuerySerializer(serializers.Serializer):
    start = serializers.DateField()
    end = serializers.DateField()

    def validate(self, attrs):
        days = (attrs['end'] - attrs['start']).days

        if not 1 <= days <= 62:
            raise serializers.ValidationError({
                'end': 'აირჩიეთ 1-დან 62 დღემდე პერიოდი.'
            })

        return attrs


class RoomAvailabilityView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk):
        room = get_object_or_404(
            Room,
            pk=pk,
            is_active=True,
            hotel__is_active=True,
            hotel__publication_status=Hotel.PublicationStatus.PUBLISHED,
        )

        query = AvailabilityQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        start = query.validated_data['start']
        end = query.validated_data['end']

        bookings = overlapping_bookings(start, end).filter(room=room)
        booked_dates = set()

        for check_in, check_out in bookings.values_list('check_in', 'check_out'):
            day = max(start, check_in)
            last_day = min(end, check_out)

            while day < last_day:
                booked_dates.add(day.isoformat())
                day += timedelta(days=1)

        return Response({
            'room': room.pk,
            'start': start.isoformat(),
            'end': end.isoformat(),
            'today': timezone.localdate().isoformat(),
            'booked_dates': sorted(booked_dates),
        })
