import { useEffect, useState, type FormEvent } from 'react'

import { getJson, postWithCsrf, sendWithCsrf } from '../lib/api'
import type { City } from '../types/api'
import MyHotelRooms from './MyHotelRooms'
import OwnerGallery from '../components/OwnerGallery'

type MyHotel = {
  id: number
  name: string
  city: number
  city_name: string
  address: string
  description: string
  photo: string | null
  is_active: boolean
  publication_status: 'pending' | 'published'
  publication_status_display: string
}

const endpoint = '/api/my/hotels/'
const inputClass = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2'
const fieldLabels: Record<string, string> = {
  name: 'სახელი',
  city: 'ქალაქი',
  address: 'მისამართი',
  description: 'აღწერა',
  photo: 'მთავარი ფოტო',
}

export default function MyHotelsPage() {
  const [openHotelId, setOpenHotelId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [hotels, setHotels] = useState<MyHotel[] | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    Promise.all([
      getJson<MyHotel[]>(endpoint, signal),
      getJson<City[]>('/api/cities/', signal),
    ])
      .then(([hotelList, cityList]) => {
        if (signal.aborted) return
        setHotels(hotelList)
        setCities(cityList)
      })
      .catch(() => {
        if (!signal.aborted) setLoadError('სასტუმროებისა და ქალაქების ჩატვირთვა ვერ მოხერხდა.')
      })

    return () => controller.abort()
  }, [])

  function saveHotel(hotel: MyHotel, editing: boolean) {
    setHotels((current) => editing
      ? (current ?? []).map((item) => item.id === hotel.id ? hotel : item)
      : [hotel, ...(current ?? [])])
    if (editing) setEditingId(null)
    setNotice(editing
      ? 'სასტუმროს ცვლილებები შენახულია.'
      : 'განაცხადი გაიგზავნა. სასტუმრო განხილვის მოლოდინშია.')
  }

  if (loadError) return <p role="alert" className="text-red-700">{loadError}</p>
  if (!hotels) return <p role="status">სასტუმროები იტვირთება…</p>

  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold">ჩემი სასტუმროები</h2>
      {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}

      {hotels.length === 0 ? (
        <p>სასტუმრო ჯერ არ გაქვთ დამატებული.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {hotels.map((hotel) => (
            <li key={hotel.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {hotel.photo && (
                <img src={hotel.photo} alt="" className="aspect-video w-full object-cover" />
              )}
              <div className="space-y-2 p-4">
                <h3 className="font-semibold">{hotel.name}</h3>
                <p className="text-sm text-stone-600">{hotel.city_name} · {hotel.address}</p>
                <p className="text-sm font-medium">
                  {hotel.publication_status_display}
                  {!hotel.is_active && ' · გამორთულია'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-expanded={openHotelId === hotel.id}
                    onClick={() => setOpenHotelId((current) => current === hotel.id ? null : hotel.id)}
                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium"
                  >
                    {openHotelId === hotel.id ? 'ნომრების დახურვა' : 'ნომრების მართვა'}
                  </button>
                  <button
                    type="button"
                    aria-expanded={editingId === hotel.id}
                    onClick={() => {
                      setNotice('')
                      setEditingId((current) => current === hotel.id ? null : hotel.id)
                    }}
                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium"
                  >
                    {editingId === hotel.id ? 'რედაქტირების დახურვა' : 'სასტუმროს რედაქტირება'}
                  </button>
                </div>
                {editingId === hotel.id && (
                  <HotelForm cities={cities} hotel={hotel} onSaved={(saved) => saveHotel(saved, true)} />
                )}
                <OwnerGallery endpoint={`${endpoint}${hotel.id}/photos/`} />
                {openHotelId === hotel.id && <MyHotelRooms hotelId={hotel.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
      <HotelForm cities={cities} onSaved={(hotel) => saveHotel(hotel, false)} />
    </section>
  )
}

function HotelForm({ cities, hotel, onSaved }: {
  cities: City[]
  hotel?: MyHotel
  onSaved: (hotel: MyHotel) => void
}) {
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const form = event.currentTarget
    const data = new FormData(form)
    const photo = data.get('photo')
    if (hotel && photo instanceof File && !photo.name) data.delete('photo')
    setSubmitting(true)
    setSubmitError('')

    try {
      const response = hotel
        ? await sendWithCsrf(`${endpoint}${hotel.id}/`, 'PATCH', data)
        : await postWithCsrf(endpoint, data)

      if (response.status === 400) {
        const errors: Record<string, unknown> | null = await response.json().catch(() => null)
        const messages = Object.entries(errors ?? {}).flatMap(([field, value]) =>
          [value].flat().filter((message): message is string => typeof message === 'string')
            .map((message) => fieldLabels[field] ? `${fieldLabels[field]} — ${message}` : message),
        )
        setSubmitError(messages.join(' ') || 'შეამოწმეთ სასტუმროს მონაცემები.')
        return
      }

      if (response.status === 401 || response.status === 403) {
        setSubmitError('მონაცემების შესანახად განაახლეთ გვერდი და შეამოწმეთ შესვლა.')
        return
      }

      if (!response.ok) throw new Error('Hotel save failed')

      const saved: MyHotel = await response.json()
      if (!hotel) form.reset()
      onSaved(saved)
    } catch {
      setSubmitError('სასტუმროს შენახვა ვერ მოხერხდა. სცადეთ ხელახლა.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
      <form onSubmit={handleSubmit} encType="multipart/form-data"
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="text-lg font-semibold">{hotel ? 'სასტუმროს რედაქტირება' : 'სასტუმროს დამატება'}</h3>
        {!hotel && <p className="text-sm text-stone-600">სასტუმრო გამოჩნდება საჯარო სიაში ადმინისტრატორის დამტკიცების შემდეგ.</p>}
        {cities.length === 0 && <p role="status">სიაში ქალაქები ჯერ არ არის.</p>}
        <fieldset disabled={submitting || cities.length === 0} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>სახელი</span>
            <input name="name" maxLength={200} defaultValue={hotel?.name} required className={inputClass} />
          </label>
          <label className="space-y-1 text-sm">
            <span>ქალაქი</span>
            <select name="city" required defaultValue={hotel?.city ?? ''} className={inputClass}>
              <option value="" disabled>აირჩიეთ ქალაქი</option>
              {cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>მისამართი</span>
            <input name="address" maxLength={255} defaultValue={hotel?.address} required className={inputClass} />
          </label>
          <label className="space-y-1 text-sm">
            <span>მთავარი ფოტო</span>
            <input name="photo" type="file" accept="image/*" required={!hotel} className={inputClass} />
            {hotel && <span className="block text-stone-600">ახალი ფაილი აირჩიე მთავარი ფოტოს შესაცვლელად.</span>}
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>აღწერა</span>
            <textarea name="description" rows={4} defaultValue={hotel?.description} required className={inputClass} />
          </label>
        </fieldset>
        {submitError && <p role="alert" className="text-sm text-red-700">{submitError}</p>}
        <button type="submit" disabled={submitting || cities.length === 0}
          className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-hover disabled:opacity-60">
          {submitting ? 'ინახება…' : hotel ? 'ცვლილებების შენახვა' : 'განაცხადის გაგზავნა'}
        </button>
      </form>
  )
}
