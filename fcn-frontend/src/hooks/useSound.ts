import { useCallback, useMemo } from "react";
import { Howl } from "howler";

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

  const play = useCallback((sound: Howl | null) => {
    if (!sound || !canPlaySound()) {
      return;
    }

    try {
      sound.play();
    } catch {
      return;
    }
  }, []);

  return {
    playTransition: () => play(sounds.transition),
    playNotification: () => play(sounds.notification),
    playSuccess: () => play(sounds.success),
    playError: () => play(sounds.error)
  };
};
