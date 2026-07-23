import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { useReducedMotion } from "motion/react";

interface AnimatedNumberProps {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  triggerOnView?: boolean;
}

export const AnimatedNumber = ({
  target,
  duration = 2000,
  suffix = "",
  prefix = "",
  className,
  triggerOnView = true
}: AnimatedNumberProps) => {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(target);
      return;
    }

    if (!triggerOnView) {
      // Animate immediately
      const obj = { value: 0 };
      const anim = animate(obj, {
        value: target,
        duration,
        easing: "easeOutExpo",
        onUpdate: () => setDisplayValue(Math.round(obj.value))
      });
      return () => { void anim.cancel(); };
    }

    // Use IntersectionObserver to trigger on view
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const obj = { value: 0 };
          animate(obj, {
            value: target,
            duration,
            easing: "easeOutExpo",
            onUpdate: () => setDisplayValue(Math.round(obj.value))
          });
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, shouldReduceMotion, triggerOnView]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};
