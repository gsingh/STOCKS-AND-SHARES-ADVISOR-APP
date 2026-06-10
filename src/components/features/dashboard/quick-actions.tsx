import { useNavigate } from '@tanstack/react-router'
import { TrendingUp, BookOpen, ClipboardCheck, GitCompare } from 'lucide-react'

const ACTIONS = [
  { label: 'Add Stock', icon: TrendingUp, to: '/stocks' },
  { label: 'New Journal Entry', icon: BookOpen, to: '/journal' },
  { label: 'Start Review', icon: ClipboardCheck, to: '/reviews' },
  { label: 'New Comparison', icon: GitCompare, to: '/compare' },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.label}
            onClick={() => navigate({ to: action.to as any })}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Icon size={18} className="text-[var(--primary)]" />
            {action.label}
          </button>
        )
      })}
    </div>
  )
}
