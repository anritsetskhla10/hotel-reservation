import { BrowserRouter, Route, Routes, Navigate, Link } from 'react-router'
import HotelsPage from './pages/HotelsPage'
import HotelDetailPage from './pages/HotelDetailPage'
import SiteHeader from './components/SiteHeader'
import RoomsPage from './pages/RoomsPage'
import RoomDetailPage from './pages/RoomDetailPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import SiteFooter from './components/SiteFooter'
import InfoPage from './pages/InfoPage'

export default function App() {
  return (
    <BrowserRouter>
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/hotels/:id" element={<HotelDetailPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/bookings" element={<Navigate to="/profile?tab=bookings" replace />} />
          <Route path="/about" element={<InfoPage page="about" />} />
          <Route path="/help" element={<InfoPage page="help" />} />
          <Route path="/contact" element={<InfoPage page="contact" />} />
          <Route path="/terms" element={<InfoPage page="terms" />} />
          <Route path="/privacy" element={<InfoPage page="privacy" />} />
          <Route path="/cookies" element={<InfoPage page="cookies" />} />
          <Route path="*" element={(
            <main className="mx-auto max-w-xl px-4 py-12">
              <div className="d-panel space-y-4">
                <h1 className="d-title">გვერდი ვერ მოიძებნა</h1>
                <Link to="/" className="d-button">მთავარ გვერდზე დაბრუნება</Link>
              </div>
            </main>
          )} />
        </Routes>
      </div>
      <SiteFooter />
    </div>
  </BrowserRouter>
  )
}
