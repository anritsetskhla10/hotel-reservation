import { NavLink } from 'react-router'

const linkClass =
  'rounded-md px-3 py-2 text-sm font-medium hover:bg-canvas ' +
  'aria-[current=page]:bg-brand aria-[current=page]:text-white ' +
  'aria-[current=page]:hover:bg-brand-hover'

export default function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <nav
        aria-label="მთავარი ნავიგაცია"
        className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-3 sm:px-6"
      >
        <NavLink to="/" end className={linkClass}>
            მთავარი
        </NavLink>
        <NavLink to="/hotels" className={linkClass}>
            სასტუმროები
        </NavLink>
        <NavLink to="/rooms" className={linkClass}>
            ნომრები
        </NavLink>
        <NavLink to="/login" className={linkClass}>
            შესვლა
        </NavLink>
        <NavLink to="/bookings" className={linkClass}>
            ჩემი ჯავშნები
        </NavLink>
      </nav>
    </header>
  )
}