import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Building2, CalendarPlus, MapPin, Star, BadgeCheck, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { useTranslation } from "@/i18n";
import { useAuthStore } from "@/store/auth.store";
import type { PublicDoctorCard } from "@/types";

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

  const statusColors: Record<string, string> = {
    available: "bg-fcn-success",
    in_session: "bg-fcn-warning",
    unavailable: "bg-fcn-text-light/30 dark:bg-fcn-text-dark/30"
  };
  const statusColor = statusColors[doctor.availability_status] ?? "bg-fcn-text-light/30";
  const statusLabel =
    doctor.availability_status === "available"
      ? t("common.available")
      : doctor.availability_status === "in_session"
        ? t("common.inSession")
        : t("common.unavailable");
  const consultFee = doctor.consultation_fee_etb ? t("filter.etb") + " " + doctor.consultation_fee_etb : "—";

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/appointments/book?doctor_id=${doctor.id}` } });
      return;
    }
    navigate(`/appointments/book?doctor_id=${doctor.id}`);
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        delay: shouldReduceMotion ? 0 : index * 0.05
      }}
      layout
    >
      <motion.div
        whileHover={shouldReduceMotion ? {} : { translateY: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card
          className="group relative overflow-hidden p-0 cursor-pointer"
          hoverable
          onClick={onClick}
        >
          <div className="relative h-44 overflow-hidden">
            {doctor.photo_url ? (
              <img
                src={doctor.photo_url}
                alt={doctor.full_name}
                className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
              />
            ) : (
              <ImagePlaceholder
                query={`Ethiopian doctor professional portrait, medical setting, ${doctor.specialty}`}
                alt={doctor.full_name}
                aspectRatio="4/3"
                rounded="none"
                className="h-full w-full"
              />
            )}

            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <span className={`flex h-2.5 w-2.5 rounded-full ${statusColor} ${doctor.availability_status === "available" ? "pulse-glow" : ""}`} />
              <span className="text-xs font-medium text-white drop-shadow-md">{statusLabel}</span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {doctor.verified && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full bg-fcn-success/90 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
                  title={t("common.verified")}
                >
                  <BadgeCheck className="h-3 w-3" />
                  {t("common.verified").replace("✓ ", "")}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-fcn-accent/90 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                {doctor.specialty}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
                Dr. {doctor.full_name}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                {doctor.hospital_name && (
                  <span className="flex items-center gap-1 truncate">
                    <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{doctor.hospital_name}</span>
                  </span>
                )}
                {doctor.city && (
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {doctor.city}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-fcn-warning fill-fcn-warning" />
              <span className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                {doctor.rating_average.toFixed(1)}
              </span>
              <span className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                ({doctor.rating_count} {t("common.reviews")})
              </span>
            </div>

            {doctor.next_available_slot ? (
              <div className="flex items-center gap-1.5 text-xs text-fcn-primary">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{t("doctors.nextSlot", { slot: formatSlot(doctor.next_available_slot) })}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{t("doctors.noNextSlot")}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 border-t border-fcn-primary/5 pt-3">
              <div className="flex flex-col items-center">
                <span className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  {consultFee}
                </span>
                <span>{t("common.consult")}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  {doctor.follow_up_fee_etb ? t("filter.etb") + " " + doctor.follow_up_fee_etb : "—"}
                </span>
                <span>{t("common.followUp")}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="max-w-[80px] truncate font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  {doctor.languages_spoken.length > 0 ? doctor.languages_spoken.slice(0, 2).join(", ") + (doctor.languages_spoken.length > 2 ? "+" : "") : "—"}
                </span>
                <span>{t("common.language")}</span>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <Button
              className="w-full group/btn"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleBook();
              }}
            >
              <CalendarPlus className="h-4 w-4" />
              {t("book.bookAppointment")}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};