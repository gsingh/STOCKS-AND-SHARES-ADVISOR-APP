# Story 1.2: Configure Tailwind CSS 4 with brand design tokens

Status: ready-for-dev

## Story

As a developer,
I want Tailwind CSS 4 configured with the brand design tokens (Navy #1B3A5C primary, Forest Green #1E7A45 accent, Inter + JetBrains Mono, shadcn dark mode),
So that all components render with consistent visual identity.

## Acceptance Criteria

1. `globals.css` defines CSS custom properties for all brand tokens under `:root` (light) and `.dark` (dark)
2. `globals.css` defines score tokens: `--score-green`, `--score-amber`, `--score-orange`, `--score-red`
3. `globals.css` defines chart palette tokens: `--chart-color-1` through `--chart-color-4`
4. `globals.css` defines freshness dot tokens: `--freshness-dot-green/yellow/red/gray`
5. `globals.css` defines sidebar tokens: `--sidebar-bg`, `--sidebar-fg`, `--sidebar-active`
6. Inter and JetBrains Mono loaded via `@font-face` or CSS `@import` in `globals.css`
7. `html.dark` class triggers dark mode token overrides
8. shadcn/ui Button renders with brand primary colour (`#1B3A5C` light, `#5A8FC5` dark)
9. Tailwind CSS 4 `@theme` directive maps CSS custom properties to Tailwind utility classes
10. `npm run dev` shows the brand primary colour on any shadcn Button component

## Tasks / Subtasks

- [ ] Define brand colour tokens in `globals.css` under `:root` and `.dark` (AC: #1)
- [ ] Define score tier tokens (AC: #2)
- [ ] Define chart palette tokens (AC: #3)
- [ ] Define freshness dot tokens (AC: #4)
- [ ] Define sidebar tokens (AC: #5)
- [ ] Load Inter + JetBrains Mono fonts (AC: #6)
- [ ] Configure shadcn CSS variables to reference brand tokens (AC: #8)
- [ ] Wire tokens via `@theme` in CSS for Tailwind utility use (AC: #9)
- [ ] Verify Button renders with brand primary colour (AC: #10)

## Dev Notes

### Exact CSS Custom Property Values

**`globals.css` — `:root` (light mode):**

```css
:root {
  /* Brand */
  --primary: #1B3A5C;
  --primary-foreground: #FFFFFF;
  --accent: #1E7A45;
  --accent-foreground: #FFFFFF;
  --warning: #F59E0B;
  --warning-foreground: #1A1208;
  --destructive: #DC2626;

  /* Sidebar */
  --sidebar-bg: #1B3A5C;
  --sidebar-fg: #FFFFFF;
  --sidebar-active: #1E7A45;

  /* Score tiers */
  --score-green: #15803D;
  --score-amber: #B45309;
  --score-orange: #C2410C;
  --score-red: #B91C1C;
  --score-green-bg: #F0FDF4;
  --score-amber-bg: #FFFBEB;
  --score-orange-bg: #FFF7ED;
  --score-red-bg: #FEF2F2;

  /* Chart palette */
  --chart-color-1: #2E8B57;
  --chart-color-2: #2563EB;
  --chart-color-3: #D97706;
  --chart-color-4: #DC2626;

  /* Freshness dots */
  --freshness-dot-green: #22C55E;
  --freshness-dot-yellow: #EAB308;
  --freshness-dot-red: #EF4444;
  --freshness-dot-gray: #9CA3AF;
}
```

**`globals.css` — `.dark` overrides:**

```css
.dark {
  --primary: #5A8FC5;
  --primary-foreground: #0A1A2A;
  --accent: #5DAE7D;
  --accent-foreground: #0A1A2A;
  --sidebar-bg: #0F1F30;
  --sidebar-fg: #FFFFFF;
  /* Score, chart, and freshness tokens stay the same in dark mode */
}
```

[Source: DESIGN.md#L118-L130]

### shadcn/ui CSS Variable Mapping

shadcn/ui reads its own CSS variables (`--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`).

Override the shadcn defaults for brand-specific tokens only:

```css
/* In :root */
:root {
  --primary: #1B3A5C;
  --primary-foreground: #FFFFFF;
  --accent: #1E7A45;
  --accent-foreground: #FFFFFF;
  --destructive: #DC2626;
  --warning: #F59E0B;
  --warning-foreground: #1A1208;
  --radius: 0.375rem; /* shadcn default, keep as-is */
}

.dark {
  --primary: #5A8FC5;
  --primary-foreground: #0A1A2A;
  --accent: #5DAE7D;
  --accent-foreground: #0A1A2A;
}
```

All other shadcn tokens (`--background`, `--foreground`, `--card`, `--border`, `--input`, `--ring`, `--muted`, etc.) inherit shadcn's default values. Only brand-layer tokens are overridden. [Source: DESIGN.md#L130-L132]

### Tailwind CSS 4 `@theme` Directive

Tailwind CSS 4 uses `@theme` to register custom tokens as Tailwind utility classes:

```css
@import "tailwindcss";

@theme {
  --color-primary: #1B3A5C;
  --color-primary-foreground: #FFFFFF;
  --color-accent: #1E7A45;
  --color-accent-foreground: #FFFFFF;
  --color-sidebar-bg: #1B3A5C;
  --color-sidebar-fg: #FFFFFF;
  --color-sidebar-active: #1E7A45;
  --color-score-green: #15803D;
  --color-score-amber: #B45309;
  --color-score-orange: #C2410C;
  --color-score-red: #B91C1C;
  --color-chart-1: #2E8B57;
  --color-chart-2: #2563EB;
  --color-chart-3: #D97706;
  --color-chart-4: #DC2626;
  --color-freshness-green: #22C55E;
  --color-freshness-yellow: #EAB308;
  --color-freshness-red: #EF4444;
  --color-freshness-gray: #9CA3AF;

  --font-family-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

This enables usage like: `bg-primary`, `text-score-green`, `bg-chart-1`, `font-mono` (with tabular-nums).

### Font Loading Strategy

Use CSS `@import` in `globals.css` to load Inter and JetBrains Mono from Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

Alternatively, download fonts and serve locally via `@font-face` in `globals.css`. The CSS import approach is simpler for v1.

**Key font rules:**
- All body text, labels, UI: Inter (400, 500, 600, 700 weights)
- All financial figures, scores, prices, percentages: JetBrains Mono with `font-mono tabular-nums` classes
- Display headings (page titles): 28px semibold (Inter 600, `text-[28px]`)
- Card/section headings: 20px semibold (Inter 600, `text-xl font-semibold`)
- Body: 14px (Inter 400, `text-sm`)
- Labels: 13px medium (Inter 500, `text-[13px] font-medium tracking-[0.01em]`)
- Small/captions: 12px (Inter 400, `text-xs`)
- en-IN locale used for all formatted numeric/currency values

[Source: DESIGN.md#L134-L140]

### App Shell Integration

The `globals.css` is imported in `main.tsx` and applies globally. The `html.dark` class is toggled via the theme toggle (stored in Zustand `useUIStore`, story 1.10). For now, ensure the `globals.css` structure supports the `.dark` class toggling pattern.

The `@tailwindcss/vite` plugin must be registered in `vite.config.ts`:

```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  // ...
})
```

### Acceptance Criteria Verification

| AC | Verification |
|----|-------------|
| #1 | Inspect `globals.css` — all tokens under `:root` and `.dark` |
| #2-5 | Inspect token presence with correct hex values |
| #6 | Fonts load in browser DevTools → Network → Fonts |
| #7 | Toggle `.dark` on `<html>` in DevTools → tokens switch |
| #8 | Render `<Button>Test</Button>` → computed bg is `#1B3A5C` |
| #9 | `bg-primary` utility class resolves to `#1B3A5C` |
| #10 | `npm run dev` starts, page renders with brand-coloured button |

### Previous Story Context

Story 1.1 scaffolded the Vite project with all dependencies installed including `tailwindcss@4`, `@tailwindcss/vite`, and shadcn/ui initialized. This story builds directly on that foundation — Tailwind CSS 4 is already available, the `@tailwindcss/vite` plugin is registered, and the `src/globals.css` file replaces the default `src/App.css`/`src/index.css` from the scaffold. [Source: epics-and-stories.md#L212-L231]

### References

- [Source: epics-and-stories.md#L212-L231] — Story 1.2 acceptance criteria
- [Source: DESIGN.md#L112-L181] — Complete visual design tokens
- [Source: architecture.md#L84-L87] — Tailwind CSS 4 + shadcn/ui decision
- [Source: EXPERIENCE.md#L17] — Dark mode via `.dark` class pattern

## Dev Agent Record

### Agent Model Used

BMad Create-Story workflow (v6.8.1-next.4)

### Debug Log References

### Completion Notes List

### File List
