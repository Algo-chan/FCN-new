import { useEffect, useRef, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";

export interface ModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) => {
  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    setTimeout(() => panelRef.current?.focus(), 0);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          onMouseDown={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className={clsx(
              "w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-[28px] sm:rounded-2xl border-t sm:border border-slate-200/80 bg-white p-6 shadow-2xl outline-none dark:border-white/10 dark:bg-fcn-surface-dark",
              "pb-[max(24px,env(safe-area-inset-bottom))]",
              sizeClasses[size]
            )}
            initial={
              shouldReduceMotion
                ? false
                : { y: "100%", opacity: 0.5 }
            }
            animate={{ y: 0, opacity: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { y: "100%", opacity: 0 }
            }
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 300,
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* Mobile bottom-sheet drag handle */}
            <div className="sm:hidden mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />

            {title || showCloseButton ? (
              <div className="mb-4 flex items-center justify-between gap-4">
                {title ? (
                  <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                    {title}
                  </h2>
                ) : (
                  <div />
                )}
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X className="h-5 w-5" />}
                    onClick={onClose}
                    aria-label="Close"
                    className="h-9 w-9 p-0 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  />
                )}
              </div>
            ) : null}

            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};
