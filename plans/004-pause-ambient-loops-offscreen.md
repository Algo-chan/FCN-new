# 004 — Pause infinite ambient loops off-screen to save battery/CPU

**Commit:** `79b78a9`
**Severity:** MEDIUM
**Category:** Performance
**Status:** OPEN

## Problem

The landing page runs several **infinite `repeat: -1` GSAP tweens** that keep animating the whole time the section is mounted — even when the user has scrolled well past it and can no longer see them:

- `HeroSection.tsx`: heartbeat draw (repeat line ~42), 10 floating particles (repeat ~53-54), phone float (repeat ~66-67)
- `FinalCTASection.tsx`: 10 floating particles (repeat ~32-33)

GSAP's global ticker auto-pauses when the tab is hidden, but while the tab is visible these loops tick continuously regardless of viewport position, draining CPU/battery on mobile for animation the user cannot see. (They are already gated by `shouldReduceMotion`, which is correct and must stay.)

## Desired behavior

Ambient loops should only animate while their section is actually on screen. When the section scrolls out of view, the tweens pause; when it re-enters, they resume from where they left off.

## Implementation

### Step 1 — HeroSection.tsx

Add a ScrollTrigger-driven pause to the infinite tweens. `ScrollTrigger` is already registered globally in `LandingPage.tsx` (fcn-frontend/src/pages/LandingPage.tsx:18).

Create one `ScrollTrigger` scoped to the section and use its `onToggle` to pause/resume the loops. A clean way is to group the ambient tweens into a `gsap.context` (already present at `HeroSection.tsx`) and reference them by selector:

```ts
// inside the existing gsap.context callback (HeroSection.tsx, around lines 56-93),
// after the three repeating loops are created, add:

ScrollTrigger.create({
  trigger: sectionRef.current,
  start: "top bottom",
  end: "bottom top",
  onToggle: (self) => {
    ctx.getTweens().forEach((t) => {
      if (t.repeat() === -1) {
        self.isActive ? t.play() : t.pause();
      }
    });
  }
});
```

Notes:
- `ctx.getTweens()` returns the tweens created in this context (heartbeat, particles, phone float). Gating on `t.repeat() === -1` keeps the pause/resume scoped to the infinite loops only.
- `ScrollTrigger` is already imported in `HeroSection.tsx`? It is **not** currently imported there — import it: `import { ScrollTrigger } from "gsap/ScrollTrigger";` and `gsap.registerPlugin(ScrollTrigger);` (safe; already registered globally).
- `onToggle` fires with `self.isActive` true when the trigger becomes active; pausing/resuming on toggle boundaries is enough — no per-frame work.

### Step 2 — FinalCTASection.tsx

Apply the same pattern. Import `ScrollTrigger`, and in the existing `gsap.context` (lines ~25-37) which creates the `.cta-particle` loops, add an identical `ScrollTrigger.create({ trigger: sectionRef.current, ... })` block pausing/resuming tweens where `t.repeat() === -1`.

### Step 3 — Keep existing guards

Do **not** remove the `if (shouldReduceMotion) return;` early-returns or the `ctx.revert()` cleanup in either component. `ctx.revert()` also reverts the added ScrollTrigger? Reverting the context reverts tweens, but ScrollTriggers should be killed — `LandingPage.tsx` already kills all ScrollTriggers on unmount (`ScrollTrigger.getAll().forEach(st => st.kill())`), so this is covered.

## Scope boundaries

- Only touch `HeroSection.tsx` and `FinalCTASection.tsx`.
- The HowItWorks scroll-scrubbed line (`HowItWorksSection.tsx:32`) is intentionally viewport-linked and already pauses off-screen — do **not** touch it.
- Do **not** change particle counts, durations, or the visual feel of the loops.

## Verification

1. `npm run typecheck` passes.
2. Open the landing page, keep the hero in view → particles/heartbeat/phone animate (unchanged).
3. Scroll to the bottom so the hero exits the viewport → open DevTools Performance/CPU or the browser Process CPU → the loops stop (CPU drops) while off-screen.
4. Scroll back up → loops resume. Ensure they resume smoothly (GSAP preserves progress).
5. Hide the tab → loops pause (existing GSAP behavior) and re-run fine.
6. With `prefers-reduced-motion: reduce`, nothing animates (existing guard).

**Feel-check:** This is invisible when correct — the animation should look identical on screen while actively paused off-screen. Verify with the CPU meter that scrolling away immediately quiets the tab.
