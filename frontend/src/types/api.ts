export type City = {
  id: number
  name: string
}

export type Hotel = {
  id: number
  name: string
  description: string
  address: string
  photo: string | null
  city: City
}

export type Room = {
  id: number
  hotel: number
  hotel_name: string
  city: City
  room_number: string
  name: string
  room_type: 'single' | 'double' | 'deluxe'
  room_type_display: string
  description: string
  price_per_night: string
  capacity: number
  photo: string | null
  is_featured: boolean
}

export type Booking = {
  id: number
  hotel_name: string
  hotel_photo: string | null
  city: City
  room_name: string
  room_photo: string | null
  contact_name: string
  contact_phone: string
  check_in: string
  check_out: string
  price_per_night: string
  total_price: string
  status: 'confirmed' | 'cancelled'
  status_display: string
}