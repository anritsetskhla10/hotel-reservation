import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { postWithCsrf } from '../lib/api'

export type BookingDates = {
  check_in: string
  check_out: string
}

type BookingFormProps = {
  roomId: number
  pricePerNight: string
  dates: BookingDates
  onDateChange: (field: keyof BookingDates, value: string) => void
  onBookingCreated: () => void
}

type CreatedBooking = {
  id: number
  total_price: string
  status_display: string
}

const fields = [
  { name: 'contact_name', label: 'საკონტაქტო სახელი და გვარი', type: 'text', maxLength: 200 },
  { name: 'contact_phone', label: 'ტელეფონი', type: 'tel', maxLength: 20 },
  { name: 'check_in', label: 'შესვლის თარიღი', type: 'date' },
  { name: 'check_out', label: 'გასვლის თარიღი', type: 'date' },
] as const

function countNights({ check_in, check_out }: BookingDates) {
  const start = Date.parse(`${check_in}T00:00:00Z`)
  const end = Date.parse(`${check_out}T00:00:00Z`)
  const nights = (end - start) / 86_400_000

  return Number.isInteger(nights) && nights > 0 ? nights : 0
}

function calculateTotal(price: string, nights: number) {
  const [lari, tetri = ''] = price.split('.')
  const total = (BigInt(lari) * 100n + BigInt(tetri.padEnd(2, '0'))) * BigInt(nights)

  return `${total / 100n}.${String(total % 100n).padStart(2, '0')}`
}

export default function BookingForm({
  roomId,
  pricePerNight,
  dates,
  onDateChange,
  onBookingCreated,
}: BookingFormProps) {
  const [booking, setBooking] = useState<CreatedBooking | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [error, setError] = useState('')
  const nights = countNights(dates)
  const total = nights > 0 ? calculateTotal(pricePerNight, nights) : null

  const roomQuery = new URLSearchParams()
  if (dates.check_in) roomQuery.set('check_in', dates.check_in)
  if (dates.check_out) roomQuery.set('check_out', dates.check_out)

  const returnPath = roomQuery.size > 0
    ? `/rooms/${roomId}?${roomQuery}`
    : `/rooms/${roomId}`
  const loginPath = `/login?${new URLSearchParams({ next: returnPath })}`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const data = new FormData(event.currentTarget)
    setNeedsLogin(false)
    setError('')

    if (nights === 0) {
      setError('გასვლის თარიღი შესვლაზე გვიან უნდა იყოს.')
      return
    }

    setSubmitting(true)

    try {
      const response = await postWithCsrf('/api/bookings/', {
        room: roomId,
        contact_name: data.get('contact_name'),
        contact_phone: data.get('contact_phone'),
        check_in: dates.check_in,
        check_out: dates.check_out,
      })

      if (response.status === 401 || response.status === 403) {
        const denial: { code?: string; detail?: string } | null =
          await response.json().catch(() => null)

        if (denial?.code === 'own_hotel_booking' && denial.detail) {
          setError(denial.detail)
          return
        }

        setNeedsLogin(true)
        setError('დაჯავშნისთვის შედით ანგარიშში.')
        return
      }

      if (response.status === 400) {
        const errors: string[] | Record<string, string | string[]> | null =
          await response.json().catch(() => null)
        const message = errors && Object.values(errors).flat()[0]

        setError(message || 'შეამოწმეთ დაჯავშნის მონაცემები.')
        return
      }

      if (!response.ok) {
        setError('ჯავშნის შექმნა ვერ მოხერხდა. სცადეთ ხელახლა.')
        return
      }

      const createdBooking: CreatedBooking = await response.json()
      setBooking(createdBooking)
      onBookingCreated()
    } catch {
      setError('სერვერთან დაკავშირება ვერ მოხერხდა.')
    } finally {
      setSubmitting(false)
    }
  }

  if (booking) {
    return (
      <div role="status" className="space-y-2 rounded-2xl border border-green-200 bg-white p-5">
        <p>მოთხოვნა #{booking.id} გაიგზავნა. სტატუსი: {booking.status_display}. ჯამი {booking.total_price} ₾.</p>
        <Link to="/profile?tab=bookings" className="font-medium text-brand underline">
          ჯავშნის ნახვა პროფილში
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="d-panel space-y-4"
    >
      <h2 className="text-xl font-semibold">ნომრის დაჯავშნა</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const { name, label, type } = field
          const isDate = name === 'check_in' || name === 'check_out'

          return (
            <label key={name} className="block space-y-1 text-sm">
              <span>{label}</span>
              <input
                name={name}
                type={type}
                maxLength={'maxLength' in field ? field.maxLength : undefined}
                value={isDate ? dates[name] : undefined}
                onChange={(event) => {
                  if (isDate) onDateChange(name, event.currentTarget.value)
                }}
                required
                disabled={submitting}
                className="d-control"
              />
            </label>
          )
        })}
      </div>

      <section className="space-y-2 rounded-xl bg-soft p-4" aria-live="polite">
        <h3 className="font-semibold">ფასის შეჯამება</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt>ღამის ფასი</dt>
            <dd className="tabular-nums">{pricePerNight} ₾</dd>
          </div>
          {total !== null && (
            <>
              <div className="flex justify-between gap-3">
                <dt>ღამეების რაოდენობა</dt>
                <dd className="tabular-nums">{nights}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-stone-200 pt-2 font-semibold">
                <dt>სავარაუდო ჯამი</dt>
                <dd className="tabular-nums">{total} ₾</dd>
              </div>
            </>
          )}
        </dl>
        {total === null && (
          <p className="text-sm text-stone-600">ჯამის სანახავად აირჩიეთ შესვლისა და გასვლის თარიღები.</p>
        )}
      </section>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      {needsLogin && (
        <Link to={loginPath} className="block text-brand underline">
          შესვლა და დაჯავშნის გაგრძელება
        </Link>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="d-button w-full"
      >
        {submitting ? 'ჯავშანი იგზავნება…' : 'დაჯავშნა'}
      </button>
    </form>
  )
}
