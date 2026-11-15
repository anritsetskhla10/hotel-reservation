import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import FilterSidebar from '../components/FilterSidebar'
import { getJson, postWithCsrf } from '../lib/api'
import type { Booking, City } from '../types/api'

const columns = [
  'სასტუმრო',
  'ნომერი',
  'კონტაქტი',
  'თარიღები',
  'ჯამი',
  'სტატუსი',
]

const cellClass = 'px-4 py-3 align-top'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [cityId, setCityId] = useState('')
  const [cityError, setCityError] = useState('')
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    getJson<City[]>('/api/cities/', controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setCities(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCityError('ქალაქების ჩატვირთვა ვერ მოხერხდა.')
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const query = cityId
      ? `?${new URLSearchParams({ city: cityId })}`
      : ''

    getJson<Booking[]>(`/api/bookings/${query}`, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setBookings(data)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        if (error instanceof Error && error.message === 'HTTP 403') {
          setNeedsLogin(true)
        } else {
          setError('ჯავშნების ჩატვირთვა ვერ მოხერხდა.')
        }
      })

    return () => controller.abort()
  }, [cityId])

  async function handleCancel(bookingId: number) {
    if (cancellingId !== null) return
    if (!window.confirm('გსურთ ამ ჯავშნის გაუქმება?')) return

    setCancellingId(bookingId)
    setCancelError('')

    try {
      const response = await postWithCsrf(
        `/api/bookings/${bookingId}/cancel/`,
        {},
      )

      if (!response.ok) {
        setCancelError('ჯავშნის გაუქმება ვერ მოხერხდა. სცადეთ ხელახლა.')
        return
      }

      const updatedBooking: Booking = await response.json()

      setBookings((current) =>
        current?.map((booking) =>
          booking.id === updatedBooking.id ? updatedBooking : booking,
        ) ?? null,
      )
    } catch {
      setCancelError('სერვერთან დაკავშირება ვერ მოხერხდა.')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <h2 className="text-3xl font-semibold">ჩემი ჯავშნები</h2>

      <div className={`grid items-start gap-5 ${needsLogin ? '' : 'lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-6'}`}>
        {!needsLogin && (
          <FilterSidebar>
            <label className="block max-w-xs space-y-1 text-sm font-medium">
              <span>ქალაქი</span>
              <select
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 disabled:opacity-60"
                value={cityId}
                disabled={cancellingId !== null}
                onChange={(event) => {
                  setBookings(null)
                  setError('')
                  setCancelError('')
                  setCityId(event.target.value)
                }}
              >
                <option value="">ყველა ქალაქი</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>
  
            {cityError && <p role="alert">{cityError}</p>}
          </FilterSidebar>
        )}
        <div className="min-w-0 space-y-4">

          {needsLogin && (
            <p>
              ჯავშნების სანახავად{' '}
              <Link to="/login" className="font-medium text-brand underline">
                შედით ანგარიშში
              </Link>
              .
            </p>
          )}

          {error && <p role="alert">{error}</p>}
          {cancelError && (
            <p role="alert" className="text-sm text-red-700">{cancelError}</p>
          )}

          {!needsLogin && !error && bookings === null && (
            <p role="status">იტვირთება…</p>
          )}

          {bookings?.length === 0 && (
            <p role="status">ჯავშნები ვერ მოიძებნა.</p>
          )}

          {bookings && bookings.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="bg-stone-100">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} scope="col" className={cellClass}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-stone-200">
                      <td className={cellClass}>
                        {booking.hotel_photo && (
                          <img
                            src={booking.hotel_photo}
                            alt=""
                            loading="lazy"
                            className="mb-2 h-12 w-20 rounded object-cover"
                          />
                        )}
                        <p className="font-medium">{booking.hotel_name}</p>
                        <p>{booking.city.name}</p>
                      </td>

                      <td className={cellClass}>
                        {booking.room_photo && (
                          <img
                            src={booking.room_photo}
                            alt=""
                            loading="lazy"
                            className="mb-2 h-12 w-20 rounded object-cover"
                          />
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

                      <td className={cellClass}>
                        <p>{booking.status_display}</p>

                        {(booking.status === 'confirmed' || booking.status === 'pending') && (
                          <button
                            type="button"
                            onClick={() => void handleCancel(booking.id)}
                            disabled={cancellingId !== null}
                            className="mt-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            {cancellingId === booking.id ? 'უქმდება…' : 'გაუქმება'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
