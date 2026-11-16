import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'

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
const inputClass = 'd-control'
const fieldLabels: Record<string, string> = {
  name: 'სახელი',
  city: 'ქალაქი',
  address: 'მისამართი',
  description: 'აღწერა',
  photo: 'მთავარი ფოტო',
}

export default function MyHotelsPage() {
  const [params, setParams] = useSearchParams()
  const hotelId = params.get('hotel')
  const adding = params.get('action') === 'new'
  const view = params.get('manage') ?? 'info'
  const [hotels, setHotels] = useState<MyHotel[] | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState<{ hotelId: number; message: string } | null>(null)

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

  const selectedHotel = hotels?.find((hotel) => String(hotel.id) === hotelId)
  const listPath = '/profile?tab=hotels'
  const addPath = listPath + '&action=new'

  function saveHotel(hotel: MyHotel, editing: boolean) {
    setHotels((current) => editing
      ? (current ?? []).map((item) => item.id === hotel.id ? hotel : item)
      : [hotel, ...(current ?? [])])
    setNotice({
      hotelId: hotel.id,
      message: editing ? 'სასტუმროს ცვლილებები შენახულია.' : 'განაცხადი გაიგზავნა. სასტუმრო განხილვის მოლოდინშია.',
    })
    if (!editing) setParams({ tab: 'hotels', hotel: String(hotel.id) })
  }

  if (loadError) return <p role="alert" className="d-panel">{loadError}</p>
  if (!hotels) return <p role="status" className="d-panel">სასტუმროები იტვირთება…</p>

  if (adding) {
    return (
      <section className="space-y-4">
        <Link to={listPath} className="text-sm font-semibold text-brand underline">← ჩემი სასტუმროები</Link>
        <h1 className="d-title">სასტუმროს დამატება</h1>
        <HotelForm cities={cities} onSaved={(hotel) => saveHotel(hotel, false)} />
      </section>
    )
  }

  if (selectedHotel) {
    const hotelPath = listPath + '&hotel=' + selectedHotel.id
    const sections = [['info', 'ინფორმაცია'], ['rooms', 'ნომრები'], ['photos', 'ფოტოები']]
    return (
      <section className="space-y-4">
        <Link to={listPath} className="text-sm font-semibold text-brand underline">← ჩემი სასტუმროები</Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="d-title">{selectedHotel.name}</h1>
          <HotelState hotel={selectedHotel} />
        </div>
        <nav aria-label="სასტუმროს მართვის განყოფილებები" className="flex flex-wrap gap-2">
          {sections.map(([key, label]) => (
            <Link key={key} to={key === 'info' ? hotelPath : hotelPath + '&manage=' + key}
              aria-current={(view === key || (key === 'info' && !sections.some(([section]) => section === view))) ? 'page' : undefined}
              className="d-button d-secondary aria-[current=page]:border-brand aria-[current=page]:bg-soft">
              {label}
            </Link>
          ))}
        </nav>
        {notice?.hotelId === selectedHotel.id && <p role="status" className="d-notice">{notice.message}</p>}
        {view === 'rooms' ? <MyHotelRooms key={selectedHotel.id} hotelId={selectedHotel.id} />
          : view === 'photos' ? <OwnerGallery key={selectedHotel.id} endpoint={`${endpoint}${selectedHotel.id}/photos/`} />
          : <HotelForm key={selectedHotel.id} cities={cities} hotel={selectedHotel} onSaved={(hotel) => saveHotel(hotel, true)} />}
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="d-title">ჩემი სასტუმროები</h1>
        <Link to={addPath} className="d-button">სასტუმროს დამატება</Link>
      </div>
      {hotelId && <p role="alert" className="d-panel">სასტუმრო ვერ მოიძებნა.</p>}
      {hotels.length === 0 && <p className="d-panel text-stone-600">სასტუმრო ჯერ არ გაქვს დამატებული.</p>}
      {hotels.map((hotel) => (
        <article key={hotel.id} className="d-panel grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
          {hotel.photo ? <img src={hotel.photo} alt="" loading="lazy" className="h-28 w-full rounded-lg object-cover" />
            : <div className="h-28 rounded-lg bg-soft" />}
          <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-semibold">{hotel.name}</h2>
              <HotelState hotel={hotel} />
            </div>
            <p className="text-sm text-stone-600">{hotel.city_name} · {hotel.address}</p>
            <Link to={listPath + '&hotel=' + hotel.id} className="d-button d-secondary">სასტუმროს მართვა</Link>
          </div>
        </article>
      ))}
    </section>
  )
}

function HotelState({ hotel }: { hotel: MyHotel }) {
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${hotel.publication_status === 'pending' ? 'bg-amber-100 text-amber-900' : 'bg-soft text-brand'}`}>
      {hotel.publication_status_display}{!hotel.is_active && ' · გამორთულია'}
    </span>
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
        className="d-panel space-y-4">
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
          className="d-button">
          {submitting ? 'ინახება…' : hotel ? 'ცვლილებების შენახვა' : 'განაცხადის გაგზავნა'}
        </button>
      </form>
  )
}
