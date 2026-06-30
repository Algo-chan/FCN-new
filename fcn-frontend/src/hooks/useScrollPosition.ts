import { useEffect, useState } from "react";

export const useScrollPosition = (): number => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      setScrollY(window.scrollY);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    setScrollY(window.scrollY);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return scrollY;
};