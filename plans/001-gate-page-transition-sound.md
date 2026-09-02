# 001 — Gate page-transition sound behind an explicit user preference

**Commit:** `79b78a9`
**Severity:** HIGH
**Category:** Purpose & frequency
**Status:** OPEN

## Problem

`PageTransition.tsx` plays a UI sound on **every route change**:

```tsx
// fcn-frontend/src/components/animations/PageTransition.tsx
useEffect(() => {
  playTransition(); // <-- fires on every page mount / route navigation
}, [playTransition]);
```

`playTransition()` is also called from click handlers across the app (Navbar, Hero, ForDoctors, FinalCTA — verified). The only gate today is `prefers-reduced-motion` inside `useSound.canPlaySound()` (`fcn-frontend/src/hooks/useSound.ts:9`). A user who does **not** have reduce-motion set — i.e. the vast majority — hears a navigation sound on every single page change with **no way to opt out**. This is a high-frequency, feel-breaking annoyance.

## Desired behavior

Navigation sound must be an explicit opt-in with a sensible default, and must not fire synchronously on every mount.

- Default: OFF for the high-frequency *page-transition* sound (navigation), but keep the lower-frequency, intention-triggered sounds (notification / success / error) available and ON by default.
- The user toggles navigation sound in one place; the choice persists across sessions.

## Implementation

### Step 1 — Add a persistent preference source

`useSound` becomes preference-aware. Introduce a module-level helper in `fcn-frontend/src/hooks/useSound.ts` that reads/writes a single key in `localStorage`:

```ts
const NAV_SOUND_KEY = "fcn:navigation-sound";

const readNavSoundPref = (): boolean => {
  if (typeof window === "undefined") return false;      // as before: no window, no sound
  const stored = window.localStorage.getItem(NAV_SOUND_KEY);
  if (stored === null) return false;                     // default: OFF for navigation sound
  return stored === "1";
};

const writeNavSoundPref = (enabled: boolean) => {
  try {
    window.localStorage.setItem(NAV_SOUND_KEY, enabled ? "1" : "0");
  } catch {
    /* storage unavailable — ignore */
  }
};
```

### Step 2 — Route the transition sound through the preference

Change `useSound` so only `playTransition` is preference-gated; leave `playNotification` / `playSuccess` / `playError` gated only by `canPlaySound()` (unchanged).

```ts
const play = useCallback((sound: Howl | null, opts?: { requirePref?: boolean }) => {
  if (!sound || !canPlaySound()) return;
  if (opts?.requirePref && !readNavSoundPref()) return;
  try { sound.play(); } catch { return; }
}, []);

return {
  playTransition: () => play(sounds.transition, { requirePref: true }),
  playNotification: () => play(sounds.notification),
  playSuccess: () => play(sounds.success),
  playError: () => play(sounds.error),
  navSoundEnabled: readNavSoundPref,
  setNavSoundEnabled: writeNavSoundPref
};
```

`readNavSoundPref` / `writeNavSoundPref` are exported from the returned object so a settings UI can bind to them.

### Step 3 — (Optional UI) expose a toggle

Place a single toggle wherever settings already live. If no settings surface is convenient, this step can be deferred — the default-off already fixes the annoyance. A minimal toggle on the **Navbar**:

```tsx
// fcn-frontend/src/components/landing/Navbar.tsx — inside the right-side controls
const { navSoundEnabled, setNavSoundEnabled } = useSound();
// ...render a small toggle button that calls setNavSoundEnabled(!navSoundEnabled)
```

## Scope boundaries

- Only touch `useSound.ts` (and optionally `Navbar.tsx` for the toggle). Do **not** refactor `PageTransition.tsx` further; its `playTransition()` call is safe to keep because the gate now lives in `useSound`.
- Do **not** change `prefers-reduced-motion` handling in `canPlaySound()` (it stays as the hard floor).
- Do **not** change the notification/success/error paths.

## Verification

1. Reload the app. Navigate between pages → **no** transition sound (default off).
2. Set the toggle on / run `localStorage.setItem("fcn:navigation-sound", "1")` → navigate → transition sound plays.
3. While `prefers-reduced-motion: reduce` is set, verify **no** sound plays even with the pref on (the `canPlaySound()` floor still applies).
4. Reload after toggling → preference persists.
5. Confirm notification/success/error sounds still play when triggered (unchanged).

**Feel-check:** Navigation should be quiet by default and become audible only for users who explicitly ask. Toggle the OS reduce-motion setting on a real device to confirm the hard floor.
