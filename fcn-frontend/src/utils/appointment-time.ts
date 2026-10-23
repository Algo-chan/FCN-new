import { format, parseISO, differenceInMinutes, differenceInSeconds } from "date-fns";
import type { AppointmentStatus } from "@/types";

export interface AppointmentTimeInfo {
  canJoin: boolean;
  state: "open" | "in_session" | "too_early" | "expired" | "not_eligible";
  opensAt: Date;
  closedAt: Date;
  scheduledAt: Date;
  secondsUntilOpen: number;
  minutesUntilOpen: number;
  label: string;
  badgeVariant: "success" | "warning" | "danger" | "info" | "neutral";
  helperText: string;
}

const EARLY_BUFFER_MINUTES = 10;
const LATE_GRACE_MINUTES = 30;

export function getAppointmentTimeInfo(
  scheduledAtInput: string | Date,
  durationMinutes: number = 30,
  status: AppointmentStatus = "confirmed",
  isDoctor: boolean = false
): AppointmentTimeInfo {
  const scheduledDate =
    typeof scheduledAtInput === "string" ? parseISO(scheduledAtInput) : scheduledAtInput;
  const now = new Date();

  const opensAt = new Date(scheduledDate.getTime() - EARLY_BUFFER_MINUTES * 60 * 1000);
  const closedAt = new Date(
    scheduledDate.getTime() + (durationMinutes + LATE_GRACE_MINUTES) * 60 * 1000
  );

  const secondsUntilOpen = differenceInSeconds(opensAt, now);
  const minutesUntilOpen = differenceInMinutes(opensAt, now);

  // If already marked completed or cancelled
  if (status === "completed") {
    return {
      canJoin: false,
      state: "not_eligible",
      opensAt,
      closedAt,
      scheduledAt: scheduledDate,
      secondsUntilOpen: 0,
      minutesUntilOpen: 0,
      label: "Completed",
      badgeVariant: "success",
      helperText: "Consultation concluded"
    };
  }

  if (status === "cancelled") {
    return {
      canJoin: false,
      state: "not_eligible",
      opensAt,
      closedAt,
      scheduledAt: scheduledDate,
      secondsUntilOpen: 0,
      minutesUntilOpen: 0,
      label: "Cancelled",
      badgeVariant: "danger",
      helperText: "Appointment was cancelled"
    };
  }

  // If status is in_session, room is actively running
  if (status === "in_session") {
    return {
      canJoin: true,
      state: "in_session",
      opensAt,
      closedAt,
      scheduledAt: scheduledDate,
      secondsUntilOpen: 0,
      minutesUntilOpen: 0,
      label: "In Session Now",
      badgeVariant: "success",
      helperText: "Consultation is currently active"
    };
  }

  // Not confirmed yet (e.g. pending payment or doctor acceptance)
  if (status === "pending") {
    return {
      canJoin: false,
      state: "not_eligible",
      opensAt,
      closedAt,
      scheduledAt: scheduledDate,
      secondsUntilOpen,
      minutesUntilOpen,
      label: "Pending Confirmation",
      badgeVariant: "warning",
      helperText: "Appointment pending doctor confirmation"
    };
  }

  // Check if current time is BEFORE the 10-minute early buffer
  if (now < opensAt) {
    let helper = `Opens 10 min before at ${format(opensAt, "h:mm a")}`;
    if (minutesUntilOpen > 24 * 60) {
      const days = Math.floor(minutesUntilOpen / (24 * 60));
      helper = `Starts in ${days} day${days > 1 ? "s" : ""} (${format(scheduledDate, "MMM d, h:mm a")})`;
    } else if (minutesUntilOpen > 60) {
      const hours = Math.floor(minutesUntilOpen / 60);
      const mins = minutesUntilOpen % 60;
      helper = `Opens in ${hours}h ${mins > 0 ? `${mins}m` : ""} (at ${format(opensAt, "h:mm a")})`;
    } else {
      helper = `Opens in ${Math.max(1, minutesUntilOpen)} minutes (at ${format(opensAt, "h:mm a")})`;
    }

    return {
      canJoin: isDoctor, // Doctors can preview files early; patients wait for the window
      state: "too_early",
      opensAt,
      closedAt,
      scheduledAt: scheduledDate,
      secondsUntilOpen,
      minutesUntilOpen,
      label: isDoctor ? "Review Patient Early" : `Opens ${format(opensAt, "h:mm a")}`,
      badgeVariant: "info",
      helperText: helper
    };
  }

  // Check if current time is WITHIN the allowed window
  if (now >= opensAt && now <= closedAt) {
    return {
      canJoin: true,
      state: "open",
      opensAt,
      closedAt,
      scheduledAt: scheduledDate,
      secondsUntilOpen: 0,
      minutesUntilOpen: 0,
      label: "Join Consultation Now",
      badgeVariant: "success",
      helperText: "Consultation window is open! You may enter the room."
    };
  }

  // Time has passed the grace period
  return {
    canJoin: false,
    state: "expired",
    opensAt,
    closedAt,
    scheduledAt: scheduledDate,
    secondsUntilOpen: 0,
    minutesUntilOpen: 0,
    label: "Session Window Closed",
    badgeVariant: "neutral",
    helperText: "The scheduled consultation time has expired."
  };
}
