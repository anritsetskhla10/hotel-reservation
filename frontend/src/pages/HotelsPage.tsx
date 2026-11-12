import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import HotelCard from '../components/HotelCard'
import { getJson } from '../lib/api'
import type { City, Hotel } from '../types/api'

function HotelResults({ cityId }: { cityId: string }) {
  const [hotels, setHotels] = useState<Hotel[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const query = cityId ? `?${new URLSearchParams({ city: cityId })}` : ''

    getJson<Hotel[]>(`/api/hotels/${query}`, controller.signal)
      .then(setHotels)
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('სასტუმროების ჩატვირთვა ვერ მოხერხდა.')
        }
      })

    return () => controller.abort()
  }, [cityId])

  if (error) return <p role="alert">{error}</p>
  if (hotels === null) return <p>სასტუმროები იტვირთება…</p>
  if (hotels.length === 0) return <p>სასტუმროები ვერ მოიძებნა.</p>

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {hotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
    </div>
  )
}

export default function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const cityId = searchParams.get('city') ?? ''
  const [cities, setCities] = useState<City[]>([])
  const [cityError, setCityError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    getJson<City[]>('/api/cities/', controller.signal)
      .then(setCities)
      .catch(() => {
        if (!controller.signal.aborted) {
          setCityError('ქალაქების ჩატვირთვა ვერ მოხერხდა.')
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-semibold">სასტუმროები</h1>

        <label className="flex flex-col gap-1 text-sm font-medium">
          ქალაქი
          <select
            className="rounded-lg border border-stone-300 bg-white px-3 py-2"
            value={cityId}
            onChange={(event) => {
              const value = event.target.value
              setSearchParams(value ? { city: value } : {})
            }}
          >
            <option value="">ყველა ქალაქი</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </label>
      </div>

      {cityError && <p role="alert">{cityError}</p>}
      <HotelResults key={cityId} cityId={cityId} />
    </main>
  )
}