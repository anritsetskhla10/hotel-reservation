import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { getJson } from '../lib/api'
import type { Booking } from '../types/api'

const columns = ['სასტუმრო', 'ნომერი', 'კონტაქტი', 'თარიღები', 'ჯამი', 'სტატუსი']
const cellClass = 'px-4 py-3 align-top'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    getJson<Booking[]>('/api/bookings/', controller.signal)
      .then(setBookings)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        if (error instanceof Error && error.message === 'HTTP 403') {
          setNeedsLogin(true)
        } else {
          setError('ჯავშნების ჩატვირთვა ვერ მოხერხდა.')
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">ჩემი ჯავშნები</h1>

      {needsLogin && (
        <p>
          ჯავშნების სანახავად{' '}
          <Link to="/login" className="font-medium text-brand underline">
            შედით ანგარიშში
          </Link>.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {!needsLogin && !error && bookings === null && <p role="status">იტვირთება…</p>}
      {bookings?.length === 0 && <p>ჯავშნები ვერ მოიძებნა.</p>}

      {bookings && bookings.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="bg-stone-100">
              <tr>
                {columns.map((column) => (
                  <th key={column} scope="col" className={cellClass}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-t border-stone-200">
                  <td className={cellClass}>
                    {booking.hotel_photo && (
                      <img src={booking.hotel_photo} alt="" loading="lazy"
                        className="mb-2 h-12 w-20 rounded object-cover" />
                    )}
                    <p className="font-medium">{booking.hotel_name}</p>
                    <p>{booking.city.name}</p>
                  </td>
                  <td className={cellClass}>
                    {booking.room_photo && (
                      <img src={booking.room_photo} alt="" loading="lazy"
                        className="mb-2 h-12 w-20 rounded object-cover" />
                    )}
                    <p>{booking.room_name}</p>
                    <p>{booking.price_per_night} ₾ / ღამე</p>
                  </td>
                  <td className={cellClass}>
                    <p>{booking.contact_name}</p>
                    <p>{booking.contact_phone}</p>
                  </td>
                  <td className={`${cellClass} whitespace-nowrap`}>
                    <p>შესვლა · {booking.check_in}</p>
                    <p>გასვლა · {booking.check_out}</p>
                  </td>
                  <td className={`${cellClass} whitespace-nowrap font-medium`}>
                    {booking.total_price} ₾
                  </td>
                  <td className={cellClass}>{booking.status_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}