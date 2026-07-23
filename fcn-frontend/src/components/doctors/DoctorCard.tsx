import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Building2, CalendarPlus, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import type { DoctorWithProfile } from "@/types";

interface DoctorCardProps {
  doctor: DoctorWithProfile;
  index: number;
  onClick: () => void;
}

export const DoctorCard = ({ doctor, index, onClick }: DoctorCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const p = doctor.doctor_profile;

  const statusColors: Record<string, string> = {
    available: "bg-fcn-success",
    in_session: "bg-fcn-warning",
    unavailable: "bg-fcn-text-light/30 dark:bg-fcn-text-dark/30"
  };
  const statusColor = statusColors[p.availability_status] ?? "bg-fcn-text-light/30";

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
            {p.photo_url ? (
              <img
                src={p.photo_url}
                alt={doctor.full_name}
                className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
              />
            ) : (
              <ImagePlaceholder
                query={`Ethiopian doctor professional portrait, medical setting, ${p.specialty}`}
                alt={doctor.full_name}
                aspectRatio="4/3"
                rounded="none"
                className="h-full w-full"
              />
            )}

            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <span className={`flex h-2.5 w-2.5 rounded-full ${statusColor} ${p.availability_status === "available" ? "pulse-glow" : ""}`} />
              <span className="text-xs font-medium text-white drop-shadow-md">
                {p.availability_status === "available" ? "Available" : p.availability_status === "in_session" ? "In Session" : "Unavailable"}
              </span>
            </div>

            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center rounded-full bg-fcn-accent/90 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                {p.specialty}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
                Dr. {doctor.full_name}
              </h3>
              {p.hospital_name && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{p.hospital_name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-fcn-warning fill-fcn-warning" />
              <span className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                {p.rating_average.toFixed(1)}
              </span>
              <span className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                ({p.rating_count} reviews)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 border-t border-fcn-primary/5 pt-3">
              <div className="flex flex-col items-center">
                <span className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  {p.years_experience}
                </span>
                <span>Exp (yrs)</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  {p.rating_count}+
                </span>
                <span>Patients</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  {p.consultation_fee_etb}
                </span>
                <span>ETB Fee</span>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <Button
              className="w-full group/btn"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/appointments/book?doctor_id=${doctor.id}`);
              }}
            >
              <CalendarPlus className="h-4 w-4" />
              Book Appointment
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
