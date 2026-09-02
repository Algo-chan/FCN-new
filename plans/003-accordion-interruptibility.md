# 003 — Make accordion expansion interruptible and consistent

**Commit:** `79b78a9`
**Severity:** MEDIUM
**Category:** Interruptibility / Performance
**Status:** OPEN

## Problem

Both accordions animate an unmeasured `height: auto` with a fixed duration, which:
- is **non-interruptible**: rapid open-then-close still plays the full each animation, feeling laggy on fast taps;
- measures layout on the main thread with `height: auto` on every toggle;
- uses inconsistent easing (`FAQSection.tsx` uses `"easeInOut"`, `FeaturesSection.tsx` uses `[0.25, 0.46, 0.45, 0.94]`) and a fixed `0.25s` regardless of content height.

Locations:
- `fcn-frontend/src/components/landing/FeaturesSection.tsx:81-95` (mobile accordion, `AnimatePresence` + `motion.div height: 0 → auto`)
- `fcn-frontend/src/components/landing/FAQSection.tsx:62-76` (same pattern)

## Approach

Framer Motion handles interruptibility automatically when using its `height: "auto"` special value — toggling mid-flight cancels and retargets smoothly — so the fix is to **standardize both accordions on identical config** stamped from the shared token (see plan 002) rather than a bespoke rewrite. This removes the inconsistency and gives interruptible motion for free.

## Implementation

### Step 1 (prereq) — Ensure `MOTION.accordion` exists
Create `fcn-frontend/src/styles/motion.ts` with (from plan 002):

```ts
export const MOTION = {
  accordion: { duration: 0.24, ease: [0.32, 0.72, 0, 1] as const }
  // ...other tokens
};
```

### Step 2 — FAQSection.tsx
Replace the accordion `transition` (currently `duration: 0.25, ease: "easeInOut"`) with the shared token, and set `layout`-safe values so the height animates on the GPU-composited path:

```tsx
<AnimatePresence initial={false}>
  {openIdx === i && (
    <motion.div
      initial={!shouldReduceMotion ? { height: 0, opacity: 0 } : undefined}
      animate={{ height: "auto", opacity: 1 }}
      exit={!shouldReduceMotion ? { height: 0, opacity: 0 } : undefined}
      transition={MOTION.accordion}
      className="overflow-hidden"
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```

### Step 3 — FeaturesSection.tsx
Apply the identical change at `FeaturesSection.tsx:84-89` — replace the hardcoded `duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94]` with `transition={MOTION.accordion}`.

### Step 4 — Unify chevron rotation timing
Both accordions rotate the chevron with `duration: 0.2` / `0.2`. Align them to `MOTION.accordion.duration` so the icon settles in phase with the panel:

- `FeaturesSection.tsx:74` → `transition={{ duration: MOTION.accordion.duration }}`
- `FAQSection.tsx:55` → `transition={{ duration: MOTION.accordion.duration }}`

## Scope boundaries

- Only touch `FeaturesSection.tsx` and `FAQSection.tsx` (and the shared `motion.ts` from plan 002).
- Keep the existing `shouldReduceMotion` guards verbatim — do **not** remove them.
- Do **not** change the data, layout, or open/close logic (`openIdx` / `setOpenIdx` untouched).

## Verification

1. `npm run typecheck` passes.
2. Open and immediately close an accordion item on a phone — it reverses cleanly mid-flight (interruptible).
3. Both FAQ and Features accordions share the identical settle arc (same ease + duration).
4. With OS reduce-motion on, accordions snap open/closed instantly (guards intact).

**Feel-check:** Rapidly tap an FAQ item open then closed. Before the fix there is a visible lag/queue; after, the panel follows the finger instantly. Also compare against Features — they must feel like the same component.
