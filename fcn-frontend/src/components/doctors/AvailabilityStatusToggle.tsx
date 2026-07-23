import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { doctorsService } from "@/services/doctors.service";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { Spinner } from "@/components/ui/Spinner";
import type { AvailabilityStatus } from "@/types";

interface AvailabilityStatusToggleProps {
  currentStatus: AvailabilityStatus;
  doctorId: string;
}

const options: { value: AvailabilityStatus; label: string; activeClass: string; inactiveClass: string }[] = [
  { value: "available", label: "Available", activeClass: "bg-fcn-success text-white", inactiveClass: "text-fcn-success border-fcn-success/30" },
  { value: "in_session", label: "In Session", activeClass: "bg-fcn-warning text-white", inactiveClass: "text-fcn-warning border-fcn-warning/30" },
  { value: "unavailable", label: "Unavailable", activeClass: "bg-fcn-text-light/40 text-white dark:bg-fcn-text-dark/40", inactiveClass: "text-fcn-text-light/50 dark:text-fcn-text-dark/50 border-fcn-text-light/20 dark:border-fcn-text-dark/20" }
];

export const AvailabilityStatusToggle = ({ currentStatus, doctorId }: AvailabilityStatusToggleProps) => {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();

  const mutation = useMutation({
    mutationFn: (status: AvailabilityStatus) => doctorsService.updateAvailabilityStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctor", doctorId] });
      playSuccess();
      addToast({ type: "success", title: "Availability updated" });
    },
    onError: () => {
      addToast({ type: "danger", title: "Failed to update availability" });
    }
  });

  const [activeStatus, setActiveStatus] = useState<AvailabilityStatus>(currentStatus);

  const handleClick = (status: AvailabilityStatus) => {
    if (status === activeStatus || mutation.isPending) return;
    setActiveStatus(status);
    mutation.mutate(status);
  };

  return (
    <div className="relative inline-flex rounded-full border border-fcn-primary/10 bg-fcn-primary/5 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={mutation.isPending}
          onClick={() => handleClick(opt.value)}
          className={clsx(
            "relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200",
            activeStatus === opt.value
              ? opt.activeClass
              : opt.inactiveClass
          )}
        >
          {mutation.isPending && activeStatus === opt.value ? (
            <Spinner size="sm" color="border-current" />
          ) : (
            <span className={clsx("h-2 w-2 rounded-full", {
              "bg-white": activeStatus === opt.value,
              "bg-current": activeStatus !== opt.value
            })} />
          )}
          {opt.label}
          {!shouldReduceMotion && activeStatus === opt.value && (
            <motion.span
              layoutId="availabilityBg"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="absolute inset-0 -z-10 rounded-full"
              style={{ backgroundColor: "inherit" }}
            />
          )}
        </button>
      ))}
    </div>
  );
};
