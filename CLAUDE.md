# CLAUDE.md

## Project

Quota Tracker is a static React + TypeScript + Tailwind SPA for tracking third-party AI API account quota windows.

The app has no backend. All user data is stored in the browser with `localStorage`.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

Use `npm run build` before committing meaningful changes.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS v4 via `@tailwindcss/vite`
- GitHub Pages deployment (artifact-based, not branch-based)

## File Structure

```
src/
  main.tsx              # React entry point
  App.tsx               # Root component, layout, header, search, import/export
  index.css             # Tailwind import, base styles, mesh gradient, number spinner reset
  types.ts              # Instance, InstanceStatus, QuotaFlag types
  utils.ts              # Status logic, sorting, filtering, time formatting, durations
  hooks/
    useInstances.ts     # CRUD, localStorage persistence, export/import, duplicate, auto-renew
  components/
    InstanceCard.tsx     # Individual instance display with status dropdown and actions
    InstanceEditorModal.tsx  # Add/edit form with cooldown duration fields
    ConfirmDialog.tsx    # Delete confirmation dialog
    CustomDropdown.tsx   # Reusable custom dropdown with colored options
```

## Important Files

- `vite.config.js`: Vite config. Uses `base: "/quota-tracker/"` for GitHub Pages project hosting.
- `.github/workflows/deploy.yml`: Builds and deploys via `actions/deploy-pages` (artifact-based).

## Data Model

`Instance` records are stored in `localStorage` under:

```text
quota-tracker.instances
```

Fields:

- `id`
- `name`
- `website`
- `accountLabel`
- `configBlock`
- `hourlyAllowance` — display label for the hourly quota (e.g. "100 RPM")
- `weeklyAllowance` — display label for the weekly quota (e.g. "10K requests")
- `hourlyCooldownMs` — duration in ms of the hourly cooldown cycle (the "x-hourly" reset window)
- `weeklyCooldownMs` — duration in ms of the weekly cooldown cycle
- `hourlyResetTimestamp` — epoch ms for hourly window reset (auto-restarts from cooldown)
- `weeklyResetTimestamp` — epoch ms for weekly window reset (auto-restarts from cooldown)
- `exhausted` — true when hourly quota is spent and cooldown is active
- `weeklyExhausted` — true when weekly quota is spent and cooldown is active

The editor form exposes two controls per cycle:
- **Window** — the recurring cycle duration (e.g. "5 hours"). Stored in `hourlyCooldownMs`/`weeklyCooldownMs`.
- **Next reset in** — time until the first reset (e.g. "2h 25m"). Stored in `hourlyResetTimestamp`/`weeklyResetTimestamp` as `now + offset`. After the first reset, the timer auto-restarts from the Window duration.

A `quota-tracker.demo-seen` key prevents the demo instance from re-seeding after deletion.

## Behavior Notes

- Countdown values are calculated from absolute epoch timestamps.
- The app re-renders every 60 seconds so countdown text updates.
- **Auto-restart cooldowns**: when a timer expires, it automatically restarts from the cooldown duration. The app never stays in "Ready" — it cycles indefinitely.
- **Status dropdown**: each card has a custom dropdown with three states — Available (emerald), Exhausted (amber), Weekly Exhausted (red/rose). Selecting Exhausted/Weekly Exhausted sets the flag and starts the corresponding cooldown timer.
- When a cooldown expires, `exhausted`/`weeklyExhausted` flags are cleared automatically by `normalizeInstance`.
- Sorting order: READY instances first, then Available > Exhausted > Weekly Exhausted, then by nearest reset.
- The `Use` button copies `configBlock` to the clipboard.
- Search filters by name, website, account label, or allowance labels.
- Export copies JSON to clipboard or downloads as `.json` file.
- Import accepts pasted JSON or file upload.
- Duplicate creates a copy with "(copy)" appended to the name.
- **Demo instance**: first-time visitors (no localStorage data) get a pre-seeded "OpenAI GPT-4o" instance in READY state so the app feels alive immediately.
- Delete requires confirmation via a dialog.

## Mobile Support

- Viewport meta tag with `viewport-fit=cover` for notch devices.
- PWA meta tags: `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.
- Touch CSS: `touch-action: manipulation` (prevents double-tap zoom), `-webkit-tap-highlight-color: transparent`, `overscroll-behavior: none`.
- Tailwind responsive breakpoints: `grid-cols-1 lg:grid-cols-2` for card grid, `grid-cols-2 sm:grid-cols-4` for action buttons, `grid-cols-1 md:grid-cols-2` for form fields.
- All buttons have `min-h-10` (40px) touch targets.
- No `backdrop-blur` — deliberate performance choice for mobile.

## Deployment

The intended public URL is:

```text
https://spideyonmoon.github.io/quota-tracker/
```

This repo deploys as a GitHub Pages project page, not the root user page. The root page is a separate Chirpy blog at:

```text
https://spideyonmoon.github.io/
```

The deployment workflow uses `actions/upload-pages-artifact` + `actions/deploy-pages` (artifact-based, not branch-based). This is faster than the old `peaceiris/actions-gh-pages` approach.

GitHub Pages settings should be:

- Source: GitHub Actions

## Performance Notes

- No `backdrop-blur` on any element (GPU-heavy, slow on mobile).
- No CSS keyframe animations — only `transition-all duration-150` on hover states.
- No gradient overlay divs on cards — keeps DOM minimal.
- CSS is ~36KB (6KB gzipped). JS is ~224KB (68KB gzipped).

## Design Language

- Dark theme: `#030712` base, `slate-900/80` cards, `white/[0.02]` surfaces.
- Cards use `border-l-[3px]` colored accent (emerald/amber/slate based on status).
- Hover effect uses `ring-1 ring-transparent hover:ring-white/[0.08]` (no border toggle — avoids layout shift).
- Gradient accents: CTA buttons use `from-cyan-500 to-blue-500`.
- Status dropdown: custom component (`CustomDropdown.tsx`) with colored dot indicator, emerald (Available), amber (Exhausted), rose (Weekly Exhausted).
- Typography: `tracking-tight` headings, `text-[13px]` body, uppercase micro-labels with `tracking-widest`.
- Mesh gradient header with subtle radial gradients.
- Number inputs have spinner buttons hidden via CSS (`::-webkit-inner-spin-button`).

## Constraints

- Do not add a backend unless explicitly requested.
- Do not store user data anywhere except browser storage.
- Keep the app useful offline after initial load where possible.
- Preserve the simple copy-paste workflow: users should be able to jump to the next provider account quickly.
- Do not use `backdrop-blur` or CSS keyframe animations — they hurt performance.
- Keep the UI premium but lightweight: no unnecessary DOM nodes, no heavy shadows, no complex animation layers.
