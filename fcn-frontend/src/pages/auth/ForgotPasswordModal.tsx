import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { CheckCircle, Loader2, Mail, Lock, KeyRound } from "lucide-react";
import { authService } from "@/services/auth.service";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSound } from "@/hooks/useSound";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "email" | "otp" | "reset" | "success";
type OtpDigits = [string, string, string, string, string, string];

const VITE_NODE_ENV = import.meta.env.MODE;

export const ForgotPasswordModal = ({ isOpen, onClose }: Props) => {
  const shouldReduceMotion = useReducedMotion();
  const { playSuccess } = useSound();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<OtpDigits>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const checkRef = useRef<SVGPathElement>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("email");
        setEmail("");
        setOtp(["", "", "", "", "", ""]);
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === "otp") {
      otpRefs.current[0]?.focus();
    }
    if (step === "success" && checkRef.current) {
      gsap.fromTo(checkRef.current, { strokeDasharray: 100, strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" });
      setTimeout(() => { playSuccess(); onClose(); }, 2000);
    }
  }, [step, playSuccess, onClose]);

  const handleSendOTP = async () => {
    if (!email.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setError(null);
    setIsLoading(true);
    try {
      await authService.verifyOTP(email, code);
      setStep("reset");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Invalid OTP");
      setShakeKey((k) => k + 1);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const code = otp.join("");
    setError(null);
    setIsLoading(true);
    try {
      await authService.resetPassword(email, code, newPassword);
      setStep("success");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setOtp((prev) => {
      const next = [...prev] as OtpDigits;
      next[index] = value;
      return next;
    });
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const renderStep = () => {
    switch (step) {
      case "email":
        return (
          <motion.div key="email" initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined} animate={{ opacity: 1, x: 0 }} exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined} className="space-y-4">
            <div className="flex justify-center"><Mail className="h-10 w-10 text-fcn-primary" /></div>
            <p className="text-center text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">Enter your email to receive a password reset code</p>
            {error && <p className="rounded-md bg-fcn-danger/10 px-3 py-2 text-sm text-fcn-danger">{error}</p>}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark" placeholder="you@example.com" aria-label="Email" />
            </label>
            {VITE_NODE_ENV === "development" && <p className="text-xs text-fcn-accent">DEV: Check console for OTP</p>}
            <Button onClick={handleSendOTP} loading={isLoading} className="w-full">Send OTP</Button>
          </motion.div>
        );

      case "otp":
        return (
          <motion.div key="otp" initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined} animate={{ opacity: 1, x: 0 }} exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined} className="space-y-4">
            <div className="flex justify-center"><KeyRound className="h-10 w-10 text-fcn-primary" /></div>
            <p className="text-center text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">Enter the 6-digit code sent to {email}</p>
            {error && <motion.p key={shakeKey} animate={shouldReduceMotion ? {} : { x: [0, -8, 8, -6, 6, 0] }} transition={{ duration: 0.35 }} className="rounded-md bg-fcn-danger/10 px-3 py-2 text-sm text-center text-fcn-danger">{error}</motion.p>}
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} className="h-12 w-10 rounded-md border border-fcn-primary/20 bg-white text-center text-lg font-bold text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark" aria-label={`OTP digit ${i + 1}`} />
              ))}
            </div>
            {VITE_NODE_ENV === "development" && <p className="text-center text-xs text-fcn-accent">DEV: Check console for OTP</p>}
            <Button onClick={handleVerifyOTP} loading={isLoading} className="w-full">Verify</Button>
          </motion.div>
        );

      case "reset":
        return (
          <motion.div key="reset" initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined} animate={{ opacity: 1, x: 0 }} exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined} className="space-y-4">
            <div className="flex justify-center"><Lock className="h-10 w-10 text-fcn-primary" /></div>
            <p className="text-center text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">Choose a new password</p>
            {error && <p className="rounded-md bg-fcn-danger/10 px-3 py-2 text-sm text-fcn-danger">{error}</p>}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">New password</span>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark" placeholder="Min 8 chars, 1 number, 1 uppercase" aria-label="New password" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Confirm password</span>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark" placeholder="Re-enter password" aria-label="Confirm password" />
            </label>
            <Button onClick={handleReset} loading={isLoading} className="w-full">Reset Password</Button>
          </motion.div>
        );

      case "success":
        return (
          <motion.div key="success" initial={!shouldReduceMotion ? { opacity: 0, scale: 0.9 } : undefined} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center">
            <svg className="mx-auto h-16 w-16" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="28" stroke="#10B981" strokeWidth="3" />
              <path ref={checkRef} d="M18 30l8 8 16-16" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <p className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">Password reset successful!</p>
            <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">Closing...</p>
          </motion.div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={step === "email" ? "Forgot Password" : step === "otp" ? "Verify Code" : step === "reset" ? "New Password" : "Success"} size="sm">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </Modal>
  );
};