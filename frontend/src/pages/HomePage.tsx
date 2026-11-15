import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import RoomCard from '../components/RoomCard'
import { getJson } from '../lib/api'
import type { City, Hotel, Room } from '../types/api'

const pageWidth = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'
const heroPhoto = '/images/tbilisi-hero.png'
const preferredCities = ['თბილისი', 'ბათუმი', 'ქუთაისი']
const cityDescriptions: Record<string, string> = {
  თბილისი: 'ძველი უბნები, ხის აივნები და გასეირნება მტკვრის გასწვრივ.',
  ბათუმი: 'სანაპირო, ბულვარი და საღამოს გასეირნება ზღვის პირას.',
  ქუთაისი: 'შიდა ეზოები, ძველი ქუჩები და სეირნობა რიონის გასწვრივ.',
}

const stays = [
  {
    title: 'ორი სტუმრისთვის',
    description: 'ნომრები ორი ცალკე საწოლით.',
    to: '/rooms?room_type=twin&guests=2',
  },
  {
    title: 'ოჯახთან ერთად',
    description: 'საოჯახო ნომრები ოთხი ან მეტი სტუმრისთვის.',
    to: '/rooms?room_type=family&guests=4',
  },
  {
    title: 'რამდენიმე დღით დასვენება',
    description: 'შეარჩიე მოგზაურობის დღეები და ნახე, რომელი ნომრებია თავისუფალი.',
    to: '/rooms',
  },
]

const bookingSteps = [
  { title: 'შეარჩიე ნომერი', description: 'შეადარე ფოტოები, ღამის ფასი და ტევადობა.' },
  { title: 'მონიშნე თარიღები', description: 'კალენდარში აირჩიე შესვლისა და გასვლის დღეები და ნახე სავარაუდო ჯამი.' },
  { title: 'გაგზავნე მოთხოვნა', description: 'სასტუმროს პასუხს პროფილში, „ჩემს ჯავშნებში“ ნახავ.' },
]

const textLink =
  'inline-flex min-h-11 items-center gap-2 font-semibold text-brand underline underline-offset-4 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand'

export default function HomePage() {
  const [cities, setCities] = useState<City[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [roomsError, setRoomsError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    getJson<City[]>('/api/cities/', signal)
      .then((data) => { if (!signal.aborted) setCities(data) })
      .catch(() => { /* სასტუმროების სრული სიის ბმული ხელმისაწვდომია. */ })

    getJson<Hotel[]>('/api/hotels/', signal)
      .then((data) => { if (!signal.aborted) setHotels(data) })
      .catch(() => { /* ქალაქის ბარათები მთავარ ფოტოს გარეშეც ხელმისაწვდომია. */ })

    getJson<Room[]>('/api/rooms/?is_featured=true', signal)
      .then((data) => { if (!signal.aborted) setRooms(data.slice(0, 3)) })
      .catch(() => { if (!signal.aborted) setRoomsError(true) })

    return () => controller.abort()
  }, [])

  const destinations = [
    ...preferredCities.flatMap((name) => cities.find((city) => city.name === name) ?? []),
    ...cities.filter((city) => !preferredCities.includes(city.name)),
  ].slice(0, 3)

  return (
    <main className="bg-[#fbfaf6]">
      <section aria-labelledby="home-title" className={`${pageWidth} pb-10 pt-9 sm:pb-14 sm:pt-14`}>
        <div className="mb-6 grid gap-5 sm:mb-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <h1 id="home-title" className="max-w-3xl text-[clamp(2.5rem,6.4vw,5.25rem)] font-semibold leading-[1.06] tracking-tight text-ink">
            სად გინდა დარჩე?
          </h1>
          <div className="max-w-md space-y-4">
            <p className="text-base leading-relaxed text-stone-700 sm:text-lg">
              შეარჩიე სასტუმრო საქართველოში, ნახე თავისუფალი თარიღები და გაგზავნე ჯავშნის მოთხოვნა.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link to="/hotels" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                სასტუმროების ძებნა <span aria-hidden="true">↗</span>
              </Link>
              <Link to="/rooms" className={`${textLink} text-sm`}>ნომრების ნახვა</Link>
            </div>
          </div>
        </div>

        <figure className="relative overflow-hidden rounded-xl bg-[#ddd5c8]">
          <img src={heroPhoto} alt="ძველი თბილისის სახურავები და მტკვარი მზის ჩასვლისას"
            fetchPriority="high" width="1536" height="1024"
            className="h-64 w-full object-cover object-[center_57%] sm:h-80 lg:h-104" />
          <figcaption className="absolute bottom-3 right-3 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-ink sm:bottom-5 sm:right-5">
            ძველი თბილისი
          </figcaption>
        </figure>
      </section>

      <section aria-labelledby="destinations-title" className={`${pageWidth} space-y-5 pb-10 sm:pb-14`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-stone-200 pt-6">
          <h2 id="destinations-title" className="text-2xl font-semibold sm:text-3xl">სად წავიდეთ?</h2>
          <Link to="/hotels" className={`${textLink} text-sm`}>
            სასტუმროები ყველა ქალაქში <span aria-hidden="true">→</span>
          </Link>
        </div>
        {destinations.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((city) => {
              const cover = hotels.find((hotel) => hotel.city.id === city.id && hotel.photo)?.photo
              return (
                <li key={city.id}>
                  <Link to={`/hotels?${new URLSearchParams({ city: String(city.id) })}`}
                    className="group flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                    {cover && (
                      <div className="overflow-hidden">
                        <img src={cover} alt="" loading="lazy"
                          className="aspect-2/1 w-full object-cover motion-safe:transition-transform motion-safe:group-hover:scale-105" />
                      </div>
                    )}
                    <div className="flex flex-1 items-start justify-between gap-3 p-4 sm:p-5">
                      <div>
                        <h3 className="text-lg font-semibold">{city.name}</h3>
                        {cityDescriptions[city.name] && (
                          <p className="mt-1 text-sm leading-relaxed text-stone-600">{cityDescriptions[city.name]}</p>
                        )}
                      </div>
                      <span aria-hidden="true" className="text-lg text-brand">↗</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="stays-title" className="border-y border-[#dce5db] bg-[#edf1ec]">
        <div className={`${pageWidth} py-8 sm:py-11`}>
          <h2 id="stays-title" className="text-2xl font-semibold sm:text-3xl">შეარჩიე ნომერი მოგზაურობისთვის</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {stays.map((stay) => (
              <li key={stay.title}>
                <Link to={stay.to}
                  className="group block h-full rounded-lg border border-[#d8e0d7] bg-white p-4 hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-5">
                  <h3 className="flex items-start justify-between gap-2 font-semibold">
                    {stay.title} <span aria-hidden="true" className="text-brand">↗</span>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{stay.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="featured-title" className={`${pageWidth} space-y-5 py-9 sm:py-12`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="featured-title" className="text-2xl font-semibold sm:text-3xl">გამორჩეული ნომრები</h2>
          <Link to="/rooms?is_featured=true" className={`${textLink} text-sm`}>ყველა გამორჩეული ნომერი</Link>
        </div>

        {roomsError && <p role="alert">გამორჩეული ნომრების ჩატვირთვა ვერ მოხერხდა.</p>}
        {!roomsError && rooms === null && <p role="status">ნომრები იტვირთება…</p>}
        {rooms?.length === 0 && <p>გამორჩეული ნომრები ჯერ არ არის.</p>}

        {rooms && rooms.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
          </div>
        )}
      </section>

      <section aria-labelledby="booking-guide" className="border-y border-stone-200 bg-white">
        <div className={`${pageWidth} py-8 sm:py-11`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="booking-guide" className="text-2xl font-semibold sm:text-3xl">როგორ დავჯავშნო?</h2>
            <Link to="/help" className={`${textLink} text-sm`}>ხშირი კითხვები</Link>
          </div>
          <ol className="mt-4 grid gap-5 sm:grid-cols-3">
            {bookingSteps.map((step, index) => (
              <li key={step.title} className="flex gap-3 border-t border-stone-200 pt-4">
                <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-[#edf1ec] text-sm font-semibold text-brand">{index + 1}</span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="host-title" className={`${pageWidth} py-9 sm:py-12`}>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[#1c352a] p-5 text-white sm:p-8">
          <div>
            <h2 id="host-title" className="text-2xl font-semibold">გაქვს სასტუმრო?</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-100">
              დაამატე სასტუმრო და ნომრები. ფოტოებსა და შემოსულ ჯავშნებს პროფილიდან მართავ.
            </p>
          </div>
          <Link to="/profile?tab=hotels" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            ჩემი სასტუმროები <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
