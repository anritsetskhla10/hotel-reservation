import { Link } from 'react-router'

const groups = [
  {
    title: 'მოგზაურობა',
    links: [
      { to: '/hotels', label: 'სასტუმროები' },
      { to: '/rooms', label: 'ნომრები' },
    ],
  },
  {
    title: 'დახმარება',
    links: [
      { to: '/help', label: 'ხშირი კითხვები' },
      { to: '/contact', label: 'კონტაქტი' },
    ],
  },
  {
    title: 'წესები და პირობები',
    links: [
      { to: '/terms', label: 'გამოყენების პირობები' },
      { to: '/privacy', label: 'კონფიდენციალურობა' },
      { to: '/cookies', label: 'ქუქიები' },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#dce5db] bg-[#f0f3ed] text-ink">
      <div className="mx-auto max-w-7xl px-4 pb-5 pt-9 sm:px-6 sm:pt-12 lg:px-8">
        <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:gap-x-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 space-y-3 lg:col-span-1">
            <Link to="/" aria-label="დარჩი — მთავარი"
              className="inline-flex min-h-10 items-center gap-2 text-2xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
              <span aria-hidden="true" className="relative h-6 w-6 rounded-sm bg-brand">
                <span className="absolute inset-x-1.5 bottom-0 h-4 rounded-t-full border-2 border-b-0 border-[#f0f3ed]" />
              </span>
              დარჩი
            </Link>
            <Link to="/about" className="block w-fit text-sm font-semibold text-brand underline underline-offset-4">
              ჩვენ შესახებ
            </Link>
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title} className="space-y-2">
              <h2 className="font-semibold">{group.title}</h2>
              <ul className="text-sm text-stone-700">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}
                      className="inline-flex min-h-9 items-center hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-7 border-t border-[#d6dfd6] pt-4 text-sm text-stone-600">
          © 2026 დარჩი
        </p>
      </div>
    </footer>
  )
}
