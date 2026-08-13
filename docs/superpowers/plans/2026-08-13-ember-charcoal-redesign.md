# Ember & Charcoal Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the deployed app with a warm dark-charcoal "Ember & Charcoal" palette, automatic (system-preference) dark mode, a modernized dark/light map with glow-dot markers, and restrained Framer Motion micro-interactions — no functional/behavioral changes.

**Architecture:** Re-point the existing shadcn CSS custom-property token layer (`src/index.css` + `tailwind.config.ts`) from the default neutral HSL palette to hex-valued Ember & Charcoal tokens, switching from class-based to `prefers-color-scheme`-media-based dark mode (no toggle). Layer Framer Motion onto existing React components (`Button`, `ComplaintCard`, `StatusBadge`, and the three pages that render complaint-card lists) without changing their markup structure or behavior. Replace the map's OSM tile source with CartoDB's free dark/light basemaps chosen via `matchMedia`, and restyle the existing marker `divIcon` with a glow + pulse (CSS `@keyframes`, since Leaflet icons are static HTML outside React's render tree).

**Tech Stack:** Same as the existing app (Vite, React, TypeScript, Tailwind, shadcn/ui, react-leaflet) plus one new dependency: `framer-motion`.

## Global Constraints

- No gradients anywhere — every color value in this plan is a flat, solid color.
- Dark mode is automatic only (`prefers-color-scheme` media query) — no toggle UI, no stored preference, no JS-driven class on `<html>`/`<body>`.
- Status color *semantics* are unchanged (submitted=amber, assigned=blue, in_progress=orange, resolved=green, closed=gray, rejected=red) — only exact shades change.
- No layout, routing, data-model, or business-logic changes. This is a styling-and-motion-only pass.
- `tests/categoryRouting.test.ts` and `tests/statusTransitions.test.ts` must continue to pass unmodified — nothing in this plan touches the modules they test.
- Design spec (source of truth for exact color values and rationale): `docs/superpowers/specs/2026-08-13-ember-charcoal-redesign-design.md`.

---

### Task 1: Design Tokens — Dark-Mode Strategy, Color Palette, Marker Keyframes

**Files:**
- Modify: `tailwind.config.ts` (full-file rewrite)
- Modify: `src/index.css` (full-file rewrite)
- Modify: `package.json` (add `framer-motion` dependency)

**Interfaces:**
- Produces: every existing Tailwind semantic color utility (`bg-background`, `text-foreground`, `bg-card`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-accent`, `bg-destructive`, `border-border`, `ring-ring`, etc.) now resolves to the new Ember & Charcoal palette automatically under `prefers-color-scheme`, with **zero changes needed in any component that already uses these semantic classes** — this is why Task 1 must land before any other task's manual verification is meaningful. Also produces two global CSS `@keyframes` (`complaint-marker-pulse`, `complaint-marker-in`) consumed by Task 4's marker styling. `framer-motion` becomes available as an installed package for Tasks 2–3.

- [ ] **Step 1: Install `framer-motion`**

```bash
npm install framer-motion
```

- [ ] **Step 2: Rewrite `tailwind.config.ts`**

Replace the entire file with:

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

Note: `darkMode` changed from `['class']` to `'media'` (automatic, system-driven — matches the "no toggle" decision). `chart-*`/`sidebar-*` keep their old `hsl(var(--x))` wrapping and unitless-HSL custom-property format — they're unused anywhere in this app, so they're intentionally left as Task 1 (original scaffold) set them up. Every other color key drops the `hsl()` wrapper in favor of a plain `var(--x)` reference, because Step 3 stores those custom properties as literal hex values, not HSL triplets — this is what makes exact-hex specification (from the design spec) possible without error-prone manual HSL conversion.

- [ ] **Step 3: Rewrite `src/index.css`**

Replace the entire file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: #faf7f2;
    --foreground: #1c1815;
    --card: #ffffff;
    --card-foreground: #1c1815;
    --popover: #ffffff;
    --popover-foreground: #1c1815;
    --primary: #c9791f;
    --primary-foreground: #ffffff;
    --secondary: #f0ece5;
    --secondary-foreground: #1c1815;
    --muted: #f0ece5;
    --muted-foreground: #6b6459;
    --accent: #f0ece5;
    --accent-foreground: #1c1815;
    --destructive: #a3271e;
    --destructive-foreground: #ffffff;
    --border: #e5e0d8;
    --input: #e5e0d8;
    --ring: #c9791f;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --background: #151312;
      --foreground: #f2ece4;
      --card: #1c1a18;
      --card-foreground: #f2ece4;
      --popover: #1c1a18;
      --popover-foreground: #f2ece4;
      --primary: #e8a33d;
      --primary-foreground: #151312;
      --secondary: #232019;
      --secondary-foreground: #f2ece4;
      --muted: #232019;
      --muted-foreground: #a89d8d;
      --accent: #232019;
      --accent-foreground: #f2ece4;
      --destructive: #e8635a;
      --destructive-foreground: #151312;
      --border: #2b2723;
      --input: #2b2723;
      --ring: #e8a33d;
      --chart-1: 220 70% 50%;
      --chart-2: 160 60% 45%;
      --chart-3: 30 80% 55%;
      --chart-4: 280 65% 60%;
      --chart-5: 340 75% 55%;
      --sidebar: 240 5.9% 10%;
      --sidebar-foreground: 240 4.8% 95.9%;
      --sidebar-primary: 224.3 76.3% 48%;
      --sidebar-primary-foreground: 0 0% 100%;
      --sidebar-accent: 240 3.7% 15.9%;
      --sidebar-accent-foreground: 240 4.8% 95.9%;
      --sidebar-border: 240 3.7% 15.9%;
      --sidebar-ring: 217.2 91.2% 59.8%;
    }
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@keyframes complaint-marker-pulse {
  0% {
    transform: scale(1);
    opacity: 0.35;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

@keyframes complaint-marker-in {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: succeeds with zero TypeScript/build errors (this step only changes CSS/config, so a failure here would indicate a syntax mistake in the rewrite, not an app-logic issue).

- [ ] **Step 5: Manually verify both color schemes render**

Run: `npm run dev`, open the app in a browser. Open DevTools → Rendering tab (Chrome/Edge) → "Emulate CSS media feature prefers-color-scheme" → toggle between `light` and `dark`. Confirm: in dark, the page background is near-black warm charcoal (`#151312`) and text is warm off-white; in light, background is warm cream (`#faf7f2`) and text is near-black. Confirm shadcn components already on screen (buttons, the navbar, any visible cards) visibly change color when toggling — this proves the token layer is wired correctly even before Tasks 2–4 add anything new.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts src/index.css package.json package-lock.json
git commit -m "feat: switch to Ember & Charcoal palette with automatic dark mode"
```

---

### Task 2: Motion Variants + StatusBadge Redesign

**Files:**
- Create: `src/lib/motionVariants.ts`
- Modify: `src/components/complaints/StatusBadge.tsx` (full-file rewrite)

**Interfaces:**
- Consumes: `framer-motion` (Task 1), `ComplaintStatus` from `@/lib/types`.
- Produces: `listContainerVariants`, `listItemVariants` (exported `Variants` objects from `@/lib/motionVariants`, consumed by Task 3's `ComplaintCard` and the three list pages). `StatusBadge` keeps its existing exact prop signature (`{ status: ComplaintStatus }`) and rendered text/semantics — only its colors and the addition of a crossfade animation on status change are new.

- [ ] **Step 1: Create the shared motion variants**

Create `src/lib/motionVariants.ts`:

```ts
import type { Variants } from 'framer-motion'

export const listContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}
```

- [ ] **Step 2: Rewrite `StatusBadge.tsx`**

Replace the entire file with:

```tsx
import { motion, AnimatePresence } from 'framer-motion'
import type { ComplaintStatus } from '@/lib/types'

const LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
}

const CLASSES: Record<ComplaintStatus, string> = {
  submitted: 'bg-[#fdf0d9] text-[#8a5a12] dark:bg-[#3a2a12] dark:text-[#e8a33d]',
  assigned: 'bg-[#dce9f7] text-[#1d5490] dark:bg-[#14263a] dark:text-[#4a90d9]',
  in_progress: 'bg-[#fbe6d1] text-[#8f4e11] dark:bg-[#3a2712] dark:text-[#e08a3d]',
  resolved: 'bg-[#dcf3e0] text-[#227a33] dark:bg-[#1f3323] dark:text-[#5fbf6f]',
  closed: 'bg-[#eeece8] text-[#5c574e] dark:bg-[#262421] dark:text-[#9a938a]',
  rejected: 'bg-[#fce0dd] text-[#a3271e] dark:bg-[#3a1414] dark:text-[#e8635a]',
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.18 }}
        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CLASSES[status]}`}
      >
        {LABELS[status]}
      </motion.span>
    </AnimatePresence>
  )
}
```

Note: the `dark:` utility variant is used here specifically (rather than the CSS-custom-property approach Task 1 used for the broad token layer) because these six status color pairs are one-off, not part of the reusable semantic token set — `darkMode: 'media'` (set in Task 1) makes `dark:` classes respond to the same system `prefers-color-scheme` automatically, so this is consistent with the "no toggle" mechanism, just a different (equally valid) way of expressing it for badge-specific colors.

- [ ] **Step 3: Verify**

Run: `npm run build` — must pass.
Run: `npm run test` — the existing 14 tests must still pass (this task doesn't touch anything they cover, but confirm no regression).

Run: `npm run dev`, navigate to any page showing a `StatusBadge` (e.g. the public dashboard, once a complaint exists). Confirm badge colors match the new palette in both light and dark (DevTools emulation, as in Task 1 Step 5). Confirm badges render distinctly per status (six visually distinct colors, not muddy/similar).

- [ ] **Step 4: Commit**

```bash
git add src/lib/motionVariants.ts src/components/complaints/StatusBadge.tsx
git commit -m "feat: add motion variants and restyle StatusBadge with new palette + crossfade"
```

---

### Task 3: Micro-Interactions — Button, ComplaintCard, List Stagger-In

**Files:**
- Modify: `src/components/ui/button.tsx` (full-file rewrite)
- Modify: `src/components/complaints/ComplaintCard.tsx` (full-file rewrite)
- Modify: `src/pages/PublicDashboardPage.tsx`
- Modify: `src/pages/MyReportsPage.tsx`
- Modify: `src/pages/staff/StaffQueuePage.tsx`

**Interfaces:**
- Consumes: `listContainerVariants`, `listItemVariants` (Task 2), `framer-motion` (Task 1).
- Produces: no prop/signature changes to `Button` or `ComplaintCard` — both keep their existing external API exactly. This task is purely additive motion behavior.

- [ ] **Step 1: Rewrite `src/components/ui/button.tsx`**

Replace the entire file with:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const MotionButton = motion.button
const MotionSlot = motion(Slot)

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const MotionComp = asChild ? MotionSlot : MotionButton
    return (
      <MotionComp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15 }}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

Note on the `Omit<...>` in `ButtonProps`: native `onDrag`/`onDragStart`/`onDragEnd`/`onAnimationStart`/`onAnimationEnd`/`onAnimationIteration` from `ButtonHTMLAttributes` have different type signatures than Framer Motion's own versions of those same event props — omitting the native ones from the interface avoids a TypeScript conflict when spreading `{...props}` onto a `motion.button`/`motion(Slot)`. This app doesn't use any of these six props on any `<Button>` anywhere, so the omission has no behavioral effect.

- [ ] **Step 2: Rewrite `src/components/complaints/ComplaintCard.tsx`**

Replace the entire file with:

```tsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Complaint, PublicComplaint } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/categoryRouting'
import { StatusBadge } from './StatusBadge'
import { listItemVariants } from '@/lib/motionVariants'

export function ComplaintCard({ complaint, to }: { complaint: Complaint | PublicComplaint; to: string }) {
  return (
    <motion.div variants={listItemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Link to={to} className="block rounded-lg border p-4 transition-colors hover:bg-muted/50">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium">{complaint.title}</h3>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">{CATEGORY_LABELS[complaint.category]}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{complaint.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {complaint.address_text ?? `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}
            </p>
          </div>
          <StatusBadge status={complaint.status} />
        </div>
      </Link>
    </motion.div>
  )
}
```

`variants={listItemVariants}` on its own does nothing until an ancestor `motion.*` element provides `variants={listContainerVariants}` with `initial="hidden" animate="visible"` (Step 3 wires this) — Framer Motion propagates the named animation state down through the component tree.

- [ ] **Step 3: Wire the stagger container into `PublicDashboardPage.tsx`**

Add to the imports at the top:
```tsx
import { motion } from 'framer-motion'
import { listContainerVariants } from '@/lib/motionVariants'
```

Replace:
```tsx
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filtered.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/complaints/${c.id}`} />
        ))}
      </div>
```
with:
```tsx
      <motion.div
        className="mt-6 grid gap-3 sm:grid-cols-2"
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {filtered.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/complaints/${c.id}`} />
        ))}
      </motion.div>
```

- [ ] **Step 4: Wire the stagger container into `MyReportsPage.tsx`**

Add to the imports:
```tsx
import { motion } from 'framer-motion'
import { listContainerVariants } from '@/lib/motionVariants'
```

Replace:
```tsx
      <div className="space-y-3">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/my-reports/${c.id}`} />
        ))}
      </div>
```
with:
```tsx
      <motion.div className="space-y-3" variants={listContainerVariants} initial="hidden" animate="visible">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/my-reports/${c.id}`} />
        ))}
      </motion.div>
```

- [ ] **Step 5: Wire the stagger container into `StaffQueuePage.tsx`**

Add to the imports:
```tsx
import { motion } from 'framer-motion'
import { listContainerVariants } from '@/lib/motionVariants'
```

Replace:
```tsx
      <div className="space-y-3">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/staff/${c.id}`} />
        ))}
      </div>
```
with:
```tsx
      <motion.div className="space-y-3" variants={listContainerVariants} initial="hidden" animate="visible">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/staff/${c.id}`} />
        ))}
      </motion.div>
```

- [ ] **Step 6: Verify**

Run: `npm run build` — must pass with zero TypeScript errors (pay particular attention to the `Button` type change — if it fails here, re-check the `Omit<...>` list in Step 1 covers every conflicting prop TypeScript flags).
Run: `npm run test` — 14/14 must still pass.

Run: `npm run dev`. Manually verify, logged in as the demo citizen (credentials in `.superpowers/sdd/task-4-report.md`):
- Any button (e.g. the navbar's "Report an issue" or a form submit button) visibly scales up slightly on hover and down slightly on click/tap.
- The public dashboard (`/`, no login needed) — cards fade/slide in with a slight stagger on first load (reload the page to see it fresh), and hovering a card lifts it slightly.
- `/my-reports` — same stagger/hover behavior.
- Log in as the demo staff account, visit `/staff` — same stagger/hover behavior on that queue.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/button.tsx src/components/complaints/ComplaintCard.tsx src/pages/PublicDashboardPage.tsx src/pages/MyReportsPage.tsx src/pages/staff/StaffQueuePage.tsx
git commit -m "feat: add Framer Motion micro-interactions to Button, ComplaintCard, and list pages"
```

---

### Task 4: Map Redesign — Dark/Light Basemap + Glow-Dot Markers

**Files:**
- Modify: `src/components/complaints/ComplaintMap.tsx` (full-file rewrite)

**Interfaces:**
- Consumes: `complaint-marker-pulse`/`complaint-marker-in` `@keyframes` (Task 1, global CSS).
- Produces: no prop signature changes to `ComplaintMap` — it keeps its existing exact props (`complaints`, `pickable`, `pickedLocation`, `onPick`, `onMarkerClick`). All consumers (`SubmitComplaintPage`, `PublicDashboardPage`, `PublicComplaintDetailPage`, `CitizenComplaintDetailPage`, `StaffComplaintDetailPage`) need zero changes.

- [ ] **Step 1: Rewrite `src/components/complaints/ComplaintMap.tsx`**

Replace the entire file with:

```tsx
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Complaint, PublicComplaint } from '@/lib/types'

const ACCRA_CENTER: [number, number] = [5.6037, -0.187]

const STATUS_COLOR: Record<string, string> = {
  submitted: '#e8a33d',
  assigned: '#4a90d9',
  in_progress: '#e08a3d',
  resolved: '#5fbf6f',
  closed: '#9a938a',
  rejected: '#e8635a',
}

const PICK_COLOR = '#e8a33d'

const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

function useIsDarkScheme() {
  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [])

  return isDark
}

function markerIcon(color: string, borderColor: string) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:14px;height:14px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.35;animation:complaint-marker-pulse 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid ${borderColor};box-shadow:0 0 8px ${color}88;animation:complaint-marker-in 0.3s ease-out;"></div>
    </div>`,
    iconSize: [14, 14],
  })
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

interface ComplaintMapProps {
  complaints?: (Complaint | PublicComplaint)[]
  pickable?: boolean
  pickedLocation?: { lat: number; lng: number } | null
  onPick?: (lat: number, lng: number) => void
  onMarkerClick?: (complaintId: string) => void
}

export function ComplaintMap({ complaints = [], pickable = false, pickedLocation, onPick, onMarkerClick }: ComplaintMapProps) {
  const isDark = useIsDarkScheme()
  const borderColor = isDark ? '#151312' : '#ffffff'

  return (
    <MapContainer center={ACCRA_CENTER} zoom={7} style={{ height: '400px', width: '100%' }}>
      <TileLayer attribution={TILE_ATTRIBUTION} url={isDark ? DARK_TILE_URL : LIGHT_TILE_URL} />
      {pickable && onPick && <ClickCatcher onPick={onPick} />}
      {pickedLocation && <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={markerIcon(PICK_COLOR, borderColor)} />}
      {complaints.map((c) => (
        <Marker
          key={c.id}
          position={[c.latitude, c.longitude]}
          icon={markerIcon(STATUS_COLOR[c.status] ?? '#9a938a', borderColor)}
          eventHandlers={onMarkerClick ? { click: () => onMarkerClick(c.id) } : undefined}
        >
          <Popup>
            <strong>{c.title}</strong>
            <br />
            {c.status.replace('_', ' ')}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

Note: `useIsDarkScheme` re-renders the map's `<TileLayer url=...>` prop when the OS scheme changes live (not just on load) — react-leaflet re-fetches tiles from the new URL when the `url` prop changes, so this works without a page reload. The marker's border color (`borderColor`) is also scheme-aware so the glow dot's outline matches the surrounding basemap in both modes, consistent with the brainstormed "Glow Dot" style.

- [ ] **Step 2: Verify**

Run: `npm run build` — must pass.
Run: `npm run test` — 14/14 must still pass (this task doesn't touch tested modules).

Run: `npm run dev`, visit the public dashboard (`/`, has existing complaints from prior testing). Confirm:
- The basemap is visibly dark-styled by default (or light-styled, matching whatever your OS/browser is currently set to) — use DevTools' `prefers-color-scheme` emulation (as in Task 1 Step 5) to check both.
- Markers render as glow dots (soft halo, solid center) in the correct status color, not the old plain-circle style.
- Markers have a brief pop-in animation when the map first renders, and a subtle continuous pulsing ring.
- On the submission form (`/submit`, log in as demo citizen), click the map to pick a location — confirm the picked-location marker also renders with the glow-dot style in the ember accent color.

- [ ] **Step 3: Commit**

```bash
git add src/components/complaints/ComplaintMap.tsx
git commit -m "feat: modernize map with dark/light CartoDB basemap and glow-dot markers"
```

---

## After This Plan

Once all four tasks are reviewed and merged, redeploy: push to `main` (Vercel auto-deploys on push, per the existing GitHub integration from the original deployment). No new environment variables or infrastructure changes are needed — `framer-motion` and the CartoDB tile URLs need no API keys or secrets.
