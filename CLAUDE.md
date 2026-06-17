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
  index.css             # Tailwind import, base styles, mesh gradient
  types.ts              # Instance and InstanceStatus types
  utils.ts              # Status logic, sorting, filtering, time formatting, durations
  hooks/
    useInstances.ts     # CRUD, localStorage persistence, export/import, duplicate
  components/
    InstanceCard.tsx     # Individual instance display with actions
    InstanceEditorModal.tsx  # Add/edit form with validation
    ConfirmDialog.tsx    # Delete confirmation dialog
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
- `hourlyResetTimestamp` — epoch ms for hourly window reset
- `weeklyResetTimestamp` — epoch ms for weekly window reset
- `exhausted` — manual toggle

## Behavior Notes

- Countdown values are calculated from absolute epoch timestamps.
- The app re-renders every 60 seconds so countdown text updates.
- Marking an instance `exhausted` is manual via the clickable status badge.
- An exhausted instance automatically becomes available again when both reset timestamps are in the past.
- Sorting order: READY instances first, then available instances by nearest reset, exhausted instances last.
- The `Use` button copies `configBlock` to the clipboard.
- Search filters by name, website, account label, or allowance labels.
- Export copies JSON to clipboard or downloads as `.json` file.
- Import accepts pasted JSON or file upload.
- Duplicate creates a copy with "(copy)" appended to the name.
- "Reset All" appears when any instance is exhausted and clears all exhausted flags.
- Delete requires confirmation via a dialog.

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
- CSS is ~33KB (6KB gzipped). JS is ~222KB (67KB gzipped).

## Design Language

- Dark theme: `#030712` base, `slate-900/80` cards, `white/[0.06]` borders.
- Glass morphism cards with subtle `border-white/[0.06]` and `bg-white/[0.02]` surfaces.
- Gradient accents: CTA buttons use `from-cyan-500 to-blue-500`.
- Status colors: emerald = READY, amber = SOON, slate = COOLING.
- Status badge is a clickable `rounded-lg` button with `cursor-pointer`, `active:scale-[0.97]` press feedback.
- Typography: `tracking-tight` headings, `text-[13px]` body, uppercase micro-labels with `tracking-widest`.
- Mesh gradient header with subtle radial gradients.

## Constraints

- Do not add a backend unless explicitly requested.
- Do not store user data anywhere except browser storage.
- Keep the app useful offline after initial load where possible.
- Preserve the simple copy-paste workflow: users should be able to jump to the next provider account quickly.
- Do not use `backdrop-blur` or CSS keyframe animations — they hurt performance.
- Keep the UI premium but lightweight: no unnecessary DOM nodes, no heavy shadows, no complex animation layers.
