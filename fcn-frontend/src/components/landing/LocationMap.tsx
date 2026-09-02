import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Building2, GraduationCap, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { MOTION } from "@/styles/motion";

interface Hub {
  name: string;
  icon: typeof Building2;
  hue: number;
  x: number;
  y: number;
  doctors: number;
  wait: string;
  specialties: string;
  tier: "HOSPITAL" | "ASSOCIATION";
}

// Abstract positions on a 0–100 × 0–100 canvas representing the Dire Dawa region.
// Nodes cluster tighter toward the centre (city core) and fan out toward the edges.
const hubs: Hub[] = [
  { name: "Dire Dawa General Hospital", icon: Building2, hue: 190, x: 46, y: 48, doctors: 42, wait: "~4 min", specialties: "General · ER · Surgery", tier: "HOSPITAL" },
  { name: "Dil-Chora Referral Hospital", icon: HeartPulse, hue: 170, x: 34, y: 62, doctors: 38, wait: "~6 min", specialties: "Referral · Maternity", tier: "HOSPITAL" },
  { name: "Haramaya University Hospital", icon: GraduationCap, hue: 210, x: 66, y: 40, doctors: 51, wait: "~7 min", specialties: "Teaching · Specialised", tier: "HOSPITAL" },
  { name: "Ethiopian Medical Association", icon: Stethoscope, hue: 200, x: 56, y: 72, doctors: 60, wait: "—", specialties: "Doctor Network", tier: "ASSOCIATION" },
  { name: "Ministry of Health Ethiopia", icon: ShieldCheck, hue: 180, x: 26, y: 34, doctors: 0, wait: "—", specialties: "Regulation", tier: "ASSOCIATION" }
];

const MAX_DOCTORS = 60;

export const LocationMap = () => {
  const [active, setActive] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Dismiss the tooltip when tapping/clicking anywhere outside the map
  useEffect(() => {
    if (active === null) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (mapRef.current && !mapRef.current.contains(t)) {
        setActive(null);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [active]);

  // Horizontal anchor so the tooltip stays inside the narrow mobile map
  const tooltipX = (x: number) => (x < 34 ? "left-0" : x > 66 ? "right-0" : "left-1/2 -translate-x-1/2");
  // Vertical: show below nodes in the top half, above nodes in the bottom half
  const tooltipY = (y: number) => (y < 45 ? "top-full mt-2" : "bottom-full mb-2");

  return (
    <div className="relative" ref={mapRef}>
      <div className="relative h-64 sm:h-80 lg:h-96">
        {/* Map visual — clipped so pulse rings stay tidy */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-fcn-light/80 to-white/40 shadow-sm dark:from-white/[0.04] dark:to-white/[0.01]">
          <svg
            className="absolute inset-0 h-full w-full opacity-70 dark:opacity-40"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <pattern id="citygrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M10 0H0V10" fill="none" stroke="#0A7EA4" strokeOpacity="0.10" />
              </pattern>
              <linearGradient id="linkfade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0" />
                <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#citygrid)" />
          </svg>

          {/* Connection links between the core hospital nodes */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path
              d={`M${hubs[0].x},${hubs[0].y} L${hubs[1].x},${hubs[1].y} L${hubs[2].x},${hubs[2].y} Z`}
              fill="none"
              stroke="url(#linkfade)"
              strokeWidth="0.25"
              strokeDasharray="1.5 1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Nodes + tooltips — in the SAME sized, un-clipped container so nothing clips on small screens */}
        {hubs.map((h, i) => {
          const Icon = h.icon;
          const isActive = active === i;
          const size = 12 + (h.doctors / MAX_DOCTORS) * 12;
          return (
            <div
              key={h.name}
              className="group absolute"
              style={{ left: `${h.x}%`, top: `${h.y}%`, transform: "translate(-50%, -50%)" }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((a) => (a === i ? null : a))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive((a) => (a === i ? null : a))}
            >
              <button
                type="button"
                aria-expanded={isActive}
                aria-label={`${h.name} — ${h.doctors} doctors, wait ${h.wait}`}
                onClick={() => setActive((a) => (a === i ? null : i))}
                className="relative grid place-items-center rounded-full transition-transform duration-200 group-hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-fcn-accent"
                style={{ width: size, height: size }}
              >
                <span
                  className="pulse-ring pointer-events-none absolute inset-0 rounded-full"
                  style={{ backgroundColor: `hsl(${h.hue}, 70%, 55%)`, opacity: 0.45 }}
                />
                <span
                  className="pointer-events-none absolute inset-[-4px] rounded-full"
                  style={{ backgroundColor: `hsl(${h.hue}, 70%, 50%)`, opacity: 0.15 }}
                />
                <span
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{ backgroundColor: `hsl(${h.hue}, 70%, 50%)`, boxShadow: `0 0 14px 2px hsla(${h.hue}, 70%, 55%, 0.6)` }}
                />
                <Icon className="relative h-1/2 w-1/2 text-white" strokeWidth={2} />
              </button>

              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={MOTION.fast}
                  className={`pointer-events-none absolute z-30 w-44 max-w-[calc(100vw-2rem)] sm:w-52 ${tooltipY(h.y)} ${tooltipX(h.x)} rounded-xl border border-white/20 bg-white/95 p-3 text-left shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#0D1117]/95`}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `hsla(${h.hue}, 70%, 50%, 0.15)`, color: `hsl(${h.hue}, 70%, 45%)` }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-fcn-text-light dark:text-white">{h.name}</p>
                      <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: `hsl(${h.hue}, 70%, 45%)` }}>
                        {h.tier}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 text-[10px] text-fcn-text-light/70 dark:text-gray-300">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-fcn-accent" />
                      {h.tier === "HOSPITAL" ? `${h.doctors} doctors` : "network"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-fcn-success" />
                      {h.wait}
                    </span>
                    <span className="col-span-2 truncate text-fcn-text-light/50 dark:text-gray-400">{h.specialties}</span>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
        {hubs.filter((h) => h.tier === "HOSPITAL").length} partner hospitals + clinical networks across{" "}
        <span className="text-fcn-primary dark:text-fcn-accent">Dire Dawa</span> — tap a node for live stats
      </p>
    </div>
  );
};