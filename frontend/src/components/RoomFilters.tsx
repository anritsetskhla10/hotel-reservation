import { useState } from 'react'
import { useSearchParams } from 'react-router'

const inputClass = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2'

const fields = [
  { name: 'min_price', label: 'მინ. ფასი (₾)', type: 'number' },
  { name: 'max_price', label: 'მაქს. ფასი (₾)', type: 'number' },
  { name: 'check_in', label: 'შესვლა', type: 'date' },
  { name: 'check_out', label: 'გასვლა', type: 'date' },
] as const

export default function RoomFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [error, setError] = useState('')
  const hotelId = searchParams.get('hotel')

  return (
    <form
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault()

        const next = new URLSearchParams()
        if (hotelId) next.set('hotel', hotelId)

        new FormData(event.currentTarget).forEach((value, name) => {
          if (typeof value === 'string' && value.trim()) {
            next.set(name, value.trim())
          }
        })

        const checkIn = next.get('check_in')
        const checkOut = next.get('check_out')
        if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
          setError('მიუთითეთ შესვლისა და გასვლის ორივე თარიღი.')
          return
        }
        if (checkIn && checkOut && checkOut <= checkIn) {
          setError('გასვლის თარიღი შესვლაზე გვიან უნდა იყოს.')
          return
        }

        const minPrice = next.get('min_price')
        const maxPrice = next.get('max_price')
        if (minPrice !== null && maxPrice !== null && Number(minPrice) > Number(maxPrice)) {
          setError('მაქსიმალური ფასი მინიმალურზე ნაკლებია.')
          return
        }

        setError('')
        setSearchParams(next)
      }}
      onReset={() => {
        setError('')
        setSearchParams(hotelId ? { hotel: hotelId } : {})
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span>ნომრის ტიპი</span>
          <select name="room_type" className={inputClass}
            defaultValue={searchParams.get('room_type') ?? ''}>
            <option value="">ყველა ტიპი</option>
            <option value="single">ერთადგილიანი</option>
            <option value="double">ორადგილიანი</option>
            <option value="deluxe">დელუქსი</option>
          </select>
        </label>

        {fields.map(({ name, label, type }) => (
          <label key={name} className="space-y-1 text-sm">
            <span>{label}</span>
            <input
              className={inputClass}
              name={name}
              type={type}
              min={type === 'number' ? '0' : undefined}
              step={type === 'number' ? '0.01' : undefined}
              defaultValue={searchParams.get(name) ?? ''}
            />
          </label>
        ))}

        <label className="space-y-1 text-sm">
          <span>გამორჩეული ნომრები</span>
          <select name="is_featured" className={inputClass}
            defaultValue={searchParams.get('is_featured') ?? ''}>
            <option value="">ყველა ნომერი</option>
            <option value="true">მხოლოდ გამორჩეული</option>
            <option value="false">მხოლოდ დანარჩენი</option>
          </select>
        </label>
      </div>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-hover">
          ძებნა
        </button>
        <button type="reset" className="rounded-lg border border-stone-300 px-4 py-2">
          გასუფთავება
        </button>
      </div>
    </form>
  )
}