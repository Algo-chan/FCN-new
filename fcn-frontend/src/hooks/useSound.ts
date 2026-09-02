import { useCallback, useMemo } from "react";
import { Howl } from "howler";

const NAV_SOUND_KEY = "fcn:navigation-sound";

export const readNavSoundPref = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  const stored = window.localStorage.getItem(NAV_SOUND_KEY);
  if (stored === null) {
    return false;
  }
  return stored === "1";
};

export const writeNavSoundPref = (enabled: boolean) => {
  try {
    window.localStorage.setItem(NAV_SOUND_KEY, enabled ? "1" : "0");
  } catch {
    /* storage unavailable — ignore */
  }
};

const canPlaySound = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const createHowl = (src: string): Howl | null => {
  try {
    return new Howl({
      src: [src],
      preload: true,
      volume: 0.35,
      onloaderror: () => undefined,
      onplayerror: () => undefined
    });
  } catch {
    return null;
  }
};

export const useSound = () => {
  const sounds = useMemo(
    () => ({
      transition: createHowl("/sounds/page-transition.mp3"),
      notification: createHowl("/sounds/notification.mp3"),
      success: createHowl("/sounds/success.mp3"),
      error: createHowl("/sounds/error.mp3")
    }),
    []
  );

  const play = useCallback((sound: Howl | null, opts?: { requirePref?: boolean }) => {
    if (!sound || !canPlaySound()) {
      return;
    }
    if (opts?.requirePref && !readNavSoundPref()) {
      return;
    }

    try {
      sound.play();
    } catch {
      return;
    }
  }, []);

  return {
    playTransition: () => play(sounds.transition, { requirePref: true }),
    playNotification: () => play(sounds.notification),
    playSuccess: () => play(sounds.success),
    playError: () => play(sounds.error),
    navSoundEnabled: readNavSoundPref,
    setNavSoundEnabled: writeNavSoundPref
  };
};
