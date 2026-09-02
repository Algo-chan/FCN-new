# 002 — Introduce shared easing & duration tokens

**Commit:** `79b78a9`
**Severity:** HIGH
**Category:** Easing & duration / Cohesion
**Status:** OPEN

## Problem

Every Framer Motion animation in the landing codebase uses a hardcoded default ease or an ad-hoc cubic-bezier. There is no shared token layer, so motion feel is inconsistent and the default `ease: "easeOut"` reads sluggish for a crisp, trustworthy product.

Confirmed instances (non-exhaustive but representative):
- `PageTransition.tsx:18` → `transition={{ duration: ..., ease: "easeOut" }}`
- `StaggerChildren.tsx:35` → `transition={{ duration: 0.25, ease: "easeOut" }}`
- `FeaturesSection.tsx:27` → `ease: [0.25, 0.46, 0.45, 0.94]`
- `FeaturesSection.tsx:87` → `ease: [0.25, 0.46, 0.45, 0.94]`
- `FAQSection.tsx` accordion → `ease: "easeInOut"` (via `"easeInOut"`)
- `TrustBar.tsx` → `ease: "easeOut"`, `ease: [0.25, 0.46, 0.45, 0.94]`

## Target tokens

Define constants in one module so every consumer imports the same values. Create `fcn-frontend/src/styles/motion.ts`:

```ts
export const MOTION = {
  // Fast, authoritative UI shortcuts (buttons, toggles, micro-interactions)
  fast: { duration: 0.16, ease: [0.32, 0.72, 0, 1] as const },
  // Standard element enter/exit (cards, panels, page sections)
  standard: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const },
  // Scroll reveals & larger structural motion
  spring: { type: "spring" as const, stiffness: 260, damping: 26, mass: 1 },
  // Accordion expand/collapse (see plan 003 for interruptibility)
  accordion: { duration: 0.24, ease: [0.32, 0.72, 0, 1] as const }
} as const;
```

Rationale:
- `[0.32, 0.72, 0, 1]` is a fast-accelerating, gentle-settle bezier (Emil Kowalski / motion standard) — snappier than CSS `easeOut` and appropriate for a crisp healthcare UI. It is used for both `fast` and `standard`; only `duration` differs.
- `spring` is the reserved signature for the single "delight" moment (see below) — do not use it on every element.

## Implementation

### Step 1 — Add the token module
Create `fcn-frontend/src/styles/motion.ts` with the exact content above.

### Step 2 — Replace ad-hoc values in high-traffic paths
Update these call sites to import `MOTION` and spread its values:

- `PageTransition.tsx:18` → `transition={{ duration: MOTION.standard.duration, ease: MOTION.standard.ease }}`
- `StaggerChildren.tsx:35` (StaggerItem) → `transition={{ duration: MOTION.fast.duration, ease: MOTION.fast.ease }}`
- `FeaturesSection.tsx:27` (itemVariants visible transition) → `ease: MOTION.standard.ease`, keep `duration: 0.4` or set `MOTION.standard.duration`
- `TrustBar.tsx` `cardVariants` / `statVariants` `ease: "easeOut"` → `MOTION.standard.ease`

### Step 3 — Keep the reserved spring for one signature moment
Pick a single existing spot that already benefits from a springy delight (recommend the Navbar theme-toggle rotate at `Navbar.tsx:76-84`, currently `duration: 0.3`) and switch it to `transition={MOTION.spring}`. Leave all other elements on `fast`/`standard`.

## Conventions to preserve

- Do **not** invent parallel tokens in `animations.css`; CSS keyframes stay where they are, JS motion tokens live in `motion.ts`.
- `useReducedMotion` guards everywhere must remain intact — the reducer of a `transition` prop does not disable Framer motion, so keep the existing `shouldReduceMotion ? 0 : ...` duration guards in place.

## Verification

1. `npm run typecheck` in `fcn-frontend` passes.
2. Route transitions, scroll reveals, and card hovers all feel consistent (same bezier family, durations near 0.16/0.28).
3. The Navbar theme toggle has a subtle springy settle.
4. With OS `prefers-reduced-motion: reduce`, all motion is still suppressed (guards intact).

**Feel-check:** Set browser devtools to 0.5× animation playback and watch a route transition and a card reveal — they should share an identical settle arc rather than visibly different feels.
