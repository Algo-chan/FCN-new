import { motion, useReducedMotion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Building2, CalendarPlus, MapPin, Star, BadgeCheck, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { PilotBadge } from "@/components/ui/PilotBadge";
import { useTranslation } from "@/i18n";
import { useAuthStore } from "@/store/auth.store";
import type { PublicDoctorCard } from "@/types";
import { clsx } from "clsx";

interface DoctorCardProps {
  doctor: PublicDoctorCard;
  index: number;
  onClick: () => void;
}

const formatSlot = (slot: string): string => {
  try {
    const d = new Date(slot);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return slot;
  }
};

export const DoctorCard = ({ doctor, index, onClick }: DoctorCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t } = useTranslation();

  const isAvailable = doctor.availability_status === "available";
  const isInSession = doctor.availability_status === "in_session";

  const statusLabel = isAvailable
    ? t("common.available")
    : isInSession
      ? t("common.inSession")
      : t("common.unavailable");

  const consultFee = doctor.consultation_fee_etb
    ? `${doctor.consultation_fee_etb} ${t("filter.etb")}`
    : "—";

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/appointments/book?doctor_id=${doctor.id}` } });
      return;
    }
    navigate(`/appointments/book?doctor_id=${doctor.id}`);
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        delay: shouldReduceMotion ? 0 : Math.min(index * 0.05, 0.4),
      }}
      layout
      className="h-full"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={clsx(
          "group relative flex flex-col h-full rounded-[22px] border border-slate-200/80 bg-white overflow-hidden text-left transition-all duration-200 cursor-pointer select-none",
          "hover:shadow-[0_12px_32px_rgba(13,148,136,0.15)] hover:border-teal-500/30",
          "dark:border-white/10 dark:bg-slate-900/90 dark:hover:border-teal-400/30",
          "active:scale-[0.99]"
        )}
      >
        {/* Doctor Photo Header */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {doctor.photo_url ? (
            <img
              src={doctor.photo_url}
              alt={doctor.full_name}
              className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
            />
          ) : (
            <ImagePlaceholder
              query={`Ethiopian doctor portrait, professional clinic, ${doctor.specialty}`}
              alt={doctor.full_name}
              aspectRatio="4/3"
              rounded="none"
              className="h-full w-full"
            />
          )}

          {/* Dark gradient overlay for readability of bottom chips */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* FREE during pilot Badge on Photo */}
          <div className="absolute top-3 left-3">
            <PilotBadge size="xs" variant="solid" />
          </div>

          {/* Availability Status Chip */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-[11px] font-bold text-white shadow-sm">
            <span
              className={clsx(
                "h-2 w-2 rounded-full",
                isAvailable && "bg-emerald-400 animate-pulse",
                isInSession && "bg-amber-400",
                !isAvailable && !isInSession && "bg-slate-400"
              )}
            />
            <span>{statusLabel}</span>
          </div>

          {/* Verified Badge */}
          {doctor.verified && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-600/90 backdrop-blur-md text-[11px] font-bold text-white shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" />
              <span>{t("common.verified")}</span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link
              to={`/doctors/${doctor.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors hover:underline"
            >
              {doctor.full_name}
            </Link>
            {doctor.rating_average > 0 && (
              <div className="flex items-center gap-1 text-amber-500 flex-shrink-0 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 fill-amber-500" />
                <span>{doctor.rating_average.toFixed(1)}</span>
              </div>
            )}
          </div>

          <span className="inline-block text-xs font-semibold text-teal-600 dark:text-teal-400 mb-2">
            {doctor.specialty}
          </span>

          {/* Hospital and Location */}
          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
            {doctor.hospital_name && (
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{doctor.hospital_name}</span>
              </div>
            )}
            {doctor.city && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{doctor.city}</span>
              </div>
            )}
          </div>

          {/* Prominent Pricing Block */}
          <div className="mt-auto rounded-xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 p-2.5 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Consultation Fee
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-400 line-through font-semibold">
                    {doctor.consultation_fee_etb ? `${doctor.consultation_fee_etb} Br` : "350 Br"}
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    0 Br
                  </span>
                </div>
              </div>
              <div className="text-right">
                <PilotBadge size="xs" variant="glow" />
                <p className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-0.5">
                  100% Free Consultation
                </p>
              </div>
            </div>
          </div>

          {/* Stats pills */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 mb-3">
            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("modal.experience")}
              </p>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                {doctor.years_experience || 10}+ Years
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("common.language")}
              </p>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 truncate px-1">
                {doctor.languages_spoken.length > 0 ? doctor.languages_spoken.slice(0, 2).join(", ") : "—"}
              </p>
            </div>
          </div>

          {/* Next Available Slot */}
          {doctor.next_available_slot && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3 bg-teal-500/5 px-2.5 py-1.5 rounded-xl border border-teal-500/10">
              <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
              <span className="truncate">
                {t("doctors.nextSlot", { slot: formatSlot(doctor.next_available_slot) })}
              </span>
            </div>
          )}

          {/* Action Button */}
          <Button
            type="button"
            variant="action"
            onClick={handleBook}
            className="w-full min-h-[44px] text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-xs"
          >
            <CalendarPlus className="h-4 w-4 mr-1.5" />
            <span>Book Free Consultation</span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
