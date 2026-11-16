import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { postWithCsrf } from '../lib/api'
import { buildAuthPath, getRoomReturnPath } from '../lib/authNavigation'

const inputClass = 'd-control'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnPath = getRoomReturnPath(searchParams.get('next'))
  const registerPath = buildAuthPath('/register', returnPath)

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        return
      }

      if (response.status === 403) {
        const denial: { code?: string; detail?: string } | null =
          await response.json().catch(() => null)

        if (denial?.code === 'admin_only' && denial.detail) {
          setError(denial.detail)
          return
        }
      }

      if (!response.ok) {
        setError('შესვლა ვერ მოხერხდა. სცადეთ ხელახლა.')
        return
      }

      navigate(returnPath ?? '/profile', { replace: true })
    } catch {
      setError('სერვერთან დაკავშირება ვერ მოხერხდა.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="d-panel space-y-4 sm:p-7"
      >
        <h1 className="d-title">შესვლა</h1>

        <label className="block space-y-1">
          <span>მომხმარებლის სახელი</span>
          <input
            name="username"
            autoComplete="username"
            required
            disabled={submitting}
            className={inputClass}
          />
        </label>

        <label className="block space-y-1">
          <span>პაროლი</span>
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={submitting}
            className={inputClass}
          />
        </label>

        <label className="flex w-fit items-center gap-2 text-sm">
          <input type="checkbox" checked={showPassword} className="size-4 accent-brand"
            onChange={(event) => setShowPassword(event.target.checked)} />
          პაროლის ჩვენება
        </label>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="d-button w-full"
        >
          {submitting ? 'მიმდინარეობს შესვლა…' : 'შესვლა'}
        </button>

        <p className="text-sm">
          ჯერ არ გაქვთ ანგარიში?{' '}
          <Link to={registerPath} className="font-medium text-brand underline">
            დარეგისტრირდით
          </Link>
        </p>
      </form>
    </main>
  )
}
