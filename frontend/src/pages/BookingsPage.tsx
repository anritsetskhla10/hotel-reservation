import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import BookingCard from '../components/BookingCard'
import { todayInTbilisi, displayBookingDate } from '../lib/bookingDates'
import { getJson, postWithCsrf } from '../lib/api'
import type { Booking, City } from '../types/api'

const views = [
  ['upcoming', 'მომავალი'],
  ['pending', 'მოლოდინში'],
  ['history', 'ისტორია'],
] as const

export default function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = views.find(([key]) => key === searchParams.get('status'))?.[0] ?? 'upcoming'
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [cityId, setCityId] = useState('')
  const [cityError, setCityError] = useState('')
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancelError, setCancelError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmId, setConfirmId] = useState<number | null>(null)

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

    setCancellingId(bookingId)
    setCancelError('')
    setNotice('')

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
      setConfirmId(null)
      setNotice('ჯავშანი გაუქმდა. ჩანაწერი ისტორიაშია.')
      selectStatus('history')

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

  function selectStatus(status: typeof views[number][0]) {
    const params = new URLSearchParams(searchParams)
    if (status === 'upcoming') params.delete('status')
    else params.set('status', status)
    setSearchParams(params)
  }

  const today = todayInTbilisi()
  const visibleBookings = bookings?.filter((booking) => {
    if (selected === 'pending') return booking.status === 'pending' && booking.check_out > today
    if (selected === 'upcoming') return booking.status === 'confirmed' && booking.check_out > today
    return booking.status === 'cancelled' || booking.status === 'rejected' || booking.check_out <= today
  })

  return (
    <section className="min-w-0 space-y-4">
      <h1 className="d-title">ჩემი ჯავშნები</h1>
      {needsLogin ? <Link to="/login" className="d-button">შედი ანგარიშში</Link> : (
        <div className="d-panel flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="ჯავშნის სტატუსი">
            {views.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={selected === key}
                className="d-button d-secondary aria-pressed:border-brand aria-pressed:bg-soft" disabled={cancellingId !== null}
                onClick={() => { setConfirmId(null); setNotice(''); setCancelError(''); selectStatus(key) }}>
                {label}
              </button>
            ))}
          </div>
          <label className="block w-full space-y-1 text-sm font-medium sm:w-44">
            <span>ქალაქი</span>
            <select className="d-control" value={cityId} disabled={cancellingId !== null}
              onChange={(event) => {
                setBookings(null)
                setError('')
                setNotice('')
                setCancelError('')
                setConfirmId(null)
                setCityId(event.target.value)
              }}>
              <option value="">ყველა ქალაქი</option>
              {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </label>
        </div>
      )}
      {cityError && <p role="alert" className="text-sm text-red-700">{cityError}</p>}
      {error && <p role="alert" className="d-panel">{error}</p>}
      {notice && <p role="status" className="d-notice">{notice}</p>}
      {!needsLogin && !error && !bookings && <p role="status" className="d-panel">ჯავშნები იტვირთება…</p>}
      {visibleBookings?.length === 0 && <p className="d-panel text-stone-600">ამ განყოფილებაში ჯავშანი არ არის.</p>}
      {visibleBookings?.map((booking) => (
        <BookingCard key={booking.id} booking={booking}>
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <div className="space-y-2">
              {confirmId === booking.id ? (
                <>
                  <p className="text-sm">გაუქმდეს {displayBookingDate(booking.check_in)} – {displayBookingDate(booking.check_out)} ჯავშანი?</p>
                  {cancelError && <p role="alert" className="text-sm text-red-700">{cancelError}</p>}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="d-button d-secondary border-red-200 text-red-700"
                      disabled={cancellingId !== null} onClick={() => void handleCancel(booking.id)}>
                      {cancellingId === booking.id ? 'უქმდება…' : 'გაუქმების დადასტურება'}
                    </button>
                    <button type="button" className="d-button d-secondary" disabled={cancellingId !== null}
                      onClick={() => { setConfirmId(null); setCancelError('') }}>დატოვება</button>
                  </div>
                </>
              ) : (
                <button type="button" className="d-button d-secondary" disabled={cancellingId !== null}
                  onClick={() => { setConfirmId(booking.id); setCancelError('') }}>ჯავშნის გაუქმება</button>
              )}
            </div>
          )}
        </BookingCard>
      ))}
    </section>
  )
}
