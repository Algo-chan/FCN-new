import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";

export default function NotFoundPage() {
  const crossRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (crossRef.current) {
      gsap.to(crossRef.current, {
        y: -20,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center px-6 text-center">
      <img
        src="/logo/fcn-logo-full.png"
        alt="FCN"
        className="h-12 mb-8 opacity-60"
      />

      <div
        ref={crossRef}
        className="text-6xl mb-6"
      >
        +
      </div>

      <h1 className="text-7xl sm:text-8xl font-extrabold mb-4 bg-gradient-to-r from-fcn-primary to-fcn-accent bg-clip-text text-transparent">
        404
      </h1>

      <h2 className="text-xl font-semibold text-white mb-3">
        Page not found
      </h2>

      <p className="text-[#94A3B8] max-w-md mb-8 text-sm leading-relaxed">
        The page you're looking for doesn't exist or has moved.
      </p>

      <div className="flex gap-3">
        <Link
          to="/dashboard"
          className="px-6 py-3 rounded-xl bg-fcn-primary text-white font-medium text-sm hover:bg-[#0E8FB8] transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          to="/"
          className="px-6 py-3 rounded-xl border border-fcn-primary/30 text-white font-medium text-sm hover:bg-white/5 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
