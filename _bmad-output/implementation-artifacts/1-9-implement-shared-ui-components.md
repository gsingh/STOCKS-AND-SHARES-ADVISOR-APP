# Story 1.9: Implement shared UI components

Status: ready-for-dev

## Story

As a developer,
I want shared UI components (FreshnessBadge, LoadingState, ErrorState, ScoreGauge, TermInfo) implemented,
So that all feature surfaces consume consistent loading, error, freshness, and score-display patterns.

## Acceptance Criteria

1. `src/components/shared/freshness-badge.tsx`: renders colored dot + text label based on TTL comparison — green "Current" (within TTL), yellow "Stale" (<=2x TTL), red "Expired" (>2x TTL), gray "Unavailable" (no data). Both color and text present for accessibility (UX-19).
2. `src/components/shared/loading-state.tsx`: renders shadcn Skeleton rows matching expected content layout (UX-12). Props for row count and layout variant.
3. `src/components/shared/error-state.tsx`: renders error message + optional "Retry" button. Error message announced via aria-live region.
4. `src/components/shared/score-gauge.tsx`: renders score (0-100) with color-coded tier label: >=70 green "Strong", >=50 amber "Average", <50 red "Weak".
5. `src/components/shared/term-info.tsx`: renders hover/click icon that opens shadcn Popover with term name, category, definition, example, "why it matters". Dismisses on click outside and Escape key (UX-17).
6. Each component has complete TypeScript prop interfaces.
7. Each component has a co-located test file (`*.test.tsx`) covering all states.

## Tasks / Subtasks

- [ ] Implement FreshnessBadge component with TTL comparison logic (AC: #1)
- [ ] Implement LoadingState component with Skeleton rows (AC: #2)
- [ ] Implement ErrorState component with aria-live and Retry button (AC: #3)
- [ ] Implement ScoreGauge component with color-coded tiers (AC: #4)
- [ ] Implement TermInfo component with Popover (AC: #5)
- [ ] Define TypeScript interfaces for all component props (AC: #6)
- [ ] Write co-located tests for each component (AC: #7)

## Dev Notes

### Architecture Patterns & Constraints

- **Zero-backend mandate:** All computation client-side. No server, no auth, no API keys. [Source: architecture.md#L44-L46]
- **feature-based directory structure:** `src/features/` for pure domain logic (zero React imports), `src/components/features/` for React components, `src/services/` for data access. [Source: architecture.md#L188-L192]
- **Naming conventions:** kebab-case files, PascalCase components, camelCase functions/vars. [Source: architecture.md#L170-L184]
- **Co-located tests:** `freshness-badge.test.tsx` next to `freshness-badge.tsx`. Never use `__tests__/` directories. [Source: architecture.md#L184]
- **en-IN locale** formatting for all displayed numeric/currency values. [Source: DESIGN.md#L140]
- **dark mode** via `.dark` class + CSS custom properties (not a separate stylesheet). [Source: DESIGN.md#L128]
- **Inter + JetBrains Mono** loaded as custom fonts. `tabular-nums` on all financial figures. [Source: DESIGN.md#L136-L139]
- **No React in `features/`** — pure domain logic only. React components in `components/features/`. [Source: architecture.md#L239-L241]
- **Score tiers:** green >=15, amber >=10, orange >=5, red <5 (parameter level). Composite: >=70 green, >=50 amber, <50 red. [Source: EXPERIENCE.md#L103-L104]
- **Accessibility:** Score colors accompanied by text labels for color-blind users. FreshnessBadge uses both color and shape (dot + text label). [Source: EXPERIENCE.md#L127-L128]

### Component Props & TypeScript Interfaces

```tsx
// freshness-badge.tsx
export type FreshnessLevel = 'current' | 'stale' | 'expired' | 'unavailable'

export interface FreshnessBadgeProps {
  fetchedAt: string | null        // ISO 8601 timestamp of last fetch
  ttlMinutes: number              // TTL in minutes (15 for quotes, 1440 for fundamentals)
  className?: string
}

// loading-state.tsx
export type LoadingVariant = 'card' | 'table-row' | 'detail' | 'chart'

export interface LoadingStateProps {
  variant?: LoadingVariant       // Default: 'card'
  rows?: number                  // Number of skeleton rows (default: 4)
  className?: string
}

// error-state.tsx
export interface ErrorStateProps {
  message: string                // Human-readable error description
  onRetry?: () => void           // Optional retry callback
  className?: string
}

// score-gauge.tsx
export type ScoreTier = 'strong' | 'average' | 'weak'

export interface ScoreGaugeProps {
  score: number                  // 0-100 composite score
  size?: 'sm' | 'md' | 'lg'     // Default: 'md'
  showLabel?: boolean            // Default: true
  className?: string
}

// term-info.tsx
export interface TermInfoData {
  name: string
  category: string
  definition: string
  example?: string
  whyItMatters: string
}

export interface TermInfoProps {
  term: TermInfoData
  side?: 'top' | 'right' | 'bottom' | 'left'  // Popover side (default: 'top')
  className?: string
}
```

### FreshnessBadge TTL Comparison Logic

```tsx
function getFreshnessLevel(fetchedAt: string | null, ttlMinutes: number): FreshnessLevel {
  if (!fetchedAt) return 'unavailable'

  const now = Date.now()
  const fetched = new Date(fetchedAt).getTime()
  const elapsedMs = now - fetched
  const ttlMs = ttlMinutes * 60 * 1000

  if (elapsedMs <= ttlMs) return 'current'
  if (elapsedMs <= ttlMs * 2) return 'stale'
  return 'expired'
}
```

Color-config mapping:

| Level | Dot Color | CSS Variable | Text Label | Hex |
|---|---|---|---|---|
| current | green | `--freshness-dot-green` | "Current" | `#22C55E` |
| stale | yellow | `--freshness-dot-yellow` | "Stale" | `#EAB308` |
| expired | red | `--freshness-dot-red` | "Expired" | `#EF4444` |
| unavailable | gray | `--freshness-dot-gray` | "Unavailable" | `#9CA3AF` |

Accessibility: Both the colored dot AND the text label are rendered. The dot is a `<span>` with inline color styling using the CSS variable. The text label provides the non-visual cue.

### LoadingState Skeleton Pattern

The Skeleton variant determines layout structure:

- **card**: 1 wide skeleton row + 3 narrower rows, mimicking a card layout
- **table-row**: single skeleton row with 5-6 cells, mimicking a table row
- **detail**: large skeleton rectangle (chart area) + 4 skeleton parameter rows
- **chart**: rectangular skeleton with aspect ratio ~16:9 (chart container shape)

Use shadcn `<Skeleton className="..." />` component:

```tsx
import { Skeleton } from '@/components/ui/skeleton'

function LoadingState({ variant = 'card', rows = 4 }: LoadingStateProps) {
  if (variant === 'table-row') {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }
  // ... other variants
}
```

### ErrorState aria-live Region

```tsx
function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center gap-3 p-6 text-center"
    >
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
```

The `role="alert"` and `aria-live="assertive"` ensure screen readers announce the error immediately.

### ScoreGauge Color Logic

```tsx
function getScoreTier(score: number): { tier: ScoreTier; color: string; label: string } {
  if (score >= 70) return { tier: 'strong', color: 'var(--score-green)', label: 'Strong' }
  if (score >= 50) return { tier: 'average', color: 'var(--score-amber)', label: 'Average' }
  return { tier: 'weak', color: 'var(--score-red)', label: 'Weak' }
}
```

The gauge displays the score prominently (large bold number) with the color applied to the text, plus the tier label next to it. Optionally, a horizontal bar can show proportional fill (0% to 100%).

### TermInfo Popover Integration

TermInfo uses the shadcn Popover component:

```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'

function TermInfo({ term, side = 'top' }: TermInfoProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="sr-only">Learn about {term.name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-80">
        <div className="space-y-2">
          <div>
            <h4 className="font-semibold text-sm">{term.name}</h4>
            <span className="text-xs text-muted-foreground">{term.category}</span>
          </div>
          <p className="text-sm">{term.definition}</p>
          {term.example && (
            <div>
              <span className="text-xs font-medium">Example:</span>
              <p className="text-sm text-muted-foreground">{term.example}</p>
            </div>
          )}
          <div>
            <span className="text-xs font-medium">Why it matters:</span>
            <p className="text-sm text-muted-foreground">{term.whyItMatters}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

The Popover from shadcn/ui handles:
- Click trigger to open/close
- Click outside to dismiss
- Escape key to dismiss
- Focus trap while open

The `side` prop controls which side the popover appears relative to the trigger icon (defaults to `top`).

### TermInfo Seed Data

TermInfo data should be seeded from glossary terms. Create a minimal seed set containing at minimum all 17 scorecard parameters:

```
P/E Ratio, P/B Ratio, PEG Ratio, Dividend Yield, ROE, ROCE,
Operating Margin, Net Profit Margin, Debt-to-Equity, Free Cash Flow,
Book Value, Revenue Growth, EPS Growth, Promoter Holding,
Pledged Shares, Governance Quality, Market Cap
```

A `glossary-terms.ts` file in `src/data/` or `src/lib/` can hold the seed data. The actual full glossary (37+ terms) is loaded on the Glossary page (Story 11.1).

### Testing Standards

- Co-located tests: `freshness-badge.test.tsx` next to `freshness-badge.tsx`
- Vitest as test runner, jsdom as DOM environment
- @testing-library/react for component tests
- Each component test covers: all visual states (FreshnessBadge: 4 levels), edge cases (score=0, score=100, score=undefined/null), accessibility (aria attributes, screen reader text)
- Use `describe`/`it`/`expect` from Vitest

### Dependencies

This story depends on:
- Story 1.1: shadcn/ui initialized with Skeleton, Button, Popover components
- Story 1.2: Tailwind CSS 4 with design tokens (score colors, freshness dots)

Required shadcn components (install via `npx shadcn@latest add skeleton popover`):
- `Skeleton` — for LoadingState
- `Popover` + `PopoverTrigger` + `PopoverContent` — for TermInfo
- `Button` — for ErrorState Retry

### References

- [Source: epics-and-stories.md#L344-L364] — Story 1.9 acceptance criteria
- [Source: EXPERIENCE.md#L69-L72] — FreshnessBadge behavioral rules
- [Source: EXPERIENCE.md#L72] — Score contribution bar and tier colors
- [Source: EXPERIENCE.md#L124-L131] — Accessibility floor requirements
- [Source: EXPERIENCE.md#L76-L99] — State patterns (Loading, Error, Empty)
- [Source: EXPERIENCE.md#L103-L104] — Score tier definitions (parameter + composite)
- [Source: DESIGN.md#L118-L130] — Design tokens for scores and freshness dots

## Dev Agent Record

### Agent Model Used

BMad Create-Story workflow (v6.8.1-next.4)

### Debug Log References

### Completion Notes List

### File List
