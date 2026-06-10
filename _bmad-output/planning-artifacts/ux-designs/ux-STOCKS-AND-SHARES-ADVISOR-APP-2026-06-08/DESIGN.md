---
name: STOCKS-AND-SHARES-ADVISOR-APP
description: Stocks & Shares Advisor App — stock research, scoring, comparison, and portfolio management. shadcn/ui on Vite + React 19 + Tailwind CSS 4. Mirrors reference Mutual Fund Advisor App visual identity.
status: final
created: 2026-06-08
updated: 2026-06-08
colors:
  primary: '#1B3A5C'
  primary-foreground: '#FFFFFF'
  accent: '#1E7A45'
  accent-foreground: '#FFFFFF'
  muted: '#F5F7FA'
  muted-foreground: '#6B7280'
  destructive: '#DC2626'
  warning: '#F59E0B'
  warning-foreground: '#1A1208'
  positive: '#1E7A45'
  sidebar-bg: '#1B3A5C'
  sidebar-fg: '#FFFFFF'
  sidebar-active: '#1E7A45'
  primary-dark: '#5A8FC5'
  primary-foreground-dark: '#0A1A2A'
  accent-dark: '#5DAE7D'
  accent-foreground-dark: '#0A1A2A'
  sidebar-bg-dark: '#0F1F30'
  background-dark: '#0F1F30'
  card-dark: '#1a2a3a'
typography:
  sans:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
  display:
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.25'
  display-sm:
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: '0.01em'
  small:
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  button-success:
    background: '{colors.accent}'
    foreground: '{colors.accent-foreground}'
    radius: '{rounded.md}'
  badge-success:
    background: '{colors.accent}'
    foreground: '{colors.accent-foreground}'
  badge-warning:
    background: '{colors.warning}'
    foreground: '{colors.warning-foreground}'
  sidebar-item-active:
    background: '{colors.sidebar-active}'
    foreground: '{colors.sidebar-fg}'
  score-green:
    foreground: '#15803D'
    background: '#F0FDF4'
  score-amber:
    foreground: '#B45309'
    background: '#FFFBEB'
  score-red:
    foreground: '#B91C1C'
    background: '#FEF2F2'
  chart-color-1:
    fill: '#2E8B57'
  chart-color-2:
    fill: '#2563EB'
  chart-color-3:
    fill: '#D97706'
  chart-color-4:
    fill: '#DC2626'
  freshness-dot-green:
    fill: '#22C55E'
    radius: '{rounded.full}'
  freshness-dot-yellow:
    fill: '#EAB308'
    radius: '{rounded.full}'
  freshness-dot-red:
    fill: '#EF4444'
    radius: '{rounded.full}'
  freshness-dot-gray:
    fill: '#9CA3AF'
    radius: '{rounded/full}'
  score-orange:
    foreground: '#C2410C'
    background: '#FFF7ED'
---

## Brand & Style

The Stocks & Shares Advisor App is a research and monitoring tool for individual stock investors in Indian markets (NSE/BSE). It mirrors the visual identity of the reference Mutual Fund Advisor App: clean, information-dense, professional. The brand expression follows: a navy primary that reads as trustworthy and institutional, a forest green accent for positive/active states, and visual restraint everywhere else.

The app inherits shadcn/ui defaults wholesale. This DESIGN.md specifies only the brand-layer deltas — primary navy color, forest green accent, Inter + JetBrains Mono typography, sidebar styling, score color conventions, and chart color palette. The 80%+ of components that ship from shadcn (Button, Card, Dialog, Sheet, Table, Tabs, Input, Select, Popover, Tooltip, Badge) inherit shadcn's visual specs as-is.

## Colors

The palette is three colors of brand-layer plus shadcn defaults for everything else.

- **Primary Navy (`#1B3A5C` light / `#4A7FB5` dark)** is the brand color. Used on primary buttons, sidebar background, active nav items, link underlines. Replaces shadcn's default `primary`.
- **Forest Green (`#1E7A45` light / `#5DAE7D` dark)** is the accent and positive indicator. Used for success states, positive returns, "Strong" score thresholds, active hover states in sidebar. Never used decoratively — green always means "good / positive / active."
- **Amber (`#F59E0B`)** is the warning color. Used for stale data indicators (yellow FreshnessBadge), "Average" score thresholds, drift warnings.
- **Red (`#DC2626`)** is destructive. Used for negative returns, "Weak" score thresholds, critical alerts, error states.
- **Score color conventions:** Parameter scores >=15 use green, >=10 use amber, >=5 use orange, <5 use red. Composite score thresholds: >=70 green, >=50 amber, <50 red.
- **Sidebar:** Solid navy fill (`#1B3A5C`), white text, green active item indicator. Dark mode uses darker navy (`#0F1F30`) for sidebar and background, lighter navy for cards.
- **Dark mode:** Background `#0F1F30`, cards `#1a2a3a`, sidebar same as background, primary lighter (`#5A8FC5`), accent lighter (`#5DAE7D`). All other tokens invert via shadcn's `.dark` class.

All unlisted tokens (`background`, `foreground`, `muted`, `muted-foreground`, `border`, `input`, `ring`, `card`, `popover`) inherit from shadcn defaults. If the brand can't justify overriding a token, it doesn't override it.

Avoid: chromatic flourishes, gradient surfaces, custom destructive colors, more than three brand colors. The discipline is navy + green + amber/red-as-needed.

## Typography

- **Sans (body, UI, labels):** Inter — loaded as custom font. Body at 14px, labels at 13px, small at 12px.
- **Mono (numbers, financial data):** JetBrains Mono — loaded as custom font. All financial figures, scores, prices, percentages use `tabular-nums` class for aligned numbers.
- **Display (page headings):** 28px semibold, used sparingly (page titles).
- **Display-sm (card titles, section headings):** 20px semibold.
- **Locale formatting:** All numeric values formatted with `en-IN` locale (Indian number system: ₹1,00,000).

## Layout & Spacing

Tailwind 4 spacing scale inherited as-is (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Content area: `p-6` (24px padding). Sidebar: 260px expanded, 64px collapsed.

Desktop-primary. Sidebar + topbar + content App Shell pattern. Sidebar fixed left, content scrollable right. Topbar fixed above content with page title and hamburger (mobile).

## Elevation & Depth

Inherited from shadcn — subtle shadow on hover/active states, no elevation as a visual hierarchy device. The app adds nothing on top of this.

## Shapes

`rounded/sm` (4px) for inputs, `rounded/md` (6px) for cards, buttons, dialogs. `rounded/lg` (8px) for large containers. Pill shapes (`rounded/full`) on badges and score indicators.

## Components

The app uses the following shadcn components as-is, unchanged: Button, Card, Dialog, Sheet, Popover, Tooltip, DropdownMenu, Select, Input, Label, Tabs, Table, Badge, Skeleton, Progress, Separator. The contract: don't customize these.

Brand-layer-overridden components:

- **Button (primary variant)** — `{colors.primary}` fill, `{colors.primary-foreground}` text, `{rounded.md}`.
- **Button (success variant)** — `{colors.accent}` fill, `{colors.accent-foreground}` text, `{rounded.md}`. Used for positive actions.
- **Badge (success)** — `{colors.accent}` fill. Used for score badges >=70, positive returns.
- **Badge (warning)** — `{colors.warning}` fill. Used for stale data, average scores.
- **Sidebar item (active)** — `{colors.sidebar-active}` background on active item. Green indicator.
- **Score contribution bar** — Dynamic width bar colored by score tier (green/amber/red/orange). Accompanies each parameter in scorecard.
- **Chart palette** — 4-color sequence: `['#2E8B57', '#2563EB', '#D97706', '#DC2626']` for stock comparison. Donut chart uses 10-color extended palette.
- **FreshnessBadge** — 4px dot: {freshness-dot-green} (current), {freshness-dot-yellow} (stale), {freshness-dot-red} (expired), {freshness-dot-gray} (missing).

## Do's and Don'ts

| Do | Don't |
|---|---|
| Inherit shadcn defaults for everything not in the brand layer | Override shadcn's color tokens beyond primary, accent, warning |
| Use green only for positive/active states | Use green decoratively — green always means something |
| Inter for UI, JetBrains Mono for numbers | Mix font families in data displays |
| `tabular-nums` on all financial figures | Let numbers render with proportional spacing |
| en-IN locale for all formatted values | Use en-US comma formatting (India uses lakh/crore) |
| Dark mode via `.dark` class + CSS vars | Build a separate dark stylesheet |
| Color + text label for score states (green = "Strong") | Rely on color alone for score communication |
