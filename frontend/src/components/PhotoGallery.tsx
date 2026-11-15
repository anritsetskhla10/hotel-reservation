import { useState } from 'react'

import type { GalleryPhoto } from '../types/api'

type Props = {
  name: string
  cover: string | null
  photos?: GalleryPhoto[] | null
}

export default function PhotoGallery({ name, cover, photos }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const images = [
    ...(cover ? [{ id: 'cover', image: cover, caption: '' }] : []),
    ...(Array.isArray(photos) ? photos : []),
  ]
  const selected = images[selectedIndex] ?? images[0]
  if (!selected) return null

  return (
    <section aria-label="ფოტოგალერეა">
      <figure>
        <img
          src={selected.image}
          alt={selected.caption || name}
          className="aspect-4/3 w-full bg-stone-100 object-contain sm:aspect-video"
        />
        {selected.caption && (
          <figcaption className="px-4 pt-3 text-sm text-stone-600">
            {selected.caption}
          </figcaption>
        )}
      </figure>
      {images.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto p-4">
          {images.map((photo, index) => (
            <li key={photo.id} className="shrink-0">
              <button
                type="button"
                aria-label={photo.caption ? `ფოტო ${index + 1} — ${photo.caption}` : `ფოტო ${index + 1}`}
                aria-pressed={selected.id === photo.id}
                onClick={() => setSelectedIndex(index)}
                className="rounded-lg ring-brand ring-offset-2 aria-pressed:ring-2 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <img src={photo.image} alt="" loading="lazy" className="h-14 w-20 rounded-lg object-cover sm:h-16 sm:w-24" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
