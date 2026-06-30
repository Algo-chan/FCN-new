import { format } from "date-fns";

export const formatDate = (value: string | Date, pattern = "MMM d, yyyy"): string =>
  format(new Date(value), pattern);

export const formatTime = (value: string | Date): string => format(new Date(value), "h:mm a");

export const formatCurrencyETB = (amount: number): string =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2
  }).format(amount);
