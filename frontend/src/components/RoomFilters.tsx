import { useState } from 'react'
import { useSearchParams } from 'react-router'

import type { RoomType } from '../types/api'

const inputClass = 'd-control'

const roomTypes: Record<RoomType, string> = {
  single: 'ერთადგილიანი',
  double: 'ორადგილიანი ორმაგი საწოლით',
  twin: 'ორადგილიანი ცალკე საწოლებით',
  triple: 'სამადგილიანი',
  family: 'საოჯახო',
  deluxe: 'დელუქსი',
  other: 'სხვა',
}

const fields = [
  { name: 'guests', label: 'სტუმრების რაოდენობა', type: 'number', min: '1', step: '1' },
  { name: 'min_price', label: 'მინ. ფასი (₾)', type: 'number', min: '0', step: '0.01' },
  { name: 'max_price', label: 'მაქს. ფასი (₾)', type: 'number', min: '0', step: '0.01' },
  { name: 'check_in', label: 'შესვლა', type: 'date', min: undefined, step: undefined },
  { name: 'check_out', label: 'გასვლა', type: 'date', min: undefined, step: undefined },
] as const

export default function RoomFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [error, setError] = useState('')
  const hotelId = searchParams.get('hotel')

  return (
    <form
      className="space-y-4"
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="space-y-1 text-sm">
          <span>ნომრის ტიპი</span>
          <select name="room_type" className={inputClass}
            defaultValue={searchParams.get('room_type') ?? ''}>
            <option value="">ყველა ტიპი</option>
            {Object.entries(roomTypes).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        {fields.map(({ name, label, type, min, step }) => (
          <label key={name} className="space-y-1 text-sm">
            <span>{label}</span>
            <input
              className={inputClass}
              name={name}
              type={type}
              min={min}
              step={step}
              defaultValue={searchParams.get(name) ?? ''}
            />
          </label>
        ))}

        <label className="space-y-1 text-sm">
          <span>დალაგება</span>
          <select name="sort" className={inputClass}
            defaultValue={searchParams.get('sort') ?? ''}>
            <option value="">ნაგულისხმევი რიგი</option>
            <option value="price_asc">ჯერ იაფი ნომრები</option>
            <option value="price_desc">ჯერ ძვირი ნომრები</option>
          </select>
        </label>

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

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <button type="submit" className="d-button">
          ძებნა
        </button>
        <button type="reset" className="d-button d-secondary">
          <span aria-hidden="true">↺</span> გასუფთავება
        </button>
      </div>
    </form>
  )
}
