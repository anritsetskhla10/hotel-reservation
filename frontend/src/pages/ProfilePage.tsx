import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { getJson, postWithCsrf } from '../lib/api'
import BookingCard from '../components/BookingCard'
import { todayInTbilisi } from '../lib/bookingDates'
import type { Booking } from '../types/api'
import BookingsPage from './BookingsPage'
import MyHotelsPage from './MyHotelsPage'
import IncomingBookingsPage from './IncomingBookingsPage'

type Profile = {
  username: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

const sections = [
  ['', 'მიმოხილვა'],
  ['bookings', 'ჩემი ჯავშნები'],
  ['hotels', 'ჩემი სასტუმროები'],
  ['incoming', 'შემოსული მოთხოვნები'],
  ['account', 'პირადი ინფორმაცია'],
] as const

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestedTab = searchParams.get('tab') ?? ''
  const tab = sections.find(([key]) => key === requestedTab)?.[0] ?? ''
  const [profile, setProfile] = useState<Profile | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [error, setError] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    getJson<Profile>('/api/auth/me/', controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setProfile(data)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        if (
          error instanceof Error &&
          ['HTTP 401', 'HTTP 403'].includes(error.message)
        ) {
          setNeedsLogin(true)
        } else {
          setError('პროფილის ჩატვირთვა ვერ მოხერხდა.')
        }
      })

    return () => controller.abort()
  }, [])

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)
    setLogoutError('')

    try {
      const response = await postWithCsrf('/api/auth/logout/', {})

      if (!response.ok && response.status !== 401 && response.status !== 403) {
        throw new Error('Logout failed')
      }

      navigate('/login', { replace: true })
    } catch {
      setLogoutError('გამოსვლა ვერ მოხერხდა. სცადეთ ხელახლა.')
    } finally {
      setLoggingOut(false)
    }
  }

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username
    : ''

  if (!profile) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <section className="d-panel space-y-4">
          <h1 className="d-title">ჩემი პროფილი</h1>
          {needsLogin ? <Link to="/login" className="d-button">შედი ანგარიშში</Link>
            : error ? <p role="alert">{error}</p> : <p role="status">პროფილი იტვირთება…</p>}
        </section>
      </main>
    )
  }

  const initials = fullName.split(/\s+/).slice(0, 2).map((word) => word[0]).join('')

  return (
    <main className="mx-auto grid max-w-7xl items-start gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8 lg:py-9">
      <aside className="d-panel space-y-3 lg:sticky lg:top-5">
        <div className="flex items-center gap-3 border-b border-surface-border pb-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-soft font-semibold text-brand" aria-hidden="true">{initials}</span>
          <p className="min-w-0 wrap-break-word font-semibold">{fullName}</p>
        </div>
        <nav aria-label="პროფილის ნავიგაცია" className="grid grid-cols-2 gap-1 lg:grid-cols-1">
          {sections.map(([key, label]) => (
            <Link key={key} to={key ? `/profile?tab=${key}` : '/profile'}
              aria-current={tab === key ? 'page' : undefined}
              className="flex min-h-11 items-center rounded-md px-2.5 text-sm font-medium hover:bg-soft aria-[current=page]:bg-soft aria-[current=page]:font-semibold aria-[current=page]:text-brand">
              {label}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={() => void handleLogout()} disabled={loggingOut} className="d-button d-secondary w-full">
          {loggingOut ? 'გამოსვლა მიმდინარეობს…' : 'გამოსვლა'}
        </button>
        {logoutError && <p role="alert" className="text-sm text-red-700">{logoutError}</p>}
      </aside>
      <div className="min-w-0 space-y-5">
        {tab === 'bookings' ? <BookingsPage />
          : tab === 'hotels' ? <MyHotelsPage />
          : tab === 'incoming' ? <IncomingBookingsPage />
          : tab === 'account' ? (
            <>
              <h1 className="d-title">პირადი ინფორმაცია</h1>
              <dl className="d-panel grid gap-5 sm:grid-cols-2">
                {[
                  ['სახელი და გვარი', fullName],
                  ['მომხმარებლის სახელი', profile.username],
                  ['ელფოსტა', profile.email],
                  ['ტელეფონი', profile.phone],
                ].map(([label, value]) => (
                  <div key={label}><dt className="text-sm text-stone-600">{label}</dt><dd className="wrap-break-word font-medium">{value || '—'}</dd></div>
                ))}
              </dl>
            </>
          ) : <ProfileOverview name={profile.first_name || profile.username} />}
      </div>
    </main>
  )
}

function ProfileOverview({ name }: { name: string }) {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [incoming, setIncoming] = useState<Booking[] | null>(null)
  const [bookingError, setBookingError] = useState(false)
  const [incomingError, setIncomingError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getJson<Booking[]>('/api/bookings/', controller.signal)
      .then((data) => { if (!controller.signal.aborted) setBookings(data) })
      .catch(() => { if (!controller.signal.aborted) setBookingError(true) })
    getJson<Booking[]>('/api/bookings/incoming/', controller.signal)
      .then((data) => { if (!controller.signal.aborted) setIncoming(data) })
      .catch(() => { if (!controller.signal.aborted) setIncomingError(true) })
    return () => controller.abort()
  }, [])

  const today = todayInTbilisi()
  const nextBooking = bookings?.filter((item) => item.status === 'confirmed' && item.check_out > today)
    .sort((a, b) => a.check_in.localeCompare(b.check_in))[0]
  const pending = bookings?.filter((item) => item.status === 'pending' && item.check_out > today).length ?? 0
  const awaiting = incoming?.filter((item) => item.status === 'pending').length

  return (
    <>
      <h1 className="d-title">გამარჯობა, {name}</h1>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">უახლოესი ჯავშანი</h2>
          {bookingError ? <p role="alert" className="d-panel">ჯავშნები ვერ ჩაიტვირთა.</p>
            : !bookings ? <p role="status" className="d-panel">ჯავშნები იტვირთება…</p>
            : nextBooking ? <BookingCard booking={nextBooking} />
            : <p className="d-panel text-stone-600">მომავალი დადასტურებული ჯავშანი ჯერ არ გაქვს.</p>}
          <Link to="/profile?tab=bookings" className="d-button d-secondary">ჩემი ჯავშნების ნახვა</Link>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">სასტუმროს მართვა</h2>
          <div className="d-panel space-y-3">
            {incomingError ? <p role="alert">შემოსული მოთხოვნები ვერ ჩაიტვირთა.</p>
              : awaiting === undefined ? <p role="status">მოთხოვნები იტვირთება…</p>
              : <p className="font-medium">{awaiting ? `${awaiting} მოთხოვნა ელოდება პასუხს` : 'უპასუხო მოთხოვნები არ გაქვს.'}</p>}
            <Link to="/profile?tab=incoming" className="block text-sm font-semibold text-brand underline">შემოსული მოთხოვნების ნახვა</Link>
            <Link to="/profile?tab=hotels" className="block text-sm font-semibold text-brand underline">ჩემი სასტუმროები</Link>
          </div>
        </section>
      </div>
      {pending > 0 && <p className="d-notice">{pending} შენი მოთხოვნა მოლოდინშია. <Link to="/profile?tab=bookings&status=pending" className="font-semibold text-brand underline">სტატუსის ნახვა</Link></p>}
    </>
  )
}

