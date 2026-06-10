import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-[var(--destructive)]/30 bg-[var(--score-red-bg)] p-6 text-center"
    >
      <AlertTriangle
        size={32}
        className="text-[var(--destructive)]"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-[var(--score-red)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--destructive)]/50 px-4 py-2 text-sm font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      )}
    </div>
  )
}
