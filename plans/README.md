# Animation Improvement Plans

Audited against the `improve-animations` skill bar (Emil Kowalski motion philosophy).
All plans are self-contained and can be executed by any agent with zero conversation context.

Base commit: **`79b78a9`** · Stack: React 18 / Vite / Tailwind / Framer Motion v11 / GSAP v3

## Recommended execution order

1. **002 — Easing tokens** → prerequisite for 003 (shares `MOTION.accordion`). Do first so consumers import from one module.
2. **003 — Accordion interruptibility** → depends on 002's `motion.ts`.
3. **004 — Pause ambient loops off-screen** → independent; performance win.
4. **001 — Gate page-transition sound** → independent; UX/accessibility.

## Dependency map

```
002 (motion tokens)
 └──> 003 (accordion)  — needs MOTION.accordion
004 (ambient pause)     — independent
001 (sound gate)        — independent
```

Apply 002 before 003. Others can land in any order; 001 and 004 are low-risk and independent.

## Status

| Id | Title | Sev | Depends on | Status |
| --- | --- | --- | --- | --- |
| 001 | Gate page-transition sound | HIGH | – | OPEN |
| 002 | Intro shared easing & duration tokens | HIGH | – | OPEN |
| 003 | Accordion interruptibility | MEDIUM | 002 | OPEN |
| 004 | Pause ambient loops off-screen | MEDIUM | – | OPEN |

## Notes

- `AUDIT.md` / `PLAN-TEMPLATE.md` referenced by the `improve-animations` skill were not present in the skill directory; plans follow the skill's embedded format instead.
- Reduced-motion coverage is already strong (`useReducedMotion` everywhere + `prefers-reduced-motion` block in `animations.css:150`) and must be preserved by every plan.
