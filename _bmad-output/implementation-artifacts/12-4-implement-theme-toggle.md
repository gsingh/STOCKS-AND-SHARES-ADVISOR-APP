## Story
**As a** retail investor,
**I want** to switch between light and dark themes from the settings page or top bar,
**So that** I can use the app comfortably in different lighting conditions according to my preference.

## Acceptance Criteria
1. **Toggle in Settings**: A theme toggle (light/dark switch) is present in the Settings page under an "Appearance" section, implemented as a shadcn Switch component with sun/moon icons.
2. **Toggle in Topbar**: A compact theme toggle icon button is available in the top navigation bar for quick access without navigating to Settings.
3. **Persistence**: The selected theme is persisted in the Dexie `userPreference` table under a `theme` field (`'light' | 'dark'`).
4. **Dark Mode Implementation**: Dark mode is activated by adding the `.dark` CSS class to the `<html>` element, consistent with the existing Tailwind CSS dark mode configuration and the same pattern used in the MF app.
5. **Initial Theme Detection**: On first launch (no `theme` preference in Dexie), detect the user's system preference using `window.matchMedia('(prefers-color-scheme: dark)')` and apply that theme.
6. **Immediate Application**: Toggling the theme immediately applies the change (adds/removes `.dark` class on `<html>`) without page reload.
7. **Synchronized Toggles**: Both Settings toggle and Topbar toggle are synchronized — changing one updates the other.
8. **Icon Transition**: The toggle icon smoothly transitions between sun and moon with a CSS transition or rotation animation.
9. **Accessibility**: The toggle has appropriate `aria-label` ("Switch to dark mode" / "Switch to light mode") and is keyboard-operable.

## Tasks / Subtasks
- [ ] Add `theme` field to Dexie `userPreference` schema
- [ ] Create `src/features/theme/theme-store.ts` (Zustand store for theme state)
- [ ] Implement theme initialization (Dexie check → system preference fallback → apply)
- [ ] Build settings theme toggle with Switch component
- [ ] Build topbar theme toggle icon button
- [ ] Implement `.dark` class toggling on `<html>` element
- [ ] Implement persistence on toggle change
- [ ] Add CSS transition for sun/moon icon swap
- [ ] Add aria-labels and keyboard support
- [ ] Ensure consistency with MF app theme implementation

## Dev Notes
- Same pattern as MF app: Tailwind CSS dark mode uses the `class` strategy, so toggling `.dark` on `<html>` is sufficient.
- Theme store: `useThemeStore` with `{ theme: 'light' | 'dark', setTheme, toggleTheme, initTheme }`.
- On app mount: `initTheme()` reads Dexie → if not set, defaults to `prefers-color-scheme` → saves to Dexie.
- The sun icon (light mode) and moon icon (dark mode) can be Lucide icons (`<Sun />`, `<Moon />`).
- Ensure all existing dark mode CSS variables are applied correctly when `.dark` class is present.

## Dev Agent Record
- **Component:** `theme-toggle.tsx` (Settings), `theme-toggle-topbar.tsx` (Topbar)
- **Data Flow:** Toggle → Zustand state → `.dark` class on html → Dexie persist
- **Dexie Table:** `userPreference` (theme field)
- **Related Stores:** `useThemeStore` (theme, setTheme, toggleTheme, initTheme)
