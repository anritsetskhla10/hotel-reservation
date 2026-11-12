import { BrowserRouter, Route, Routes } from 'react-router'
import HotelsPage from './pages/HotelsPage'
import SiteHeader from './components/SiteHeader'
import RoomsPage from './pages/RoomsPage'
import RoomDetailPage from './pages/RoomDetailPage'
import LoginPage from './pages/LoginPage'
import BookingsPage from './pages/BookingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <SiteHeader />

      <Routes>
        <Route path="/" element={<main><h1>სასტუმროს დაჯავშნა</h1></main>} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:id" element={<RoomDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="*" element={<main><h1>გვერდი ვერ მოიძებნა</h1></main>} />
      </Routes>
    </BrowserRouter>
  )
}