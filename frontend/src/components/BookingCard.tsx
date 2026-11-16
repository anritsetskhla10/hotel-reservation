import type { ReactNode } from 'react'

import { displayBookingDate } from '../lib/bookingDates'
import type { Booking } from '../types/api'

const statusStyles: Record<Booking['status'], string> = {
  confirmed: 'bg-soft text-brand',
  pending: 'bg-amber-100 text-amber-900',
  rejected: 'bg-rose-100 text-rose-900',
  cancelled: 'bg-stone-100 text-stone-700',
}

export default function BookingCard({ booking, children }: { booking: Booking; children?: ReactNode }) {
  const photo = booking.hotel_photo ?? booking.room_photo

  return (
    <article className="d-panel space-y-3">
      <div className={photo ? 'grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4' : ''}>
        {photo && <img src={photo} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover sm:aspect-4/3" />}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-1.5">
            <h3 className="wrap-break-word text-lg font-semibold">{booking.hotel_name}</h3>
            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusStyles[booking.status]}`}>
              {booking.status_display}
            </span>
          </div>
          <p className="text-sm text-stone-600">{booking.city.name} · {booking.room_name}</p>
          <p className="text-sm font-medium">
            {displayBookingDate(booking.check_in)} – {displayBookingDate(booking.check_out)}
          </p>
          <p className="text-sm font-semibold tabular-nums">{booking.total_price} ₾</p>
        </div>
      </div>
      <details className="border-t border-surface-border pt-2">
        <summary className="w-fit cursor-pointer rounded-sm py-2 text-sm font-semibold text-brand">ჯავშნის დეტალები</summary>
        <dl className="grid gap-3 pt-2 text-sm sm:grid-cols-2">
          <div><dt className="text-stone-600">ღამის ფასი</dt><dd>{booking.price_per_night} ₾</dd></div>
          <div><dt className="text-stone-600">საკონტაქტო პირი</dt><dd className="wrap-break-word">{booking.contact_name}</dd></div>
          <div><dt className="text-stone-600">ტელეფონი</dt><dd>{booking.contact_phone}</dd></div>
        </dl>
      </details>
      {children}
    </article>
  )
}
