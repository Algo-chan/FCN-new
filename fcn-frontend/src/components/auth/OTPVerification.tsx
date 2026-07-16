import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CheckCircle, Loader2, Lock, Shield, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface OTPVerificationProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string | null;
  locked?: boolean;
  title?: string;
  subtitle?: string;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;
const MAX_RESENDS = 3;

export const OTPVerification = ({
  email,
  onVerify,
  onResend,
  onBack,
  isLoading = false,
  error = null,
  locked = false,
  title = "Verify your email",
  subtitle = "Enter the 6-digit code sent to"
}: OTPVerificationProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resendCount, setResendCount] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const displayError = error ?? localError;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (locked) return;
      if (!/^\d*$/.test(value)) return;

      const newDigits = [...digits];
      newDigits[index] = value.slice(-1);
      setDigits(newDigits);
      setLocalError(null);

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newDigits.every((d) => d !== "")) {
        onVerify(newDigits.join(""));
      }
    },
    [digits, locked, onVerify]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (locked) return;
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (!pasted) return;

      const newDigits = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      setLocalError(null);

      const nextEmpty = newDigits.findIndex((d) => d === "");
      inputRefs.current[nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty]?.focus();

      if (newDigits.every((d) => d !== "")) {
        onVerify(newDigits.join(""));
      }
    },
    [digits, locked, onVerify]
  );

  const handleResend = async () => {
    if (cooldown > 0 || resendCount >= MAX_RESENDS) return;
    setIsResending(true);
    setLocalError(null);
    try {
      await onResend();
      setResendCount((c) => c + 1);
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch {
      setLocalError("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={!shouldReduceMotion ? { opacity: 0, x: 40 } : undefined}
      animate={{ opacity: 1, x: 0 }}
      exit={!shouldReduceMotion ? { opacity: 0, x: -40 } : undefined}
      className="space-y-5"
    >
      <div className="mb-2 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-fcn-primary/10">
          <Shield className="h-6 w-6 text-fcn-primary" />
        </div>
        <h2 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">{title}</h2>
        <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          {subtitle} <strong className="text-fcn-text-light dark:text-fcn-text-dark">{email}</strong>
        </p>
      </div>

      <AnimatePresence>
        {displayError && (
          <motion.div
            initial={!shouldReduceMotion ? { opacity: 0, y: -8 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            exit={!shouldReduceMotion ? { opacity: 0, y: -8 } : undefined}
            className="flex items-center gap-2 rounded-md bg-fcn-danger/10 px-3 py-2.5 text-sm text-fcn-danger"
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {displayError}
          </motion.div>
        )}
      </AnimatePresence>

      {locked ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fcn-danger/10">
            <Lock className="h-6 w-6 text-fcn-danger" />
          </div>
          <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            Too many failed attempts. Please go back and try again later.
          </p>
          {onBack && (
            <Button variant="secondary" onClick={onBack} className="w-full">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-center gap-2.5">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className={`h-12 w-11 rounded-lg border bg-white text-center text-lg font-bold text-fcn-text-light outline-none transition
                  focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark
                  ${digit ? "border-fcn-accent bg-fcn-accent/5" : "border-fcn-primary/20"}
                  ${isLoading ? "cursor-not-allowed opacity-60" : ""}`}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <Button onClick={() => onVerify(digits.join(""))} loading={isLoading} disabled={digits.some((d) => !d)} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Verify
          </Button>

          <div className="text-center">
            {resendCount >= MAX_RESENDS ? (
              <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Maximum resend limit reached</p>
            ) : cooldown > 0 ? (
              <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                Resend code in <strong>{cooldown}s</strong>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-xs font-medium text-fcn-primary hover:underline disabled:opacity-50"
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            )}
          </div>

          {onBack && (
            <button type="button" onClick={onBack} className="flex w-full items-center justify-center gap-1 text-xs text-fcn-text-light/50 hover:text-fcn-text-light dark:text-fcn-text-dark/50 dark:hover:text-fcn-text-dark">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          )}
        </>
      )}
    </motion.div>
  );
};
