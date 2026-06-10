interface FreshnessBadgeProps {
  fetchedAt: string | null
  ttl: number
}

function getFreshness(
  fetchedAt: string | null,
  ttl: number,
): { level: 'current' | 'stale' | 'expired' | 'unavailable'; dotColor: string; label: string } {
  if (!fetchedAt) {
    return { level: 'unavailable', dotColor: 'bg-[var(--freshness-dot-gray)]', label: 'Unavailable' }
  }

  const age = Date.now() - new Date(fetchedAt).getTime()

  if (age <= ttl) {
    return { level: 'current', dotColor: 'bg-[var(--freshness-dot-green)]', label: 'Current' }
  }

  if (age <= ttl * 2) {
    return { level: 'stale', dotColor: 'bg-[var(--freshness-dot-yellow)]', label: 'Stale' }
  }

  return { level: 'expired', dotColor: 'bg-[var(--freshness-dot-red)]', label: 'Expired' }
}

export function FreshnessBadge({ fetchedAt, ttl }: FreshnessBadgeProps) {
  const { dotColor, label } = getFreshness(fetchedAt, ttl)

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
      <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
