import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import PhotoGallery from '../components/PhotoGallery'
import { getJson } from '../lib/api'
import type { HotelDetail } from '../types/api'

function HotelDetails({ id }: { id: string }) {
  const [hotel, setHotel] = useState<HotelDetail | null>(null)
  const [error, setError] = useState('')

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
    return () => controller.abort()
  }, [id])

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
      <Link to="/hotels" className="text-sm font-medium text-brand hover:underline">
        ← სასტუმროების სია
      </Link>
      {error && <p role="alert">{error}</p>}
      {!error && !hotel && <p role="status">სასტუმრო იტვირთება…</p>}
      {hotel && (
        <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="space-y-2 p-5 sm:px-8">
            <p className="text-sm font-medium text-brand">{hotel.city.name}</p>
            <h1 className="text-3xl font-semibold">{hotel.name}</h1>
            <p className="text-stone-600">{hotel.address}</p>
          </div>
          <PhotoGallery name={hotel.name} cover={hotel.photo} photos={hotel.gallery} />
          <div className="space-y-4 p-5 sm:px-8">
            <p className="whitespace-pre-line">{hotel.description}</p>
            <Link to={`/rooms?hotel=${hotel.id}`}
              className="inline-flex rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-hover">
              ნომრების ნახვა
            </Link>
          </div>
        </article>
      )}
    </main>
  )
}

export default function HotelDetailPage() {
  const { id } = useParams()
  return id ? <HotelDetails key={id} id={id} /> : null
}
