import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, action, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="block w-full">
        {label ? (
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor={inputId} className="text-xs sm:text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              {label}
            </label>
            {action}
          </div>
        ) : null}
        <div className="relative">
          {icon ? (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {icon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                "h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-fcn-text-light outline-none transition placeholder:text-slate-400 focus:border-fcn-primary focus:ring-4 focus:ring-fcn-primary/15 dark:border-white/10 dark:bg-fcn-surface-dark dark:text-fcn-text-dark dark:placeholder:text-slate-500 dark:focus:border-fcn-primary-light",
                icon && "pl-11",
                error && "border-fcn-danger focus:border-fcn-danger focus:ring-fcn-danger/20",
                className
              )
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {error ? (
          <span id={inputId ? `${inputId}-error` : undefined} className="mt-1.5 block text-xs font-medium text-fcn-danger">
            {error}
          </span>
        ) : helperText ? (
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
