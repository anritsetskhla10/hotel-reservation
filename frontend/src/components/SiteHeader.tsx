import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'

import { getJson } from '../lib/api'

const navigation = [
  { path: '/hotels', label: 'სასტუმროები' },
  { path: '/rooms', label: 'ნომრები' },
  { path: '/help', label: 'დახმარება' },
]

const linkClass =
  'flex min-h-11 items-center rounded-md px-3 text-sm font-medium ' +
  'text-stone-700 hover:bg-[#edf1ec] hover:text-brand focus-visible:outline-2 focus-visible:outline-brand ' +
  'aria-[current=page]:bg-[#edf1ec] aria-[current=page]:text-brand'

export default function SiteHeader() {
  const location = useLocation()
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    getJson<{ username: string }>('/api/auth/me/', controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setSignedIn(true)
      })
      .catch(() => {
        if (!controller.signal.aborted) setSignedIn(false)
      })

    return () => controller.abort()
  }, [location.key])

  return (
    <header className="relative z-20 border-b border-stone-200 bg-[#f7f8f3]">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 md:gap-8 lg:px-8">
        <Link to="/" aria-label="დარჩი — მთავარი"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 text-2xl font-bold leading-none tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-brand">
          <span aria-hidden="true" className="relative h-6 w-6 rounded-sm bg-brand">
            <span className="absolute inset-x-1.5 bottom-0 h-4 rounded-t-full border-2 border-b-0 border-[#f7f8f3]" />
          </span>
          დარჩი
        </Link>

        <nav aria-label="მთავარი ნავიგაცია"
          className="hidden items-center gap-1 border-l border-stone-200 pl-4 md:flex">
          {navigation.map(({ path, label }) => (
            <NavLink key={path} to={path} className={linkClass}>{label}</NavLink>
          ))}
        </nav>

        <Link to={signedIn ? '/profile' : '/login'}
          className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-ink hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          {signedIn ? 'პროფილი' : 'შესვლა'}
        </Link>

        <details key={location.key} className="group md:hidden">
          <summary aria-label="ნავიგაციის მენიუ"
            className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md border border-stone-300 bg-white hover:border-brand focus-visible:outline-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="flex w-4 flex-col gap-1 group-open:hidden">
              <span className="h-px w-full bg-ink" />
              <span className="h-px w-full bg-ink" />
              <span className="h-px w-full bg-ink" />
            </span>
            <span aria-hidden="true" className="hidden text-xl leading-none group-open:block">×</span>
          </summary>
          <nav aria-label="მობილური ნავიგაცია"
            className="absolute inset-x-0 top-full grid gap-1 border-y border-stone-200 bg-white p-4 shadow-sm">
            {navigation.map(({ path, label }) => (
              <NavLink key={path} to={path} className={linkClass}>{label}</NavLink>
            ))}
          </nav>
        </details>
      </div>
    </header>
  )
}
