import { useState } from 'react'
import { useNavigate } from 'react-router'

import { postWithCsrf } from '../lib/api'

const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2'

export default function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <form
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault()
          if (submitting) return

          const fields = new FormData(event.currentTarget)
          setSubmitting(true)
          setError('')

          try {
            const response = await postWithCsrf('/api/auth/login/', {
              username: fields.get('username'),
              password: fields.get('password'),
            })

            if (response.status === 400) {
              setError('შეამოწმეთ მომხმარებლის სახელი და პაროლი.')
            } else if (!response.ok) {
              setError('შესვლა ვერ მოხერხდა. სცადეთ ხელახლა.')
            } else {
              navigate('/rooms', { replace: true })
            }
          } catch {
            setError('სერვერთან დაკავშირება ვერ მოხერხდა.')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        <h1 className="text-2xl font-semibold">შესვლა</h1>

        <label className="block space-y-1">
          <span>მომხმარებლის სახელი</span>
          <input name="username" autoComplete="username" required className={inputClass} />
        </label>

        <label className="block space-y-1">
          <span>პაროლი</span>
          <input name="password" type="password" autoComplete="current-password"
            required className={inputClass} />
        </label>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting ? 'მიმდინარეობს შესვლა…' : 'შესვლა'}
        </button>
      </form>
    </main>
  )
}