import { Link } from 'react-router'

import type { Room } from '../types/api'

export default function RoomCard({ room }: { room: Room }) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-surface-border bg-white">
      <div className="aspect-4/3 shrink-0 overflow-hidden bg-soft">
        {room.photo ? (
          <img src={room.photo} alt={room.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-sm text-stone-600">ფოტო არ არის</div>
        )}
      </div>
      <div className="space-y-2 wrap-break-word p-4 sm:p-5">
        <p className="text-sm text-brand">{room.hotel_name} · {room.city.name}</p>
        <h2 className="text-lg font-semibold leading-snug">{room.name}</h2>
        <p className="text-sm text-stone-600">
          {room.room_type_display} · {room.capacity} სტუმარი
        </p>
      </div>
      <div className="mt-auto grid shrink-0 grid-cols-2 items-center gap-2 border-t border-surface-border bg-canvas p-3 sm:px-4">
        <p className="min-w-0 leading-tight tabular-nums">
          <span className="block wrap-break-word text-sm font-semibold">{room.price_per_night} ₾</span>
          <span className="text-xs text-stone-600">ღამეში</span>
        </p>
        <Link to={`/rooms/${room.id}`}
          className="grid h-11 min-w-0 place-items-center rounded-md bg-brand px-1 text-center text-xs font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          დეტალების ნახვა
        </Link>
      </div>
    </article>
  )
}
