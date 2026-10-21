import { clsx } from "clsx";
import { Check } from "lucide-react";

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
  onStepClick?: (step: number) => void;
  className?: string;
}

/**
 * Mobile-First Step Indicator
 * Implements Mobile Style Reference Pattern #4:
 * Step indicators in multi-step forms (for example "Step 2 of 4") with segmented bars and badges.
 */
export const StepIndicator = ({
  currentStep,
  totalSteps,
  stepTitles = [],
  onStepClick,
  className,
}: StepIndicatorProps) => {
  const activeTitle = stepTitles[currentStep - 1];

  return (
    <div
      className={clsx("w-full select-none", className)}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}${activeTitle ? `: ${activeTitle}` : ""}`}
    >
      {/* Mobile & Tablet Header: "Step X of Y" + Title */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
            Step {currentStep} of {totalSteps}
          </span>
          {activeTitle && (
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-none">
              {activeTitle}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>

      {/* Segmented Progress Bars */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${totalSteps}, 1fr)` }}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isClickable = Boolean(onStepClick && stepNumber <= currentStep);

          return (
            <button
              key={stepNumber}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(stepNumber)}
              title={stepTitles[idx] || `Step ${stepNumber}`}
              className={clsx(
                "h-2 sm:h-2.5 rounded-full transition-all duration-300 relative overflow-hidden",
                isCompleted &&
                  "bg-gradient-to-r from-teal-500 to-emerald-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]",
                isCurrent &&
                  "bg-gradient-to-r from-teal-500 to-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.4)] animate-pulse",
                !isCompleted && !isCurrent && "bg-slate-200 dark:bg-slate-700/60",
                isClickable && "cursor-pointer hover:opacity-80"
              )}
            />
          );
        })}
      </div>

      {/* Desktop Stepper Details (shown on md+ when titles are provided) */}
      {stepTitles.length === totalSteps && (
        <div className="hidden md:grid gap-2 mt-2" style={{ gridTemplateColumns: `repeat(${totalSteps}, 1fr)` }}>
          {stepTitles.map((title, idx) => {
            const stepNumber = idx + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div
                key={title}
                className={clsx(
                  "text-xs transition-colors",
                  isCurrent && "font-bold text-teal-600 dark:text-teal-400",
                  isCompleted && "font-medium text-slate-700 dark:text-slate-300",
                  !isCurrent && !isCompleted && "font-normal text-slate-400 dark:text-slate-500"
                )}
              >
                <span className="flex items-center gap-1 truncate">
                  {isCompleted && <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                  {title}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
