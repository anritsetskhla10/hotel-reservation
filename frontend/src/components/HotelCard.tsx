import type { Hotel } from '../types/api'
import { Link } from 'react-router'

export default function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {hotel.photo && (
        <img
          src={hotel.photo}
          alt={hotel.name}
          loading="lazy"
          className="aspect-4/3 w-full object-cover"
        />
      )}
      <div className="space-y-2 p-5">
        <p className="text-sm font-medium text-brand">{hotel.city.name}</p>
        <h2 className="text-xl font-semibold">{hotel.name}</h2>
        <p className="text-sm text-stone-600">{hotel.address}</p>
        <p className="line-clamp-3 text-sm leading-relaxed">{hotel.description}</p>
        <Link
            to={`/rooms?hotel=${hotel.id}`}
            className="mt-2 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
            >
            ნომრების ნახვა
        </Link>
      </div>
    </article>
  )
}