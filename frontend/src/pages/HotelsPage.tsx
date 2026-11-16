import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import HotelCard from '../components/HotelCard'
import FilterSidebar from '../components/FilterSidebar'
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
    <div className="space-y-3">
      <p role="status" className="text-sm text-stone-600">ნაპოვნია {hotels.length} სასტუმრო</p>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {hotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
      </div>
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
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="d-title">სასტუმროები</h1>
      <div className="grid items-start gap-5 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <FilterSidebar>
          <label className="flex flex-col gap-1 text-sm font-medium">
            ქალაქი
            <select
              className="d-control"
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
          <button type="button" className="d-button d-secondary mt-4 w-full" disabled={!cityId}
            onClick={() => setSearchParams({})}>
            <span aria-hidden="true">↺</span> გასუფთავება
          </button>
          {cityError && <p role="alert" className="mt-2 text-sm text-red-700">{cityError}</p>}
        </FilterSidebar>
        <section className="min-w-0" aria-label="სასტუმროების შედეგები">
          <HotelResults key={cityId} cityId={cityId} />
        </section>
      </div>
    </main>
  )
}
