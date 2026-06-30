import { clsx } from "clsx";
import type { Role } from "@/types";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  role: Role;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg"
};

const roleClasses: Record<Role, string> = {
  doctor: "bg-fcn-primary text-white",
  patient: "bg-fcn-accent text-fcn-dark",
  nurse: "bg-fcn-warning text-fcn-dark",
  rural_health_officer: "bg-fcn-success text-white",
  hospital_admin: "bg-fcn-indigo text-white",
  super_admin: "bg-fcn-danger text-white"
};

const initials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const Avatar = ({ name, imageUrl, size = "md", role }: AvatarProps) => {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={clsx("rounded-full object-cover", sizeClasses[size])} />;
  }

  return (
    <span className={clsx("inline-flex items-center justify-center rounded-full font-semibold", sizeClasses[size], roleClasses[role])}>
      {initials(name)}
    </span>
  );
};
