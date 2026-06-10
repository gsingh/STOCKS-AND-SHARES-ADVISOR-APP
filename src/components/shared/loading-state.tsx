interface LoadingStateProps {
  rows?: number
}

export function LoadingState({ rows = 3 }: LoadingStateProps) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-4 w-3/5 animate-pulse rounded bg-[var(--muted)]" />
          {i === 0 && (
            <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--muted)]" />
          )}
          <div className="h-10 w-full animate-pulse rounded bg-[var(--muted)]" />
        </div>
      ))}
      <span className="sr-only">Loading data...</span>
    </div>
  )
}
