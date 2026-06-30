import { CheckCircle, Info, TriangleAlert, XCircle } from "lucide-react";
import { clsx } from "clsx";
import type { ToastMessage } from "@/types";

interface ToastProps {
  toast: ToastMessage;
}

const iconMap = {
  success: CheckCircle,
  warning: TriangleAlert,
  danger: XCircle,
  info: Info
};

const colorMap = {
  success: "text-fcn-success",
  warning: "text-fcn-warning",
  danger: "text-fcn-danger",
  info: "text-fcn-primary"
};

export const Toast = ({ toast }: ToastProps) => {
  const Icon = iconMap[toast.type];

  return (
    <div className="flex w-full max-w-sm gap-3 rounded-lg border border-fcn-primary/15 bg-white p-4 shadow-lg dark:bg-fcn-dark">
      <Icon className={clsx("mt-0.5 h-5 w-5 shrink-0", colorMap[toast.type])} />
      <div>
        <p className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">{toast.title}</p>
        {toast.message ? <p className="mt-1 text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">{toast.message}</p> : null}
      </div>
    </div>
  );
};
