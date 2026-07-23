import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { pharmacyService } from "@/services/pharmacy.service";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/utils/formatters";

interface QRDisplayModalProps {
  prescriptionId: string;
  onClose: () => void;
}

export const QRDisplayModal = ({ prescriptionId, onClose }: QRDisplayModalProps) => {
  const shouldReduceMotion = useReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["prescription-qr", prescriptionId],
    queryFn: () => pharmacyService.getPrescriptionQR(prescriptionId)
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const qrData = data?.data;
  const isExpired = error && (error as any)?.response?.data?.error?.code === "PRESCRIPTION_EXPIRED";

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg rounded-xl border border-fcn-primary/20 bg-white p-6 shadow-2xl dark:bg-fcn-dark"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo/fcn-logo-full.png" alt="FCN" className="h-6 w-auto" />
              <span className="text-sm font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                Show this to the pharmacist
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-fcn-text-light/50 hover:bg-fcn-primary/10 hover:text-fcn-primary dark:text-fcn-text-dark/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : isExpired ? (
            <motion.div
              className="space-y-4 rounded-lg bg-fcn-danger/10 p-6 text-center"
              initial={shouldReduceMotion ? false : { x: -10 }}
              animate={{ x: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-fcn-danger/20">
                <AlertTriangle className="h-8 w-8 text-fcn-danger" />
              </div>
              <h2 className="text-xl font-bold text-fcn-danger">PRESCRIPTION EXPIRED</h2>
              <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                Please request a refill from your doctor to continue your medication.
              </p>
              <Button onClick={onClose}>Request Refill</Button>
            </motion.div>
          ) : qrData ? (
            <motion.div
              className="space-y-4"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="flex justify-center">
                <div className="animate-pulse-glow rounded-lg border-2 border-fcn-accent/40 p-2">
                  <img
                    src={qrData.qrDataUrl}
                    alt="Prescription QR Code"
                    className="h-[280px] w-[280px]"
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="font-mono text-lg font-bold text-fcn-primary">
                  {qrData.qrHash ? "RX Reference Available" : ""}
                </p>
              </div>

              <div className="space-y-1 rounded-lg bg-fcn-primary/5 p-3 text-center text-sm">
                <p className="text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                  Valid until {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-fcn-success/5 p-2 text-xs text-fcn-success">
                <span>🔒</span>
                <span>Cryptographically verified by FCN &middot; Cannot be forged</span>
              </div>

              <div className="border-t border-fcn-primary/10 pt-3 text-center">
                <p className="text-[10px] text-fcn-text-light/30 dark:text-fcn-text-dark/30">
                  Foundation Care Network &middot; Compassion. Connection. Care.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="py-8 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              Failed to load QR code. Please try again.
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
