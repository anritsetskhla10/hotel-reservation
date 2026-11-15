import { useEffect, useState } from 'react'

import { getJson, postWithCsrf } from '../lib/api'
import type { Booking } from '../types/api'

export default function IncomingBookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [decisionError, setDecisionError] = useState('')
  const [notice, setNotice] = useState('')
  const [updating, setUpdating] = useState(false)

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
    if (updating) return
    setUpdating(true)
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
      setUpdating(false)
    }
  }

  if (loadError) return <p role="alert">{loadError}</p>
  if (!bookings) return <p role="status">მოთხოვნები იტვირთება…</p>

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">შემოსული მოთხოვნები</h2>
      {bookings.length === 0 && <p>შემოსული მოთხოვნები ჯერ არ გაქვთ.</p>}
      {decisionError && <p role="alert" className="text-red-700">{decisionError}</p>}
      {notice && <p role="status">{notice}</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {bookings.map((booking) => (
          <li key={booking.id} className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4">
            <h3 className="font-semibold">{booking.hotel_name} · {booking.room_name}</h3>
            <p>#{booking.id} · {booking.status_display}</p>
            <p>{booking.check_in} → {booking.check_out} · {booking.total_price} ₾</p>
            <p>{booking.contact_name} · {booking.contact_phone}</p>
            {booking.status === 'pending' && (
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" disabled={updating} onClick={() => void decide(booking.id, 'confirm')}
                  className="rounded-lg bg-brand px-3 py-2 text-sm text-white disabled:opacity-60">
                  დადასტურება
                </button>
                <button type="button" disabled={updating} onClick={() => void decide(booking.id, 'reject')}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-60">
                  უარყოფა
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
