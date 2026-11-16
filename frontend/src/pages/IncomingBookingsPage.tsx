import { useEffect, useState } from 'react'

import BookingCard from '../components/BookingCard'
import { getJson, postWithCsrf } from '../lib/api'
import type { Booking } from '../types/api'

export default function IncomingBookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [decisionError, setDecisionError] = useState('')
  const [notice, setNotice] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [errorId, setErrorId] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getJson<Booking[]>('/api/bookings/incoming/', controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setBookings(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError('მოთხოვნების ჩატვირთვა ვერ მოხერხდა.')
      })
    return () => controller.abort()
  }, [])

  async function decide(id: number, action: 'confirm' | 'reject') {
    if (updatingId !== null) return
    setUpdatingId(id)
    setErrorId(id)
    setDecisionError('')
    setNotice('')

    try {
      const response = await postWithCsrf(`/api/bookings/${id}/${action}/`, {})
      if (response.status === 409) {
        const data: { detail?: string } | null = await response.json().catch(() => null)
        setDecisionError(data?.detail || 'მოთხოვნის სტატუსი შეიცვალა. განაახლეთ გვერდი.')
        return
      }
      if (!response.ok) throw new Error('Booking decision failed')

      const updated: Booking = await response.json()
      setBookings((current) => current?.map((booking) => booking.id === id ? updated : booking) ?? [])
      setNotice(`მოთხოვნა #${id} — ${updated.status_display}.`)
    } catch {
      setDecisionError('გადაწყვეტილება ვერ შეინახა. სცადეთ ხელახლა.')
    } finally {
      setUpdatingId(null)
    }
  }

  const ordered = bookings?.toSorted((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'))

  return (
    <section className="space-y-4">
      <h1 className="d-title">შემოსული მოთხოვნები</h1>
      {loadError && <p role="alert" className="d-panel">{loadError}</p>}
      {!loadError && !bookings && <p role="status" className="d-panel">მოთხოვნები იტვირთება…</p>}
      {bookings?.length === 0 && <p className="d-panel">შემოსული მოთხოვნები ჯერ არ გაქვს.</p>}
      {notice && <p role="status" className="d-notice">{notice}</p>}
      {ordered?.map((booking) => (
        <BookingCard key={booking.id} booking={booking}>
          <p className="text-sm">სტუმარი · <strong>{booking.contact_name}</strong></p>
          {errorId === booking.id && decisionError && <p role="alert" className="text-sm text-red-700">{decisionError}</p>}
          {booking.status === 'pending' && (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={updatingId !== null} className="d-button"
                onClick={() => void decide(booking.id, 'confirm')}>
                {updatingId === booking.id ? 'მუშავდება…' : 'დადასტურება'}
              </button>
              <button type="button" disabled={updatingId !== null} className="d-button d-secondary"
                onClick={() => void decide(booking.id, 'reject')}>უარყოფა</button>
            </div>
          )}
        </BookingCard>
      ))}
    </section>
  )
}
