import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { Home, Stethoscope, ArrowLeft, HeartPulse, Building2 } from "lucide-react";

export default function NotFoundPage() {
  const crossRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!crossRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.to(crossRef.current, {
      y: -16,
      rotation: 5,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center transition-colors">
      <Link to="/dashboard" className="mb-8 inline-block">
        <img
          src="/logo/fcn-logo-full.png"
          alt="Fast Care Now"
          className="h-10 sm:h-12 w-auto mx-auto drop-shadow-sm"
        />
      </Link>

      {/* Floating Animated Badge */}
      <div
        ref={crossRef}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-teal-500/20 via-sky-500/15 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 shadow-[0_12px_32px_rgba(20,184,166,0.25)]"
      >
        <HeartPulse className="w-10 h-10 sm:w-12 sm:h-12" />
      </div>

      <h1 className="text-6xl sm:text-7xl font-black mb-3 bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
        404
      </h1>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">
        Page Not Found
      </h2>

      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-sm sm:text-base leading-relaxed">
        The page you are looking for may have been moved, updated, or does not exist. Don't worry, we're here to help you find the care you need.
      </p>

      {/* Quick Action Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
        <Link
          to="/dashboard"
          className="w-full sm:w-auto flex-1 min-h-[48px] px-6 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(13,148,136,0.35)] hover:shadow-[0_12px_28px_rgba(13,148,136,0.45)] hover:brightness-105 active:scale-[0.98] transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Link>

        <Link
          to="/doctors"
          className="w-full sm:w-auto flex-1 min-h-[48px] px-6 rounded-2xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/15 active:scale-[0.98] transition-all shadow-sm"
        >
          <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Find Doctors</span>
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go back to previous page</span>
        </button>
        <span>•</span>
        <Link
          to="/hospitals"
          className="inline-flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Emergency & Hospitals</span>
        </Link>
      </div>
    </div>
  );
}
