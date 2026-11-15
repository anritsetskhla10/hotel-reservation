import { Link } from 'react-router'

const groups = [
  {
    title: 'აღმოაჩინე',
    links: [
      { to: '/hotels', label: 'სასტუმროები' },
      { to: '/rooms', label: 'ნომრები' },
      { to: '/about', label: 'ჩვენ შესახებ' },
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
    title: 'ინფორმაცია',
    links: [
      { to: '/terms', label: 'გამოყენების პირობები' },
      { to: '/privacy', label: 'კონფიდენციალურობა' },
      { to: '/cookies', label: 'ქუქიები' },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="bg-[#1c352a] text-white">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-5 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Link to="/" className="text-xl font-bold">დარჩი</Link>
            <p className="max-w-xs text-sm leading-relaxed text-stone-200">
              იპოვე სასტუმრო და დაჯავშნე ნომერი შენი მოგზაურობისთვის საქართველოში.
            </p>
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title} className="space-y-2">
              <h2 className="font-semibold">{group.title}</h2>
              <ul className="space-y-2 text-sm text-stone-200">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="hover:text-white hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-8 border-t border-white/20 pt-4 text-sm text-stone-200">
          © 2026 დარჩი
        </p>
      </div>
    </footer>
  )
}