# Story 1.1: Scaffold Vite project and install dependencies

Status: ready-for-dev

## Story

As a developer,
I want the project scaffolded with Vite + React 19 + TypeScript and all runtime/dev dependencies installed,
So that the codebase has a working build pipeline and all required libraries available.

## Acceptance Criteria

1. `npm create vite@latest . -- --template react-ts` produces a working project scaffold
2. `npm install` completes without errors with all required dependencies in package.json
3. `npm run dev` starts Vite dev server (HMR enabled) without errors
4. `npm run build` produces a production build without errors
5. `npm run test` runs Vitest and passes (placeholder test from scaffold)
6. shadcn/ui is initialized via `npx shadcn@latest init`
7. Tailwind CSS 4 is configured with `@tailwindcss/vite` plugin
8. TypeScript strict mode is enabled in `tsconfig.json`
9. ESLint flat config is set up and passes `npm run lint`
10. Prettier config exists and formats code consistently

## Tasks / Subtasks

- [ ] Scaffold Vite project (AC: #1)
- [ ] Install core runtime dependencies (AC: #2)
  - [ ] react@19, react-dom@19
  - [ ] @tanstack/react-router
  - [ ] dexie
  - [ ] zustand@5.0.14
  - [ ] recharts
  - [ ] nse-bse-api
- [ ] Install dev dependencies (AC: #2)
  - [ ] tailwindcss@4, @tailwindcss/vite
  - [ ] vitest, @testing-library/react, @testing-library/jest-dom, jsdom
  - [ ] eslint (flat config), prettier
- [ ] Initialize shadcn/ui (AC: #6)
- [ ] Configure Tailwind CSS 4 (AC: #7)
- [ ] Configure TypeScript strict mode (AC: #8)
- [ ] Verify build pipeline (AC: #3, #4, #5)
- [ ] Set up ESLint + Prettier (AC: #9, #10)

## Dev Notes

### Architecture Patterns & Constraints

- **Zero-backend mandate:** All computation client-side. No server, no auth, no API keys. [Source: architecture.md#L44-L46]
- **DataEnvelope pattern:** Every data service return MUST be wrapped in `DataEnvelope<T>` with `data`, `fetchedAt`, `source`, `error` fields. [Source: architecture.md#L196-L204]
- **feature-based directory structure:** `src/features/` for pure domain logic (zero React imports), `src/components/features/` for React components, `src/services/` for data access. [Source: architecture.md#L188-L192]
- **Naming conventions:** kebab-case files, PascalCase components, camelCase functions/vars, camelCase Dexie fields. [Source: architecture.md#L170-L184]
- **Co-located tests:** `scoring-engine.test.ts` next to `scoring-engine.ts`. Never use `__tests__/` directories. [Source: architecture.md#L184]
- **ISO 8601 dates** stored as strings in Dexie. [Source: architecture.md#L207-L209]
- **en-IN locale** formatting for all displayed numeric/currency values. [Source: DESIGN.md#L140]
- **dark mode** via `.dark` class + CSS custom properties (not a separate stylesheet). [Source: DESIGN.md#L128]
- **Inter + JetBrains Mono** loaded as custom fonts. `tabular-nums` on all financial figures. [Source: DESIGN.md#L136-L139]
- **No React in `features/`** — pure domain logic only. React components in `components/features/`. [Source: architecture.md#L239-L241]
- **Dexie versioned migrations** via `db.version(N).stores()`. [Source: architecture.md#L121-L122]

### Source Tree Structure

After scaffold, create/adjust the following structure:

```
stocks-and-shares-advisor/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── .prettierrc
├── .env.example
├── nginx/
│   └── default.conf          # placeholder for story 1.11
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── app.tsx
    ├── globals.css
    ├── routes/                # route defs (story 1.14)
    ├── components/
    │   ├── ui/                # shadcn/ui primitives
    │   └── shared/            # app-specific shared components
    ├── features/              # pure domain logic (NO React)
    ├── services/              # data access layer
    │   └── db.ts              # Dexie instance + schemas
    ├── stores/                # Zustand stores
    ├── lib/                   # pure utilities
    ├── types/                 # shared TypeScript types
    └── hooks/                 # custom React hooks
```

### Library Versions & Choices

| Package | Version | Purpose |
|---------|---------|---------|
| react + react-dom | ^19 | UI framework |
| @tanstack/react-router | latest | Client-side routing with lazy loading |
| dexie | latest | IndexedDB wrapper with versioned migrations |
| zustand | 5.0.14 | Lightweight state management (~1.2KB gzipped) |
| recharts | latest | Charting (bar, line, radar, pie/donut) |
| nse-bse-api | latest | NSE/BSE stock quotes (npm package) |
| tailwindcss | ^4 | Utility CSS framework |
| @tailwindcss/vite | ^4 | Tailwind CSS 4 Vite plugin |
| shadcn/ui | latest (init) | Component primitives (Button, Card, Dialog, etc.) |
| vitest | latest | Unit testing (Vite-native) |
| @testing-library/react | latest | React component testing |
| @testing-library/jest-dom | latest | DOM matchers for Vitest |
| jsdom | latest | DOM environment for tests |
| eslint | latest (flat config) | Code linting |
| prettier | latest | Code formatting |

### Specific shadcn/ui Components Required

Initialize with `npx shadcn@latest init` (choose TypeScript, CSS variables, default style). The following shadcn components will be used across the app — install them all during scaffold:

- button, card, dialog, sheet, popover, tooltip, dropdown-menu
- select, input, label, tabs, table, badge, skeleton, progress, separator
- avatar, switch, slider, textarea, command

These are used as-is (no customization). Only brand-layer deltas (primary color, accent, sidebar styling) are customized via CSS variables. [Source: DESIGN.md#L156-L170]

### Testing Standards

- Co-located tests: `my-module.test.ts` next to `my-module.ts`
- Vitest as test runner, jsdom as DOM environment
- @testing-library/react for component tests
- Placeholder/smoke test passes from scaffold (`App.test.tsx` renders without crashing)

### Brand Design Tokens (CSS Custom Properties)

Configure in `globals.css` under `:root` and `.dark`:

| Token | Light | Dark |
|-------|-------|------|
| `--primary` | `#1B3A5C` | `#5A8FC5` |
| `--primary-foreground` | `#FFFFFF` | `#0A1A2A` |
| `--accent` | `#1E7A45` | `#5DAE7D` |
| `--accent-foreground` | `#FFFFFF` | `#0A1A2A` |
| `--sidebar-bg` | `#1B3A5C` | `#0F1F30` |
| `--sidebar-fg` | `#FFFFFF` | `#FFFFFF` |
| `--sidebar-active` | `#1E7A45` | `#1E7A45` |

Score tokens: `--score-green` (`#15803D`), `--score-amber` (`#B45309`), `--score-orange` (`#C2410C`), `--score-red` (`#B91C1C`).

Chart palette tokens: `--chart-color-1` (`#2E8B57`), `--chart-color-2` (`#2563EB`), `--chart-color-3` (`#D97706`), `--chart-color-4` (`#DC2626`).

Freshness dots: `--freshness-dot-green` (`#22C55E`), `--freshness-dot-yellow` (`#EAB308`), `--freshness-dot-red` (`#EF4444`), `--freshness-dot-gray` (`#9CA3AF`).

[Source: DESIGN.md#L118-L130]

### Vite Proxy Configuration

Configure `vite.config.ts` with `server.proxy` for development:

```typescript
server: {
  proxy: {
    '/api/nse-bse': {
      target: 'https://nse-bse-api.example.com', // actual URL TBD
      changeOrigin: true,
    },
    '/api/screener': {
      target: 'https://screener.in',
      changeOrigin: true,
    },
  },
}
```

[Source: architecture.md#L142-L144]

### First Implementation Commands

```bash
npm create vite@latest . -- --template react-ts
npm install react@19 react-dom@19 @tanstack/react-router dexie zustand@5.0.14 recharts nse-bse-api
npm install -D tailwindcss@4 @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom eslint prettier
npx shadcn@latest init
npx shadcn@latest add button card dialog sheet popover tooltip dropdown-menu select input label tabs table badge skeleton progress separator avatar switch slider textarea command
```

### Project Structure Notes

- The scaffold will create default files (`src/App.tsx`, `src/App.css`, `src/index.css`, `src/main.tsx`, `vite-env.d.ts`). Some will be replaced in later stories (e.g., `globals.css` replaces `App.css`/`index.css`, `app.tsx` replaces `App.tsx`).
- Do NOT create nginx config content yet — placeholder file only (filled in story 1.11).
- Do NOT create route files yet — placeholder `src/routes/` directory only (filled in story 1.14).
- All shadcn components go in `src/components/ui/` as generated by `shadcn add`.
- ESLint config must use flat config format (`eslint.config.js`).
- Ensure TypeScript `strict: true` in `tsconfig.app.json`.

### References

- [Source: epics-and-stories.md#L186-L210] — Story 1.1 acceptance criteria
- [Source: architecture.md#L60-L99] — Starter template evaluation and tech stack
- [Source: architecture.md#L119-L128] — Data architecture decisions
- [Source: architecture.md#L164-L241] — Implementation patterns and consistency rules
- [Source: architecture.md#L243-L371] — Complete project structure
- [Source: DESIGN.md#L112-L181] — Visual design tokens and brand layer
- [Source: EXPERIENCE.md#L15-L19] — Foundation technology stack

## Dev Agent Record

### Agent Model Used

BMad Create-Story workflow (v6.8.1-next.4)

### Debug Log References

### Completion Notes List

### File List
