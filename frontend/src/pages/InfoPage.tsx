import { Link } from 'react-router'

const pages = {
  about: {
    title: 'ჩვენ შესახებ',
    intro: '„დარჩი“ საქართველოში სასტუმროებისა და ნომრების მოძებნაში გეხმარება.',
    sections: [
      ['როგორ მუშაობს', 'აირჩიე ქალაქი, შეამოწმე თავისუფალი თარიღები და დაჯავშნე ნომერი.'],
    ],
  },
  help: {
    title: 'ხშირი კითხვები',
    intro: 'დახმარება ნომრის არჩევაში, დაჯავშნასა და გაუქმებაში.',
    sections: [
      ['როგორ დავჯავშნო ნომერი?', 'შედი ანგარიშში, გახსენი ნომრის დეტალები და შეავსე თარიღები და საკონტაქტო ინფორმაცია.'],
      ['სად ვნახო ჩემი ჯავშნები?', 'გახსენი პროფილი და აირჩიე „ჩემი ჯავშნები“.'],
      ['როგორ გავაუქმო ჯავშანი?', 'პროფილში გახსენი ჯავშნების ჩანართი და დადასტურებულ ჯავშანთან დააჭირე „გაუქმებას“.'],
    ],
  },
  contact: {
    title: 'კონტაქტი',
    intro: 'ჯავშნის დეტალებსა და სტატუსს საკუთარ ანგარიშში ნახავ.',
    sections: [
      ['დახმარება ჯავშანზე', 'დაჯავშნისა და გაუქმების ნაბიჯები აღწერილია ხშირ კითხვებში.'],
    ],
  },
  terms: {
    title: 'გამოყენების პირობები',
    intro: 'დაჯავშნისა და გაუქმების წესები.',
    sections: [
      ['დადასტურება', 'სისტემა შენახვამდე ამოწმებს ხელმისაწვდომობას და აფიქსირებს ჯამურ ფასს.'],
      ['გაუქმება', 'ჯავშანი შეგიძლია გააუქმო პროფილიდან. ჩანაწერი ისტორიაში დარჩება.'],
    ],
  },
  privacy: {
    title: 'კონფიდენციალურობა',
    intro: 'რა მონაცემებს იყენებს ანგარიში და ჯავშანი.',
    sections: [
      ['ანგარიში', 'რეგისტრაციისას ინახება ანგარიშის სახელი და საკონტაქტო ინფორმაცია.'],
      ['ჯავშანი', 'ჯავშანში ინახება ნომერი, თარიღები და დაჯავშნისას მითითებული კონტაქტი.'],
    ],
  },
  cookies: {
    title: 'ქუქიები',
    intro: 'ქუქიები გამოიყენება ანგარიშში შესვლისა და ფორმების დაცვისთვის.',
    sections: [
      ['სესია', 'სესიის ქუქი საიტს მიმდინარე ანგარიშის ამოცნობაში ეხმარება.'],
      ['ფორმების დაცვა', 'CSRF ქუქი ფორმის გაგზავნისას უსაფრთხოების ტოკენის შემოწმებას ემსახურება.'],
    ],
  },
} as const

export default function InfoPage({ page }: { page: keyof typeof pages }) {
  const { title, intro, sections } = pages[page]

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="d-title">{title}</h1>
      <p className="text-stone-600">{intro}</p>

      {sections.map(([heading, text]) =>
        page === 'help' ? (
          <details key={heading} className="d-panel">
            <summary className="cursor-pointer font-medium">{heading}</summary>
            <p className="mt-2 text-stone-700">{text}</p>
          </details>
        ) : (
          <section key={heading} className="d-panel space-y-2">
            <h2 className="text-lg font-semibold">{heading}</h2>
            <p className="text-stone-700">{text}</p>
          </section>
        ),
      )}

      {page === 'contact' && (
        <Link to="/help" className="font-medium text-brand underline">
          ხშირი კითხვების ნახვა
        </Link>
      )}
    </main>
  )
}