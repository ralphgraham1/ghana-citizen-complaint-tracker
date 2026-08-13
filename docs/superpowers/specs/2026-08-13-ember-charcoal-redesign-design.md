# Ember & Charcoal Visual Redesign — Design Spec

Date: 2026-08-13
Status: Approved for implementation planning

## 1. Goal

The app (Ghana Citizen Service & Complaint Tracker) is functionally complete and deployed, but visually generic — default shadcn "new-york/neutral" theming, plain OpenStreetMap tiles, no dark mode. This redesign gives it a distinct, modern visual identity: a warm dark-charcoal palette with an ember accent, an automatic (system-preference) dark mode, and a modernized map with a dark basemap and glow-dot markers. No gradients anywhere — flat, solid colors throughout.

This is a visual-only pass. No functional behavior, routes, data model, or business logic changes.

## 2. Scope

**In scope:** app-wide color tokens (background, surface, text, border, accent, status colors) for both dark and light mode; the map's tile basemap and marker style; verifying every existing page (navbar, auth pages, submission form, citizen/staff/admin dashboards, public dashboard) reads correctly against the new tokens.

**Out of scope:** layout changes, new components, new features, a manual dark/light toggle (explicitly rejected — see Decisions), typography changes, animation/motion beyond what the map marker already needs.

## 3. Decisions

- **Dark mode is automatic, no toggle.** Follows the OS/browser `prefers-color-scheme` exclusively. Implemented via Tailwind's `darkMode: 'media'` strategy (change from Task 1's `darkMode: ['class']`) so `dark:` utility variants respond directly to the media query — no JS, no stored preference, no UI control.
- **Redesign lands in one pass**, not staged by section, because the app already routes almost all color through a small shared token layer (shadcn's CSS custom properties in `src/index.css`, referenced by `tailwind.config.ts`). Re-pointing those tokens cascades the new palette everywhere with minimal per-page changes. The map/marker is the one area needing direct code changes beyond the token layer.
- **No gradients.** Every surface, button, and badge is a flat, solid color. Depth comes from subtle borders and (sparingly) soft glows on map markers only — not from linear/radial gradients on UI chrome.
- Status color *semantics* are unchanged from the existing app (amber=submitted, blue=assigned, orange=in_progress, green=resolved, gray=closed, red=rejected) — only the exact shades change, to sit correctly against the new dark/light backgrounds.

## 4. Design Tokens

| Token | Dark (default look) | Light (system-light fallback) |
|---|---|---|
| `--background` | `#151312` | `#faf7f2` |
| `--foreground` | `#f2ece4` | `#1c1815` |
| `--card` | `#1c1a18` | `#ffffff` |
| `--card-foreground` | `#f2ece4` | `#1c1815` |
| Nav/header background | `#0e0d0c` | `#ffffff` |
| `--border` | white @ 8% opacity | black @ 8% opacity |
| `--primary` (accent) | `#e8a33d` (ember) | `#c9791f` (darkened for contrast on white) |
| `--primary-foreground` | `#151312` | `#ffffff` |
| `--muted` | `#232019` | `#f0ece5` |
| `--muted-foreground` | `#f2ece4` @ 65% | `#1c1815` @ 60% |

These map onto the exact CSS custom properties Task 1's shadcn setup already established in `src/index.css` (`:root` for light values, and — once `darkMode: 'media'` is set — a `@media (prefers-color-scheme: dark)` block for dark values, replacing the current unused `.dark` class block). `tailwind.config.ts`'s existing `hsl(var(--x))` wrapping pattern is unchanged; only the underlying HSL values and the dark-mode strategy change.

### Status colors (badge background tint / text, dark → light)

| Status | Dark bg / text | Light bg / text |
|---|---|---|
| submitted | `#3a2a12` / `#e8a33d` | `#fdf0d9` / `#8a5a12` |
| assigned | `#14263a` / `#4a90d9` | `#dce9f7` / `#1d5490` |
| in_progress | `#3a2712` / `#e08a3d` | `#fbe6d1` / `#8f4e11` |
| resolved | `#1f3323` / `#5fbf6f` | `#dcf3e0` / `#227a33` |
| closed | `#262421` / `#9a938a` | `#eeece8` / `#5c574e` |
| rejected | `#3a1414` / `#e8635a` | `#fce0dd` / `#a3271e` |

## 5. Map Redesign

- **Basemap:** replace the current OSM tile URL with CartoDB's free, no-API-key basemaps, selected by `window.matchMedia('(prefers-color-scheme: dark)')`:
  - Dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
  - Light: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
  - Attribution updates to credit both OpenStreetMap and CARTO, per CartoDB's usage terms.
- **Marker:** the existing `ComplaintMap.tsx` marker is already a colored `divIcon` circle (not a Leaflet default pin) — it needs restyling, not replacing. Add a soft halo (`box-shadow` with a status-colored glow) and swap the current white border for a border matching the surrounding basemap (charcoal in dark mode, white in light mode), producing the "glow dot" style approved in brainstorming. Status-to-color mapping uses the same six status colors as the badges above (the saturated/text variant, not the tinted background variant).
- The picked-location marker (used on the submission form's map picker) gets the same glow-dot treatment in the accent ember color, distinct from any status color.

## 6. Non-Goals / Explicitly Rejected

- No manual light/dark toggle UI.
- No gradient backgrounds, buttons, or badges anywhere.
- No change to map center/zoom defaults, filter logic, or any non-visual behavior.
- No typography/font changes in this pass.

## 7. Implementation Notes (for the plan)

Primary files expected to change:
- `tailwind.config.ts` — `darkMode: 'media'` (from `['class']`).
- `src/index.css` — replace `:root`/`.dark` HSL values with the new token table above, restructured around `@media (prefers-color-scheme: dark)`.
- `src/components/complaints/ComplaintMap.tsx` — tile URL selection by color-scheme media query, glow-dot marker styling.
- `src/components/complaints/StatusBadge.tsx` — status color pairs updated to the new table (currently hardcoded Tailwind utility classes like `bg-yellow-100 text-yellow-800`; these become custom hex-based classes or inline styles reading the new tokens, since the new status hues don't map cleanly onto default Tailwind color steps).
- Spot-check every page for any hardcoded color classes that bypass the token layer (e.g. literal `bg-white`, `text-gray-900`) rather than the semantic `background`/`foreground`/`card` tokens — these would not automatically pick up the new palette and need updating individually.

No new dependencies required — CartoDB tiles are used the same way the current OSM tile URL is (a plain `TileLayer` `url` prop in react-leaflet).
