import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import PhotoGallery from '../components/PhotoGallery'
import RoomCard from '../components/RoomCard'
import { getJson } from '../lib/api'
import type { HotelDetail, Room } from '../types/api'

function HotelDetails({ id }: { id: string }) {
  const [hotel, setHotel] = useState<HotelDetail | null>(null)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [roomsError, setRoomsError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getJson<HotelDetail>(`/api/hotels/${encodeURIComponent(id)}/`, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setHotel(data)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setError(error instanceof Error && error.message === 'HTTP 404'
          ? 'სასტუმრო ვერ მოიძებნა.'
          : 'სასტუმროს ჩატვირთვა ვერ მოხერხდა.')
      })
    const filter = new URLSearchParams({ hotel: id })
    getJson<Room[]>(`/api/rooms/?${filter}`, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setRooms(data) })
      .catch(() => { if (!controller.signal.aborted) setRoomsError(true) })

    return () => controller.abort()
  }, [id])

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/hotels" className="text-sm font-medium text-brand hover:underline">
        ← სასტუმროების სია
      </Link>
      {error && <p role="alert">{error}</p>}
      {!error && !hotel && <p role="status">სასტუმრო იტვირთება…</p>}
      {hotel && (
        <>
          <header className="space-y-2">
            <p className="text-sm font-semibold text-brand">{hotel.city.name}</p>
            <h1 className="d-title">{hotel.name}</h1>
            <p className="text-stone-600">{hotel.address}</p>
          </header>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="min-w-0 overflow-hidden rounded-xl border border-surface-border bg-white">
              <PhotoGallery name={hotel.name} cover={hotel.photo} photos={hotel.gallery} />
            </div>
            <section className="d-panel space-y-4">
              <h2 className="text-xl font-semibold">სასტუმროს შესახებ</h2>
              <p className="whitespace-pre-line leading-relaxed text-stone-700">{hotel.description}</p>
              <a href="#hotel-rooms" className="d-button">ნომრების ნახვა</a>
            </section>
          </div>
          <section id="hotel-rooms" className="scroll-mt-6 space-y-4" aria-labelledby="hotel-rooms-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="hotel-rooms-title" className="text-2xl font-semibold">ნომრები ამ სასტუმროში</h2>
              <Link to={`/rooms?hotel=${hotel.id}`} className="d-button d-secondary">გაფილტვრა თარიღებით</Link>
            </div>
            {roomsError && <p role="alert" className="d-panel">ნომრების ჩატვირთვა ვერ მოხერხდა.</p>}
            {!roomsError && rooms === null && <p role="status" className="d-panel">ნომრები იტვირთება…</p>}
            {rooms?.length === 0 && <p className="d-panel">ამ სასტუმროში ნომრები ჯერ არ არის გამოქვეყნებული.</p>}
            {rooms && rooms.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default function HotelDetailPage() {
  const { id } = useParams()
  return id ? <HotelDetails key={id} id={id} /> : null
}
