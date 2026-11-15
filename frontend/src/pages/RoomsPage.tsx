import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import RoomCard from '../components/RoomCard'
import FilterSidebar from '../components/FilterSidebar'
import { getJson } from '../lib/api'
import type { Room } from '../types/api'
import RoomFilters from '../components/RoomFilters'

function RoomResults({ query }: { query: string }) {
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const path = query ? `/api/rooms/?${query}` : '/api/rooms/'

    getJson<Room[]>(path, controller.signal)
      .then(setRooms)
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('ნომრების ჩატვირთვა ვერ მოხერხდა.')
        }
      })

    return () => controller.abort()
  }, [query])

  if (error) return <p role="alert">{error}</p>
  if (rooms === null) return <p>ნომრები იტვირთება…</p>
  if (rooms.length === 0) return <p>ნომრები ვერ მოიძებნა.</p>

  return (
    <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
      {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
    </div>
  )
}

export default function RoomsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.toString()

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">ნომრები</h1>
      <div className="grid items-start gap-5 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <FilterSidebar>
          <RoomFilters key={`filters:${query}`} />
        </FilterSidebar>
        <section className="min-w-0" aria-label="ნომრების შედეგები">
          <RoomResults key={`results:${query}`} query={query} />
        </section>
      </div>
    </main>
  )
}
