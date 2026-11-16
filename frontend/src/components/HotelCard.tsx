import { Link } from 'react-router'

import type { Hotel } from '../types/api'

export default function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-surface-border bg-white">
      <div className="aspect-4/3 shrink-0 overflow-hidden bg-soft">
        {hotel.photo ? (
          <img src={hotel.photo} alt={hotel.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-sm text-stone-600">ფოტო არ არის</div>
        )}
      </div>
      <div className="space-y-2 wrap-break-word p-4 sm:p-5">
        <p className="text-sm font-medium text-brand">{hotel.city.name}</p>
        <h2 className="text-lg font-semibold leading-snug">{hotel.name}</h2>
        <p className="text-sm leading-relaxed text-stone-600">{hotel.address}</p>
        <p className="line-clamp-3 text-sm leading-relaxed text-stone-700">{hotel.description}</p>
      </div>
      <div className="mt-auto grid shrink-0 grid-cols-2 gap-2 border-t border-surface-border bg-canvas p-3 sm:px-4">
        <Link to={`/hotels/${hotel.id}`}
          className="grid h-11 min-w-0 place-items-center rounded-md border border-stone-300 bg-white px-1 text-center text-xs font-semibold text-brand hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          დეტალები
        </Link>
        <Link to={`/rooms?hotel=${hotel.id}`}
          className="grid h-11 min-w-0 place-items-center rounded-md bg-brand px-1 text-center text-xs font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          ნომრების ნახვა
        </Link>
      </div>
    </article>
  )
}
