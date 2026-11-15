import { useEffect, useState, type FormEvent } from 'react'

import OwnerGallery from '../components/OwnerGallery'
import { getJson, postWithCsrf, sendWithCsrf } from '../lib/api'
import type { RoomType } from '../types/api'

type ManagedRoom = {
  id: number
  room_number: string
  name: string
  room_type: RoomType
  room_type_display: string
  description: string
  photo: string | null
  capacity: number
  price_per_night: string
  is_active: boolean
  is_featured: boolean
}

const roomTypes: Record<RoomType, { label: string; capacity?: number; fixed?: boolean }> = {
  single: { label: 'ერთადგილიანი', capacity: 1, fixed: true },
  double: { label: 'ორადგილიანი ორმაგი საწოლით', capacity: 2, fixed: true },
  twin: { label: 'ორადგილიანი ცალკე საწოლებით', capacity: 2, fixed: true },
  triple: { label: 'სამადგილიანი', capacity: 3, fixed: true },
  family: { label: 'საოჯახო', capacity: 4 },
  deluxe: { label: 'დელუქსი', capacity: 2 },
  other: { label: 'სხვა' },
}

const fields = [
  { name: 'room_number', label: 'ნომრის კოდი', maxLength: 20 },
  { name: 'name', label: 'სახელი', maxLength: 200 },
] as const

const fieldLabels: Record<string, string> = {
  room_number: 'ნომრის კოდი',
  name: 'სახელი',
  room_type: 'ნომრის ტიპი',
  capacity: 'ტევადობა',
  price_per_night: 'ღამის ფასი',
  photo: 'მთავარი ფოტო',
  description: 'აღწერა',
}

const inputClass = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2'

export default function MyHotelRooms({ hotelId }: { hotelId: number }) {
  const endpoint = `/api/my/hotels/${hotelId}/rooms/`
  const [rooms, setRooms] = useState<ManagedRoom[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [updatingFeatured, setUpdatingFeatured] = useState(false)
  const [featuredError, setFeaturedError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getJson<ManagedRoom[]>(endpoint, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setRooms(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError('ნომრების ჩატვირთვა ვერ მოხერხდა.')
      })
    return () => controller.abort()
  }, [endpoint])

  function updateRoom(room: ManagedRoom) {
    setRooms((current) => current?.map((item) => item.id === room.id ? room : item) ?? [])
    setEditingId(null)
    setNotice('ნომრის ცვლილებები შენახულია.')
  }

  async function toggleFeatured(room: ManagedRoom) {
    if (updatingFeatured) return
    setUpdatingFeatured(true)
    setFeaturedError('')
    try {
      const response = await sendWithCsrf(`${endpoint}${room.id}/featured/`, 'PATCH', {
        is_featured: !room.is_featured,
      })
      if (!response.ok) throw new Error('Featured update failed')
      const { is_featured }: { is_featured: boolean } = await response.json()
      setRooms((current) => current?.map((item) => item.id === room.id
        ? { ...item, is_featured }
        : item) ?? [])
    } catch {
      setFeaturedError('გამორჩეულის სტატუსი ვერ შეინახა. სცადეთ ხელახლა.')
    } finally {
      setUpdatingFeatured(false)
    }
  }

  if (loadError) return <p role="alert" className="text-red-700">{loadError}</p>
  if (!rooms) return <p role="status">ნომრები იტვირთება…</p>

  return (
    <div className="space-y-4 border-t border-stone-200 pt-4">
      {featuredError && <p role="alert" className="text-sm text-red-700">{featuredError}</p>}
      {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
      {rooms.length === 0 ? <p className="text-sm">ნომრები ჯერ არ გაქვთ დამატებული.</p> : (
        <ul className="divide-y divide-stone-200">
          {rooms.map((room) => (
            <li key={room.id} className="space-y-2 py-2 text-sm">
              <p className="font-medium">№{room.room_number} · {room.name}</p>
              <p>{room.room_type_display} · {room.capacity} სტუმარი · {room.price_per_night} ₾ / ღამე</p>
              {!room.is_active && <p>გამორთულია</p>}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={room.is_featured} disabled={updatingFeatured}
                  onChange={() => void toggleFeatured(room)} />
                გამორჩეული ნომერი
              </label>
              <button type="button" aria-expanded={editingId === room.id}
                className="rounded-lg border border-stone-300 px-3 py-2"
                onClick={() => {
                  setNotice('')
                  setEditingId((current) => current === room.id ? null : room.id)
                }}>
                {editingId === room.id ? 'რედაქტირების დახურვა' : 'ნომრის რედაქტირება'}
              </button>
              {editingId === room.id && <RoomForm endpoint={`${endpoint}${room.id}/`} room={room} onSaved={updateRoom} />}
              <OwnerGallery endpoint={`${endpoint}${room.id}/photos/`} />
            </li>
          ))}
        </ul>
      )}
      <RoomForm endpoint={endpoint} onSaved={(room) => {
        setRooms((current) => [...(current ?? []), room])
        setNotice('ნომერი დაემატა.')
      }} />
    </div>
  )
}

function RoomForm({ endpoint, room, onSaved }: {
  endpoint: string
  room?: ManagedRoom
  onSaved: (room: ManagedRoom) => void
}) {
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [roomType, setRoomType] = useState<RoomType>(room?.room_type ?? 'single')
  const [capacity, setCapacity] = useState(String(room?.capacity ?? 1))

  function changeRoomType(value: RoomType) {
    setRoomType(value)
    setCapacity(String(value === room?.room_type ? room.capacity : roomTypes[value].capacity ?? ''))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const form = event.currentTarget
    const data = new FormData(form)
    if (room) {
      const photo = data.get('photo')
      if (photo instanceof File && !photo.name) data.delete('photo')
      if (roomType === room.room_type && Number(capacity) === room.capacity) data.delete('capacity')
      data.set('is_active', String(data.has('is_active')))
    }
    setSubmitting(true)
    setSubmitError('')

    try {
      const response = room
        ? await sendWithCsrf(endpoint, 'PATCH', data)
        : await postWithCsrf(endpoint, data)
      if (response.status === 400) {
        const errors: Record<string, unknown> | null = await response.json().catch(() => null)
        const messages = Object.entries(errors ?? {}).flatMap(([field, value]) =>
          [value].flat()
            .filter((message): message is string => typeof message === 'string')
            .map((message) => fieldLabels[field] ? `${fieldLabels[field]} — ${message}` : message),
        )
        setSubmitError(messages.join(' ') || 'შეამოწმეთ ნომრის მონაცემები.')
        return
      }
      if (!response.ok) throw new Error('Room save failed')
      const savedRoom: ManagedRoom = await response.json()
      if (!room) {
        form.reset()
        changeRoomType('single')
      }
      onSaved(savedRoom)
    } catch {
      setSubmitError('ნომრის შენახვა ვერ მოხერხდა. სცადეთ ხელახლა.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-3">
        <h4 className="font-semibold">{room ? 'ნომრის რედაქტირება' : 'ნომრის დამატება'}</h4>
        <fieldset disabled={submitting} className="grid gap-3 lg:grid-cols-2">
          {fields.map(({ name, label, maxLength }) => (
            <label key={name} className="space-y-1 text-sm">
              <span>{label}</span>
              <input name={name} maxLength={maxLength} defaultValue={room?.[name]} required className={inputClass} />
            </label>
          ))}
          <label className="space-y-1 text-sm">
            <span>ნომრის ტიპი</span>
            <select name="room_type" value={roomType} className={inputClass}
              onChange={(event) => changeRoomType(event.currentTarget.value as RoomType)}>
              {Object.entries(roomTypes).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>ტევადობა</span>
            <input name="capacity" type="number" min="1" step="1" value={capacity}
              required={!roomTypes[roomType].fixed} readOnly={roomTypes[roomType].fixed}
              onChange={(event) => setCapacity(event.currentTarget.value)} className={inputClass} />
          </label>
          <label className="space-y-1 text-sm">
            <span>ღამის ფასი (₾)</span>
            <input name="price_per_night" type="number" min="0.01" step="0.01"
              defaultValue={room?.price_per_night} required className={inputClass} />
          </label>
          <label className="space-y-1 text-sm">
            <span>მთავარი ფოტო</span>
            {room?.photo && <img src={room.photo} alt="მიმდინარე მთავარი ფოტო" className="h-20 w-32 rounded-lg object-cover" />}
            <input name="photo" type="file" accept="image/*" required={!room} className={inputClass} />
            {room && <span className="block text-stone-600">ახალი ფაილი აირჩიე მთავარი ფოტოს შესაცვლელად.</span>}
          </label>
          <label className="space-y-1 text-sm lg:col-span-2">
            <span>აღწერა</span>
            <textarea name="description" rows={3} defaultValue={room?.description} required className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            {room ? (
              <><input type="checkbox" name="is_active" defaultChecked={room.is_active} /> აქტიური ნომერი</>
            ) : (
              <><input type="checkbox" name="is_featured" value="true" /> გამორჩეული ნომერი</>
            )}
          </label>
        </fieldset>
        {submitError && <p role="alert" className="text-sm text-red-700">{submitError}</p>}
        <button type="submit" disabled={submitting}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {submitting ? 'ინახება…' : room ? 'ცვლილებების შენახვა' : 'ნომრის დამატება'}
        </button>
      </form>
  )
}
