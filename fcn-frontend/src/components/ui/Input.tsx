import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="block">
        {label ? (
          <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">{label}</span>
        ) : null}
        <span className="relative block">
          {icon ? <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fcn-primary">{icon}</span> : null}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                "h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm text-fcn-text-light outline-none transition placeholder:text-fcn-text-light/45 focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark dark:placeholder:text-fcn-text-dark/45",
                icon && "pl-10",
                error && "border-fcn-danger focus:border-fcn-danger focus:ring-fcn-danger/25",
                className
              )
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            {...props}
          />
        </span>
        {error ? (
          <span id={inputId ? `${inputId}-error` : undefined} className="mt-1 block text-sm text-fcn-danger">
            {error}
          </span>
        ) : null}
      </label>
    );
  }
);

Input.displayName = "Input";
