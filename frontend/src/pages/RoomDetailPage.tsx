import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

import BookingForm, { type BookingDates } from '../components/BookingForm'
import RoomAvailabilityCalendar from '../components/RoomAvailabilityCalendar'
import { getJson } from '../lib/api'
import type { Room, RoomDetail } from '../types/api'
import PhotoGallery from '../components/PhotoGallery'

function readDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''

  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return ''

  return date.toISOString().slice(0, 10) === value ? value : ''
}

function RoomDetails({ id }: { id: string }) {
  const [searchParams] = useSearchParams()
  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [ownedHotelIds, setOwnedHotelIds] = useState<number[] | null>(null)
  const [error, setError] = useState('')
  const [bookingCreated, setBookingCreated] = useState(false)
  const [rangeError, setRangeError] = useState('')
  const [checkingRange, setCheckingRange] = useState(false)
  const rangeRequest = useRef<AbortController | null>(null)
  const [dates, setDates] = useState<BookingDates>(() => ({
    check_in: readDate(searchParams.get('check_in')),
    check_out: readDate(searchParams.get('check_out')),
  }))

  useEffect(() => {
    const controller = new AbortController()

    getJson<{ id: number }[]>('/api/my/hotels/', controller.signal)
      .then((hotels) => {
        if (!controller.signal.aborted) setOwnedHotelIds(hotels.map(({ id }) => id))
      })
      .catch(() => {
        if (!controller.signal.aborted) setOwnedHotelIds([])
      })

    getJson<RoomDetail>(`/api/rooms/${encodeURIComponent(id)}/`, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setRoom(data)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        setError(
          error instanceof Error && error.message === 'HTTP 404'
            ? 'ნომერი ვერ მოიძებნა.'
            : 'ნომრის ჩატვირთვა ვერ მოხერხდა.',
        )
      })

    return () => {
      controller.abort()
      rangeRequest.current?.abort()
    }
  }, [id])

  const isOwnRoom = room !== null && (ownedHotelIds?.includes(room.hotel) ?? false)
  const checkingOwnership = ownedHotelIds === null

  async function selectDate(date: string) {
    if (!room || isOwnRoom || checkingOwnership || bookingCreated || rangeRequest.current) return

    setRangeError('')
    if (!dates.check_in || dates.check_out || date <= dates.check_in) {
      setDates({ check_in: date, check_out: '' })
      return
    }

    const controller = new AbortController()
    rangeRequest.current = controller
    setCheckingRange(true)
    const query = new URLSearchParams({
      hotel: String(room.hotel),
      check_in: dates.check_in,
      check_out: date,
    })

    try {
      const available = await getJson<Room[]>(
        `/api/rooms/?${query}`,
        controller.signal,
      )
      if (controller.signal.aborted) return

      if (available.some((candidate) => candidate.id === room.id)) {
        setDates({ check_in: dates.check_in, check_out: date })
      } else {
        setRangeError('არჩეულ პერიოდში დაკავებული ღამეა. სცადეთ სხვა გასვლის თარიღი.')
      }
    } catch {
      if (!controller.signal.aborted) {
        setRangeError('პერიოდის შემოწმება ვერ მოხერხდა. სცადეთ ხელახლა.')
      }
    } finally {
      if (rangeRequest.current === controller) {
        rangeRequest.current = null
        setCheckingRange(false)
      }
    }
  }

  function changeDate(field: keyof BookingDates, value: string) {
    rangeRequest.current?.abort()
    rangeRequest.current = null
    setCheckingRange(false)
    setRangeError('')
    setDates((current) => ({ ...current, [field]: value }))
  }

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/rooms" className="text-sm font-medium text-brand hover:underline">
        ← ნომრების სია
      </Link>

      {error && <p role="alert">{error}</p>}
      {!error && !room && <p role="status">ნომერი იტვირთება…</p>}

      {room && (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand">
                <Link to={`/hotels/${room.hotel}`} className="hover:underline">{room.hotel_name}</Link>
                {' · '}{room.city.name}
              </p>
              <h1 className="d-title">{room.name}</h1>
              <p className="text-sm text-stone-700">{room.room_type_display} · {room.capacity} სტუმარი</p>
            </div>
            <p className="text-xl font-semibold tabular-nums">{room.price_per_night} ₾ <span className="text-sm font-normal text-stone-600">/ ღამე</span></p>
          </header>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-5">
              <div className="overflow-hidden rounded-xl border border-surface-border bg-white">
                <PhotoGallery name={room.name} cover={room.photo} photos={room.gallery} />
              </div>
              <section className="d-panel space-y-3">
                <h2 className="text-xl font-semibold">ნომრის შესახებ</h2>
                <p className="whitespace-pre-line leading-relaxed text-stone-700">{room.description}</p>
                {!checkingOwnership && !isOwnRoom && (
                  <a href="#booking" className="d-button lg:hidden">თარიღების არჩევა</a>
                )}
              </section>
            </div>

            <div id="booking" className="min-w-0 scroll-mt-6 space-y-4">
              <RoomAvailabilityCalendar
                roomId={room.id}
                bookingCreated={bookingCreated}
                readOnly={isOwnRoom || checkingOwnership}
                checkIn={dates.check_in}
                checkOut={dates.check_out}
                checkingRange={checkingRange}
                onSelectDate={(date) => void selectDate(date)}
              />
              {rangeError && <p role="alert" className="d-notice text-red-700">{rangeError}</p>}

              {checkingOwnership ? (
                <p role="status" className="d-panel">დაჯავშნის ფორმა იტვირთება…</p>
              ) : isOwnRoom ? (
                <section className="d-panel space-y-2">
                  <h2 className="text-xl font-semibold">ეს ნომერი თქვენს სასტუმროს ეკუთვნის</h2>
                  <p>საკუთარ სასტუმროში ნომერს ვერ დაჯავშნით.</p>
                  <Link to="/profile?tab=hotels" className="d-button d-secondary">ჩემი სასტუმროები</Link>
                </section>
              ) : (
                <BookingForm
                  roomId={room.id}
                  pricePerNight={room.price_per_night}
                  dates={dates}
                  onDateChange={changeDate}
                  onBookingCreated={() => setBookingCreated(true)}
                />
              )}
            </div>
          </div>
        </>
      )}
    </main>
  )
}

export default function RoomDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  return id
    ? <RoomDetails key={`${id}:${searchParams}`} id={id} />
    : null
}
