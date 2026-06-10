import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

type Listener = (toasts: ToastMessage[]) => void

let listeners: Listener[] = []
let toasts: ToastMessage[] = []
let nextId = 0

function notify() {
  const snapshot = [...toasts]
  listeners.forEach((l) => l(snapshot))
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const id = nextId++
  toasts = [...toasts, { id, message, type }]
  notify()

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  }, 4000)
}

function useToast() {
  const [state, setState] = useState<ToastMessage[]>([])

  useEffect(() => {
    listeners.push(setState)
    setState([...toasts])
    return () => {
      listeners = listeners.filter((l) => l !== setState)
    }
  }, [])

  return state
}

function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: CheckCircle,
}

const styles: Record<string, string> = {
  success: 'border-[var(--score-green)]/30 bg-[var(--score-green-bg)]',
  error: 'border-[var(--destructive)]/30 bg-[var(--score-red-bg)]',
  info: 'border-[var(--ring)]/30 bg-[var(--muted)]',
}

const iconColors: Record<string, string> = {
  success: 'text-[var(--score-green)]',
  error: 'text-[var(--destructive)]',
  info: 'text-[var(--ring)]',
}

export function ToastContainer() {
  const toasts = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${styles[t.type]}`}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${iconColors[t.type]}`} />
            <p className="text-sm text-[var(--foreground)]">{t.message}</p>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
