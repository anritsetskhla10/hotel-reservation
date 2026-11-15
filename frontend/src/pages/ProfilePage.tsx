import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { getJson, postWithCsrf } from '../lib/api'
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

const tabClass =
  'rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-100 ' +
  'aria-[current=page]:bg-brand aria-[current=page]:text-white ' +
  'aria-[current=page]:hover:bg-brand-hover'

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = searchParams.get('tab')
  const showingBookings = tab === 'bookings'
  const showingHotels = tab === 'hotels'
  const showingIncoming = tab === 'incoming'
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

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">ჩემი პროფილი</h1>

      {needsLogin && (
        <p>
          პროფილის სანახავად{' '}
          <Link to="/login" className="font-medium text-brand underline">
            შედით ანგარიშში
          </Link>
          .
        </p>
      )}

      {error && <p role="alert">{error}</p>}
      {!needsLogin && !error && !profile && (
        <p role="status">პროფილი იტვირთება…</p>
      )}

      {profile && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5">
            <p className="text-xl font-semibold">{fullName}</p>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="rounded-lg border border-stone-300 px-4 py-2 hover:bg-stone-100 disabled:opacity-60"
            >
              {loggingOut ? 'გამოსვლა მიმდინარეობს…' : 'გამოსვლა'}
            </button>
          </div>

          {logoutError && <p role="alert">{logoutError}</p>}

          <nav aria-label="პროფილის ნავიგაცია" className="flex flex-wrap gap-2">
            <Link
              to="/profile"
              aria-current={!showingBookings && !showingHotels && !showingIncoming ? 'page' : undefined}
              className={tabClass}
            >
              პირადი ინფორმაცია
            </Link>
            <Link
              to="/profile?tab=bookings"
              aria-current={showingBookings ? 'page' : undefined}
              className={tabClass}
            >
              ჩემი ჯავშნები
            </Link>
            <Link
              to="/profile?tab=hotels"
              aria-current={showingHotels ? 'page' : undefined}
              className={tabClass}
            >
              ჩემი სასტუმროები
            </Link>
            <Link
              to="/profile?tab=incoming"
              aria-current={showingIncoming ? 'page' : undefined}
              className={tabClass}
            >
              შემოსული მოთხოვნები
            </Link>
          </nav>

          {showingBookings ? (
            <BookingsPage />
          ) : showingHotels ? (
            <MyHotelsPage />
          ) : showingIncoming ? (
            <IncomingBookingsPage />
          ) : (
            <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="text-xl font-semibold">პირადი ინფორმაცია</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ['სახელი და გვარი', fullName],
                  ['მომხმარებლის სახელი', profile.username],
                  ['ელფოსტა', profile.email],
                  ['ტელეფონი', profile.phone],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm text-stone-600">{label}</dt>
                    <dd className="wrap-break-word font-medium">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </>
      )}
    </main>
  )
}

