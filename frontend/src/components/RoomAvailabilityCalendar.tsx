import { useEffect, useState } from 'react'

import { getJson } from '../lib/api'

type Availability = {
  today: string
  booked_dates: string[]
}

type Month = {
  year: number
  month: number
}

type CalendarProps = {
  roomId: number
  bookingCreated: boolean
  readOnly?: boolean
  checkIn: string
  checkOut: string
  checkingRange: boolean
  onSelectDate: (date: string) => void
}

type CalendarDaysProps = CalendarProps & {
  start: string
  end: string
}

const weekdays = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი']

const checkInStyle = 'bg-emerald-800 text-white'
const checkOutStyle = 'bg-indigo-700 text-white'

const monthFormatter = new Intl.DateTimeFormat('ka-GE', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function currentMonth(): Month {
  const parts = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'numeric',
    timeZone: 'Asia/Tbilisi',
  }).formatToParts(new Date())

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value) - 1,
  }
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function CalendarDays({
  roomId,
  start,
  end,
  bookingCreated,
  readOnly = false,
  checkIn,
  checkOut,
  checkingRange,
  onSelectDate,
}: CalendarDaysProps) {
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const query = new URLSearchParams({ start, end })

    getJson<Availability>(
      `/api/rooms/${roomId}/availability/?${query}`,
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) setAvailability(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('ხელმისაწვდომობის ჩატვირთვა ვერ მოხერხდა.')
        }
      })

    return () => controller.abort()
  }, [roomId, start, end])

  if (error) return <p role="alert" className="text-red-700">{error}</p>
  if (!availability) return <p role="status">კალენდარი იტვირთება…</p>

  const firstDay = new Date(`${start}T00:00:00Z`)
  const offset = (firstDay.getUTCDay() + 6) % 7
  const year = firstDay.getUTCFullYear()
  const month = firstDay.getUTCMonth()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const bookedDates = new Set(availability.booked_dates)
  const canSelect = !bookingCreated && !readOnly

  return (
    <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm">
      {weekdays.map((day) => (
        <div key={day} className="py-2 font-medium text-stone-600">
          {day}
        </div>
      ))}

      {Array.from({ length: offset }, (_, index) => (
        <div key={`empty-${index}`} aria-hidden="true" />
      ))}

      {Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1
        const date = dateKey(new Date(Date.UTC(year, month, day)))
        const isPast = date < availability.today
        const isBooked = bookedDates.has(date)
        const selectingCheckout = Boolean(checkIn && !checkOut)
        const isCheckoutCandidate = selectingCheckout && date > checkIn
        const isCheckIn = canSelect && !isPast && date === checkIn
        const isCheckOut = canSelect && !isPast && date === checkOut && !isCheckIn
        const endpoint = isCheckIn ? 'შესვლა' : isCheckOut ? 'გასვლა' : ''
        const inRange = canSelect && Boolean(
          checkIn && checkOut && date > checkIn && date < checkOut,
        )
        const color = isCheckIn
          ? checkInStyle
          : isCheckOut
            ? checkOutStyle
            : inRange
              ? 'bg-emerald-200 text-emerald-950'
              : isBooked
                ? 'bg-red-100 text-red-800'
                : 'bg-emerald-100 text-emerald-900'
        const dayContent = (
          <span className="flex flex-col items-center leading-tight">
            {day}
            {endpoint && <span className="text-[9px] font-semibold sm:text-xs">{endpoint}</span>}
          </span>
        )

        if (!isPast && canSelect && (isCheckoutCandidate || !isBooked)) {
          return (
            <button
              key={date}
              type="button"
              aria-label={endpoint
                ? `${date} — არჩეული თარიღი, ${endpoint}`
                : `${date} — ${isCheckoutCandidate ? 'გასვლის' : 'შესვლის'} თარიღად არჩევა${isBooked ? ', ღამე დაკავებულია' : ''}`}
              aria-pressed={Boolean(endpoint)}
              disabled={checkingRange}
              onClick={() => onSelectDate(date)}
              className={`min-h-11 rounded-md hover:ring-2 hover:ring-brand focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60 ${color}`}
            >
              {dayContent}
            </button>
          )
        }

        const status = isPast
          ? { label: 'გასული დღე', color: 'bg-stone-100 text-stone-600' }
          : endpoint
            ? { label: 'არჩეული თარიღი', color }
            : isBooked
              ? { label: 'დაკავებულია', color: 'bg-red-100 text-red-800 line-through' }
              : { label: 'თავისუფალია', color: 'bg-emerald-100 text-emerald-900' }

        return (
          <div
            key={date}
            className={`grid min-h-11 place-items-center rounded-md ${status.color}`}
          >
            {dayContent}
            <span className="sr-only"> — {status.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function RoomAvailabilityCalendar({
  roomId,
  bookingCreated,
  readOnly = false,
  checkIn,
  checkOut,
  checkingRange,
  onSelectDate,
}: CalendarProps) {
  const [{ year, month }, setMonth] = useState(() => {
    if (!checkIn) return currentMonth()
    const initial = new Date(`${checkIn}T00:00:00Z`)
    return { year: initial.getUTCFullYear(), month: initial.getUTCMonth() }
  })
  const firstDay = new Date(Date.UTC(year, month, 1))
  const start = dateKey(firstDay)
  const end = dateKey(new Date(Date.UTC(year, month + 1, 1)))

  function moveMonth(direction: number) {
    setMonth((current) => {
      const next = new Date(Date.UTC(current.year, current.month + direction, 1))

      return {
        year: next.getUTCFullYear(),
        month: next.getUTCMonth(),
      }
    })
  }

  return (
    <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
      <h2 className="text-xl font-semibold">თავისუფალი ღამეები</h2>

      {!bookingCreated && !readOnly && (
        <dl className="grid grid-cols-2 gap-2 text-sm" aria-live="polite">
          <div className={`rounded-lg px-2 py-2 sm:px-3 ${checkIn ? checkInStyle : 'bg-stone-100 text-stone-700'}`}>
            <dt className="font-semibold">შესვლა</dt>
            <dd>{checkIn || 'აირჩიეთ თარიღი'}</dd>
          </div>
          <div className={`rounded-lg px-2 py-2 sm:px-3 ${checkOut ? checkOutStyle : 'bg-stone-100 text-stone-700'}`}>
            <dt className="font-semibold">გასვლა</dt>
            <dd>{checkOut || 'აირჩიეთ თარიღი'}</dd>
          </div>
        </dl>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="წინა თვე"
          onClick={() => moveMonth(-1)}
          className="rounded-lg border border-stone-300 px-3 py-2 hover:bg-canvas"
        >
          ‹
        </button>

        <p aria-live="polite" className="font-medium">
          {monthFormatter.format(firstDay)}
        </p>

        <button
          type="button"
          aria-label="შემდეგი თვე"
          onClick={() => moveMonth(1)}
          className="rounded-lg border border-stone-300 px-3 py-2 hover:bg-canvas"
        >
          ›
        </button>
      </div>

      <CalendarDays
        key={`${roomId}:${start}:${bookingCreated}`}
        roomId={roomId}
        start={start}
        end={end}
        bookingCreated={bookingCreated}
        readOnly={readOnly}
        checkIn={checkIn}
        checkOut={checkOut}
        checkingRange={checkingRange}
        onSelectDate={onSelectDate}
      />

      <ul className="flex flex-wrap gap-2 text-xs sm:text-sm">
        <li className="rounded-md bg-emerald-100 px-2 py-1 text-emerald-900">
          თავისუფალია
        </li>
        <li className="rounded-md bg-red-100 px-2 py-1 text-red-800">
          დაკავებულია
        </li>
        <li className="rounded-md bg-stone-100 px-2 py-1 text-stone-600">
          გასული დღე
        </li>
      </ul>

      {!bookingCreated && !readOnly && (
        <p role="status" className="text-sm text-stone-600">
          {checkingRange
            ? 'არჩეული პერიოდი მოწმდება…'
            : !checkIn
              ? 'აირჩიეთ შესვლის თარიღი.'
              : !checkOut
                ? 'აირჩიეთ გასვლის თარიღი.'
                : 'პერიოდის შესაცვლელად აირჩიეთ ახალი შესვლის თარიღი.'}
        </p>
      )}
    </section>
  )
}
