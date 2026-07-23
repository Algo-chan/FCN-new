import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";

export const useAnimeCounter = (
  target: number,
  duration: number,
  isInView: boolean
): number => {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isInView || startedRef.current) return;
    startedRef.current = true;

    const obj = { value: 0 };
    const anim = animate(obj, {
      value: target,
      duration,
      easing: "easeOutExpo",
      onUpdate: () => {
        setCount(Math.round(obj.value));
      }
    });

    return () => {
      anim.cancel();
    };
  }, [isInView, target, duration]);

  return count;
};
