import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { AlertTriangle, X, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { profileService } from "@/services/profile.service";

interface Props {
  fullName: string;
  onCancel: () => void;
}

const DELETION_REASONS = [
  "Found a better service",
  "Privacy concerns",
  "Too expensive",
  "Technical issues",
  "No longer need it",
  "Other"
];

const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 })
};

export const AccountDeletionFlow = ({ fullName, onCancel }: Props) => {
  const shouldReduceMotion = useReducedMotion();
  const { playNotification, playSuccess, playTransition } = useSound();
  const { addToast } = useNotifications();
  const logout = useAuthStore((s) => s.logout);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [direction, setDirection] = useState(0);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [deletionToken, setDeletionToken] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailHint, setEmailHint] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownNumRef = useRef<HTMLSpanElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  const goTo = (newStep: 1 | 2 | 3 | 4 | 5, dir: number) => {
    setDirection(dir);
    setStep(newStep);
  };

  // Step 1: warning shake
  useEffect(() => {
    if (step === 1) {
      const el = document.getElementById("deletion-warning-icon");
      if (el && !shouldReduceMotion) {
        gsap.to(el, { x: [-8, 8, -6, 6, -4, 4, 0] as any, duration: 0.6, ease: "power2.out" });
      }
    }
  }, [step, shouldReduceMotion]);

  // Step 3: auto-send OTP on mount
  useEffect(() => {
    if (step === 3) {
      handleInitiateDelete();
    }
  }, [step]);

  // Step 3: resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
      return () => clearInterval(t);
    }
  }, [resendTimer]);

  // Step 4: countdown
  useEffect(() => {
    if (step === 4) {
      setCountdown(10);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            handleFinalDelete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [step]);

  // GSAP countdown number animation
  useEffect(() => {
    if (step === 4 && countdownNumRef.current && !shouldReduceMotion) {
      gsap.fromTo(countdownNumRef.current, { scale: 1.2 }, { scale: 1, duration: 0.3, ease: "power2.out" });
    }

    if (circleRef.current) {
      const circumference = 2 * Math.PI * 56;
      const offset = circumference - (countdown / 10) * circumference;
      gsap.to(circleRef.current, { strokeDashoffset: offset, duration: 0.3, ease: "power2.out" });
    }
  }, [countdown, step, shouldReduceMotion]);

  // Step 5: auto-logout
  useEffect(() => {
    if (step === 5) {
      setTimeout(() => {
        logout();
        window.location.href = "/";
      }, 3000);
    }
  }, [step, logout]);

  const handleInitiateDelete = async () => {
    playNotification();
    try {
      const res = await profileService.initiateDelete();
      setEmailHint(res.data?.email_hint ?? "");
      setResendTimer(60);
    } catch (err: any) {
      addToast({ type: "danger", title: err?.response?.data?.error?.message ?? "Failed to initiate deletion" });
    }
  };

  const handleVerifyName = () => {
    if (nameInput !== fullName) {
      setNameError(true);
      setShakeKey((k) => k + 1);
      setTimeout(() => setNameError(false), 1000);
      return;
    }
    goTo(3, 1);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < 5) {
      const el = document.querySelector<HTMLInputElement>(`input[data-del-otp="${index + 1}"]`);
      el?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const el = document.querySelector<HTMLInputElement>(`input[data-del-otp="${index - 1}"]`);
      el?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) return;
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await profileService.confirmDeleteOTP(code);
      setDeletionToken(res.data?.deletion_token ?? "");
      playTransition();
      goTo(4, 1);
    } catch (err: any) {
      setOtpError(err?.response?.data?.error?.message ?? "Invalid OTP");
      setShakeKey((k) => k + 1);
      setOtpDigits(["", "", "", "", "", ""]);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleFinalDelete = async () => {
    if (!deletionToken) return;
    setIsDeleting(true);
    try {
      const reason = selectedReason || deletionReason || undefined;
      await profileService.finalDelete(deletionToken, reason);
      goTo(5, 1);
    } catch (err: any) {
      addToast({ type: "danger", title: err?.response?.data?.error?.message ?? "Deletion failed. Please restart." });
      goTo(1, -1);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    playSuccess();
    addToast({ type: "success", title: "Deletion cancelled. Your account is safe." });
    goTo(1, -1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-fcn-dark/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0.96 }}
        animate={{ scale: 1 }}
        className="w-full max-w-lg rounded-lg border border-fcn-primary/20 bg-white p-6 shadow-xl dark:bg-fcn-dark"
      >
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={stepVariants}
              initial={shouldReduceMotion ? false : "enter"}
              animate="center"
              exit={shouldReduceMotion ? undefined : "exit"}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div id="deletion-warning-icon" className="flex justify-center">
                <div className="rounded-full bg-fcn-danger/10 p-4">
                  <AlertTriangle className="h-10 w-10 text-fcn-danger" />
                </div>
              </div>
              <h2 className="text-center text-xl font-bold text-fcn-danger">Delete Your FCN Account</h2>

              <div className="rounded-lg bg-fcn-danger/5 border border-fcn-danger/10 p-4 space-y-2">
                <p className="text-sm font-medium text-fcn-danger">What you will lose:</p>
                <ul className="space-y-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                  <li className="flex items-center gap-2"><span className="text-fcn-danger">✕</span> Access to all consultations</li>
                  <li className="flex items-center gap-2"><span className="text-fcn-danger">✕</span> Appointment history</li>
                  <li className="flex items-center gap-2"><span className="text-fcn-danger">✕</span> Connected doctors</li>
                  <li className="flex items-center gap-2"><span className="text-fcn-danger">✕</span> Prescription access via app</li>
                </ul>
              </div>

              <div className="rounded-lg bg-fcn-primary/5 border border-fcn-primary/10 p-4">
                <p className="text-sm font-medium text-fcn-primary">What we keep (required by law):</p>
                <ul className="mt-1 space-y-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                  <li className="flex items-center gap-2"><span className="text-fcn-primary">✓</span> Anonymized medical records</li>
                  <li className="flex items-center gap-2"><span className="text-fcn-primary">✓</span> Prescription records</li>
                  <li className="flex items-center gap-2"><span className="text-fcn-primary">✓</span> Lab results</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={onCancel} className="w-full">Cancel — Keep My Account</Button>
                <Button variant="ghost" onClick={() => goTo(2, 1)} className="w-full text-fcn-danger">
                  I understand, continue →
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={stepVariants}
              initial={shouldReduceMotion ? false : "enter"}
              animate="center"
              exit={shouldReduceMotion ? undefined : "exit"}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <div className="rounded-full bg-fcn-primary/10 p-3">
                  <X className="h-8 w-8 text-fcn-primary" />
                </div>
              </div>
              <h2 className="text-center text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">Type your full name to continue</h2>

              <motion.div
                key={shakeKey}
                animate={shouldReduceMotion ? {} : nameError ? { x: [0, -8, 8, -6, 6, 0] } : {}}
                transition={{ duration: 0.35 }}
              >
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setNameError(false); }}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyName()}
                  placeholder={`Type: ${fullName}`}
                  className={`h-12 w-full rounded-md border px-3 text-center text-lg font-medium text-fcn-text-light outline-none dark:bg-fcn-dark dark:text-fcn-text-dark ${
                    nameError ? "border-fcn-danger" : "border-fcn-primary/20 focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30"
                  }`}
                />
              </motion.div>

              {nameError && <p className="text-center text-sm text-fcn-danger">Name doesn't match. Try again.</p>}

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => goTo(1, -1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={handleVerifyName} disabled={nameInput !== fullName} className="flex-1">Continue →</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={stepVariants}
              initial={shouldReduceMotion ? false : "enter"}
              animate="center"
              exit={shouldReduceMotion ? undefined : "exit"}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <div className="rounded-full bg-fcn-primary/10 p-3">
                  <AlertTriangle className="h-8 w-8 text-fcn-primary" />
                </div>
              </div>
              <h2 className="text-center text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">Confirm Your Identity</h2>
              <p className="text-center text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                We sent a confirmation code to {emailHint || "your email"}
              </p>

              {otpError && (
                <motion.p
                  key={shakeKey}
                  animate={shouldReduceMotion ? {} : { x: [0, -8, 8, -6, 6, 0] }}
                  transition={{ duration: 0.35 }}
                  className="rounded-md bg-fcn-danger/10 px-3 py-2 text-sm text-center text-fcn-danger"
                >
                  {otpError}
                </motion.p>
              )}

              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    data-del-otp={i}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="h-12 w-10 rounded-md border border-fcn-primary/20 bg-white text-center text-lg font-bold text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark"
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <span className="text-xs text-fcn-text-light/40">Resend code in {resendTimer}s</span>
                ) : (
                  <button onClick={handleInitiateDelete} className="text-xs text-fcn-primary hover:underline">Resend code</button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => goTo(2, -1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={handleVerifyOTP} loading={verifyingOtp} className="flex-1">Verify →</Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={stepVariants}
              initial={shouldReduceMotion ? false : "enter"}
              animate="center"
              exit={shouldReduceMotion ? undefined : "exit"}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-sm font-medium text-fcn-danger">Your account will be permanently deleted in:</p>
                <div className="relative mx-auto mt-4 h-32 w-32">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(248,113,113,0.15)" strokeWidth="6" />
                    <circle
                      ref={circleRef}
                      cx="64" cy="64" r="56"
                      fill="none"
                      stroke="#F87171"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 56}
                      strokeDashoffset={0}
                    />
                  </svg>
                  <span
                    ref={countdownNumRef}
                    className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-fcn-danger"
                  >
                    {countdown}
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Help us improve — why are you leaving? (Optional)</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {DELETION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason(selectedReason === reason ? "" : reason)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition border ${
                        selectedReason === reason
                          ? "bg-fcn-primary/10 text-fcn-primary border-fcn-primary/30"
                          : "bg-transparent text-fcn-text-light/60 dark:text-fcn-text-dark/60 border-fcn-primary/10"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                {selectedReason === "Other" && (
                  <textarea
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    placeholder="Tell us more..."
                    rows={2}
                    className="w-full rounded-md border border-fcn-primary/20 bg-white px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark resize-none"
                  />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCancelDeletion}
                  className="w-full animate-pulse border-2 border-fcn-accent bg-fcn-accent/10 text-fcn-accent hover:bg-fcn-accent/20"
                >
                  CANCEL — Stop Deletion
                </Button>
                <p className="text-center text-xs text-fcn-text-light/40">Your account is safe until the countdown reaches 0</p>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              custom={direction}
              variants={stepVariants}
              initial={shouldReduceMotion ? false : "enter"}
              animate="center"
              exit={shouldReduceMotion ? undefined : "exit"}
              transition={{ duration: 0.3 }}
              className="space-y-4 text-center"
            >
              <div className="flex justify-center">
                <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                  <CheckCircle className="h-10 w-10 text-gray-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Account Deleted</h2>
              <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                Your account has been successfully deleted. Thank you for using FCN.
              </p>
              <p className="text-sm text-fcn-text-light/40 dark:text-fcn-text-dark/40">We're sorry to see you go.</p>
              <img src="/logo/fcn-logo-full.png" alt="FCN" className="mx-auto h-8 opacity-50" />
              <p className="text-xs text-fcn-text-light/30 dark:text-fcn-text-dark/30">Redirecting...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
