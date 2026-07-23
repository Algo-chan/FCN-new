import { motion, useReducedMotion } from "motion/react";
import type { Role } from "@/types";

interface InitialsAvatarProps {
  name: string;
  size: "sm" | "md" | "lg" | "xl";
  role: Role;
  className?: string;
}

const roleGradients: Record<Role, string> = {
  patient: "from-fcn-primary to-fcn-accent",
  doctor: "from-[#0D1B3E] to-fcn-primary",
  nurse: "from-fcn-warning to-[#F59E0B]",
  rural_health_officer: "from-purple-600 to-purple-800",
  hospital_admin: "from-orange-500 to-orange-700",
  pharmacy_admin: "from-green-500 to-green-700",
  super_admin: "from-red-500 to-red-700"
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl"
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const InitialsAvatar = ({ name, size, role, className = "" }: InitialsAvatarProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`relative overflow-hidden rounded-full bg-gradient-to-br ${roleGradients[role]} ${sizeClasses[size]} flex items-center justify-center font-bold text-white shadow-lg ${className}`}
    >
      <span className="relative z-10">{getInitials(name)}</span>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
    </motion.div>
  );
};
