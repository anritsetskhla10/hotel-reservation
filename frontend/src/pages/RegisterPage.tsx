import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'

import { postWithCsrf } from '../lib/api'
import { buildAuthPath, getRoomReturnPath } from '../lib/authNavigation'

const fields = [
  { name: 'first_name', label: 'სახელი', type: 'text', autoComplete: 'given-name', maxLength: 150 },
  { name: 'last_name', label: 'გვარი', type: 'text', autoComplete: 'family-name', maxLength: 150 },
  { name: 'username', label: 'მომხმარებლის სახელი', type: 'text', autoComplete: 'username', maxLength: 150 },
  { name: 'email', label: 'ელფოსტა', type: 'email', autoComplete: 'email', maxLength: 254 },
  { name: 'phone', label: 'ტელეფონი', type: 'tel', autoComplete: 'tel', maxLength: 20 },
  { name: 'password', label: 'პაროლი', type: 'password', autoComplete: 'new-password' },
  { name: 'password_confirm', label: 'გაიმეორეთ პაროლი', type: 'password', autoComplete: 'new-password' },
] as const

type RegistrationErrors = Record<string, string | string[]>

function errorText(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join(' ') : value
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const returnPath = getRoomReturnPath(searchParams.get('next'))
  const loginPath = buildAuthPath('/login', returnPath)

  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const data = Object.fromEntries(new FormData(event.currentTarget))
    setErrors({})
    setError('')

    if (data.password !== data.password_confirm) {
      setErrors({ password_confirm: 'პაროლები ერთმანეთს არ ემთხვევა.' })
      return
    }

    setSubmitting(true)

    try {
      const response = await postWithCsrf('/api/auth/register/', data)

      if (response.status === 400) {
        const details: RegistrationErrors | null =
          await response.json().catch(() => null)

        if (details && Object.keys(details).length > 0) {
          setErrors(details)
        } else {
          setError('შეამოწმეთ რეგისტრაციის მონაცემები.')
        }

        return
      }

      if (!response.ok) {
        setError('რეგისტრაცია ვერ მოხერხდა. სცადეთ ხელახლა.')
        return
      }

      setRegistered(true)
    } catch {
      setError('სერვერთან დაკავშირება ვერ მოხერხდა.')
    } finally {
      setSubmitting(false)
    }
  }

  const formError =
    error || errorText(errors.detail) || errorText(errors.non_field_errors)

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <h1 className="text-3xl font-semibold">რეგისტრაცია</h1>

        {registered ? (
          <div className="space-y-3">
            <p role="status">ანგარიში შეიქმნა. ახლა შეგიძლიათ შეხვიდეთ.</p>
            <Link to={loginPath} className="font-medium text-brand underline">
              {returnPath ? 'შესვლა და დაჯავშნის გაგრძელება' : 'შესვლის გვერდი'}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const message = errorText(errors[field.name])
                const errorId = `${field.name}-error`

                return (
                  <div key={field.name} className="space-y-1">
                    <label htmlFor={field.name} className="block text-sm font-medium">
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      maxLength={'maxLength' in field ? field.maxLength : undefined}
                      required
                      disabled={submitting}
                      aria-invalid={Boolean(message)}
                      aria-describedby={message ? errorId : undefined}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 disabled:opacity-60"
                    />
                    {message && (
                      <p id={errorId} role="alert" className="text-sm text-red-700">
                        {message}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {formError && (
              <p role="alert" className="text-sm text-red-700">{formError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {submitting ? 'ანგარიში იქმნება…' : 'ანგარიშის შექმნა'}
            </button>

            <p className="text-sm">
              უკვე გაქვთ ანგარიში?{' '}
              <Link to={loginPath} className="font-medium text-brand underline">
                შედით
              </Link>
            </p>
          </form>
        )}
      </section>
    </main>
  )
}