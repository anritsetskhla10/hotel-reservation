import type { Room } from '../types/api'
import { Link } from 'react-router'

export default function RoomCard({ room }: { room: Room }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {room.photo && (
        <img
          src={room.photo}
          alt={room.name}
          loading="lazy"
          className="aspect-4/3 w-full object-cover"
        />
      )}
      <div className="space-y-2 p-5">
        <p className="text-sm text-brand">{room.hotel_name} · {room.city.name}</p>
        <h2 className="text-xl font-semibold">{room.name}</h2>
        <p className="text-sm text-stone-600">
          {room.room_type_display} · {room.capacity} სტუმარი
        </p>
        <p className="font-semibold">{room.price_per_night} ₾ / ღამე</p>
        <Link
          to={`/rooms/${room.id}`}
          className="mt-2 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          დეტალების ნახვა
        </Link>
      </div>
    </article>
  )
}