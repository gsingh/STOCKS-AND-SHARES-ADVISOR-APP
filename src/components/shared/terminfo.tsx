import { useState, useRef, useLayoutEffect, useCallback } from 'react'
import { Info, X } from 'lucide-react'

interface TermInfoProps {
  term: string
  definition: string
  example?: string
  whyMatters?: string
}

export function TermInfo({ term, definition, example, whyMatters }: TermInfoProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPosition({ top: rect.bottom + 4, left: rect.left })
  }, [])

  useLayoutEffect(() => {
    if (!open) return

    updatePosition()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    const onClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={btnRef}
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        aria-label={`Learn more about ${term}`}
        aria-expanded={open}
      >
        <Info size={16} />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={`Definition: ${term}`}
          className="fixed z-50 w-72 rounded-lg border border-[var(--border)] bg-[var(--popover)] p-4 shadow-lg"
          style={{ top: position.top, left: position.left }}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-[var(--popover-foreground)]">
              {term}
            </h4>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          <p className="mb-3 text-sm leading-relaxed text-[var(--popover-foreground)]">
            {definition}
          </p>

          {example && (
            <div className="mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Example
              </span>
              <p className="mt-0.5 text-sm text-[var(--popover-foreground)]">
                {example}
              </p>
            </div>
          )}

          {whyMatters && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Why it matters
              </span>
              <p className="mt-0.5 text-sm text-[var(--popover-foreground)]">
                {whyMatters}
              </p>
            </div>
          )}
        </div>
      )}
    </span>
  )
}
