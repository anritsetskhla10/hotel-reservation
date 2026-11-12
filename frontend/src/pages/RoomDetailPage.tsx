import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { getJson } from '../lib/api'
import type { Room } from '../types/api'
import BookingForm from '../components/BookingForm'

function RoomDetails({ id }: { id: string }) {
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    getJson<Room>(`/api/rooms/${encodeURIComponent(id)}/`, controller.signal)
      .then(setRoom)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        setError(
          error instanceof Error && error.message === 'HTTP 404'
            ? 'ნომერი ვერ მოიძებნა.'
            : 'ნომრის ჩატვირთვა ვერ მოხერხდა.',
        )
      })

    return () => controller.abort()
  }, [id])

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
      <Link to="/rooms" className="text-sm font-medium text-brand hover:underline">
        ← ნომრების სია
      </Link>

      {error && <p role="alert">{error}</p>}
      {!error && !room && <p role="status">ნომერი იტვირთება…</p>}

      {room && (
        <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {room.photo && (
            <img
              src={room.photo}
              alt={room.name}
              className="aspect-video w-full object-cover"
            />
          )}
          <div className="space-y-3 p-5 sm:p-8">
            <p className="text-sm font-medium text-brand">
              {room.hotel_name} · {room.city.name}
            </p>
            <h1 className="text-3xl font-semibold">{room.name}</h1>
            <p>{room.room_type_display} · {room.capacity} სტუმარი</p>
            <p className="whitespace-pre-line">{room.description}</p>
            <p className="text-xl font-semibold">{room.price_per_night} ₾ / ღამე</p>
          </div>
        </article>
      )}
      {room && <BookingForm key={room.id} roomId={room.id} />}
    </main>
  )
}

export default function RoomDetailPage() {
  const { id } = useParams()
  return id ? <RoomDetails key={id} id={id} /> : null
}