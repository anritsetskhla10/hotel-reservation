import { useState } from 'react'
import { Link } from 'react-router'

import { postWithCsrf } from '../lib/api'

type CreatedBooking = {
  id: number
  total_price: string
}

const fields = [
  { name: 'contact_name', label: 'საკონტაქტო სახელი და გვარი', type: 'text', maxLength: 200 },
  { name: 'contact_phone', label: 'ტელეფონი', type: 'tel', maxLength: 20 },
  { name: 'check_in', label: 'შესვლის თარიღი', type: 'date' },
  { name: 'check_out', label: 'გასვლის თარიღი', type: 'date' },
]

export default function BookingForm({ roomId }: { roomId: number }) {
  const [booking, setBooking] = useState<CreatedBooking | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [error, setError] = useState('')

  if (booking) {
    return (
      <p role="status" className="rounded-2xl border border-green-200 bg-white p-5">
        ჯავშანი #{booking.id} დადასტურებულია. ჯამი {booking.total_price} ₾.
      </p>
    )
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 sm:p-8"
      onSubmit={async (event) => {
        event.preventDefault()
        if (submitting) return

        const data = new FormData(event.currentTarget)
        setSubmitting(true)
        setNeedsLogin(false)
        setError('')

        try {
          const response = await postWithCsrf('/api/bookings/', {
            room: roomId,
            contact_name: data.get('contact_name'),
            contact_phone: data.get('contact_phone'),
            check_in: data.get('check_in'),
            check_out: data.get('check_out'),
          })

          if (response.status === 403) {
            setNeedsLogin(true)
            setError('დაჯავშნისთვის შედით ანგარიშში.')
          } else if (response.status === 400) {
            const errors: Record<string, string[]> | null =
              await response.json().catch(() => null)
            const message = errors && Object.values(errors).flat()[0]
            setError(message || 'შეამოწმეთ დაჯავშნის მონაცემები.')
          } else if (!response.ok) {
            setError('ჯავშნის შექმნა ვერ მოხერხდა. სცადეთ ხელახლა.')
          } else {
            setBooking(await response.json())
          }
        } catch {
          setError('სერვერთან დაკავშირება ვერ მოხერხდა.')
        } finally {
          setSubmitting(false)
        }
      }}
    >
      <h2 className="text-xl font-semibold">ნომრის დაჯავშნა</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ name, label, type, maxLength }) => (
          <label key={name} className="block space-y-1 text-sm">
            <span>{label}</span>
            <input
              name={name}
              type={type}
              maxLength={maxLength}
              required
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {needsLogin && <Link to="/login" className="block text-brand underline">შესვლა</Link>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {submitting ? 'ჯავშანი იგზავნება…' : 'დაჯავშნა'}
      </button>
    </form>
  )
}