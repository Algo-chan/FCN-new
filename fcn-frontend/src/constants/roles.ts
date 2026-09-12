import type { Role } from "@/types";

export function getRoleDashboard(role: Role): string {
  switch (role) {
    case "hospital_admin":
      return "/hospital-admin";
    case "pharmacy_admin":
      return "/pharmacy-admin";
    case "super_admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}