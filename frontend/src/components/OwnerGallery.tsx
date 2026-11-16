import { useEffect, useState, type FormEvent } from 'react'

import { getJson, sendWithCsrf } from '../lib/api'
import type { GalleryPhoto } from '../types/api'

type ManagedPhoto = GalleryPhoto & { position: number }

const inputClass = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2'
const buttonClass = 'rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-60'

export default function OwnerGallery({ endpoint }: { endpoint: string }) {
  const [photos, setPhotos] = useState<ManagedPhoto[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getJson<ManagedPhoto[]>(endpoint, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setPhotos(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true)
      })
    return () => controller.abort()
  }, [endpoint])

  async function changePhoto(
    method: 'POST' | 'PATCH' | 'DELETE',
    photoId?: number,
    form?: HTMLFormElement,
  ) {
    if (saving) return
    const data = form ? new FormData(form) : undefined
    const path = photoId === undefined ? endpoint : `${endpoint}${photoId}/`
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await sendWithCsrf(path, method, data)
      if (response.status === 400) {
        const errors: Record<string, string[]> = await response.json().catch(() => ({}))
        setError(Object.values(errors).flat().join(' ') || 'შეამოწმეთ ფოტოს მონაცემები.')
        return
      }
      if (!response.ok) throw new Error('Gallery update failed')

      if (method === 'DELETE') {
        setPhotos((current) => current?.filter((photo) => photo.id !== photoId) ?? [])
        setNotice('ფოტო გალერეიდან ამოიღეთ.')
      } else {
        const updated: ManagedPhoto = await response.json()
        setPhotos((current) => method === 'POST'
          ? [...(current ?? []), updated]
          : (current ?? []).map((photo) => photo.id === updated.id ? updated : photo))
        if (method === 'POST') form?.reset()
        setNotice(method === 'POST' ? 'ფოტო დაემატა.' : 'ცვლილება შენახულია.')
      }
    } catch {
      setError('ცვლილება ვერ შეინახა. სცადეთ ხელახლა.')
    } finally {
      setSaving(false)
    }
  }

  function submitPhoto(event: FormEvent<HTMLFormElement>, photoId?: number) {
    event.preventDefault()
    void changePhoto(photoId === undefined ? 'POST' : 'PATCH', photoId, event.currentTarget)
  }

  if (loadError) return <p role="alert">გალერეის ჩატვირთვა ვერ მოხერხდა.</p>
  if (!photos) return <p role="status">გალერეა იტვირთება…</p>

  const orderedPhotos = [...photos].sort((a, b) => a.position - b.position || a.id - b.id)

  return (
    <section aria-label="გალერეის მართვა" className="space-y-3 border-t border-stone-200 py-3">
      {photos.length === 0 && <p className="text-sm">დამატებითი ფოტოები ჯერ არ გაქვთ.</p>}
      {orderedPhotos.map((photo) => (
        <form key={photo.id} onSubmit={(event) => submitPhoto(event, photo.id)} className="space-y-2">
          <img src={photo.image} alt={photo.caption || 'გალერეის ფოტო'} loading="lazy"
            className="h-24 w-36 rounded-lg object-cover" />
          <fieldset disabled={saving} className="space-y-2">
            <label className="block text-sm">
              აღწერა
              <input name="caption" maxLength={200} defaultValue={photo.caption} className={inputClass} />
            </label>
            <label className="block text-sm">
              რიგითობა
              <input name="position" type="number" min={0} max={2147483647} required
                defaultValue={photo.position} className={inputClass} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={buttonClass}>შენახვა</button>
              <button type="button" className={buttonClass} onClick={() => {
                if (window.confirm('ამოვიღოთ ფოტო გალერეიდან?')) void changePhoto('DELETE', photo.id)
              }}>ფოტოს ამოღება</button>
            </div>
          </fieldset>
        </form>
      ))}
      <form onSubmit={submitPhoto} encType="multipart/form-data" className="space-y-2">
        <fieldset disabled={saving} className="space-y-2">
          <legend className="font-medium">დამატებითი ფოტოს ატვირთვა</legend>
          <input aria-label="ფოტო" type="file" name="image" accept="image/*" required className={inputClass} />
          <label className="block text-sm">
            აღწერა
            <input name="caption" maxLength={200} className={inputClass} />
          </label>
          <label className="block text-sm">
            რიგითობა
            <input name="position" type="number" min={0} max={2147483647} required
              defaultValue={0} className={inputClass} />
          </label>
          <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm text-white disabled:opacity-60">
            ფოტოს დამატება
          </button>
        </fieldset>
      </form>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    </section>
  )
}

