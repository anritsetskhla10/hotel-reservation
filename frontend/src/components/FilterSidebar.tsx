import { useId, useState, type ReactNode } from 'react'

export default function FilterSidebar({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()

  return (
    <aside aria-label="ფილტრები"
      className="self-start rounded-xl border border-stone-200 bg-white lg:sticky lg:top-5 lg:max-h-[calc(100dvh-2.5rem)] lg:overflow-y-auto">
      <h2 className="hidden px-4 pt-4 font-semibold lg:block">ფილტრები</h2>
      <button type="button" aria-expanded={expanded} aria-controls={panelId}
        onClick={() => setExpanded((current) => !current)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left font-medium focus-visible:outline-2 focus-visible:outline-brand lg:hidden">
        ფილტრები
        <span aria-hidden="true" className="text-lg">{expanded ? '−' : '+'}</span>
      </button>
      <div id={panelId} className={`${expanded ? 'block' : 'hidden'} p-4 lg:block`}>
        {children}
      </div>
    </aside>
  )
}
