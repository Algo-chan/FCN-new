import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { Eye, EyeOff, Heart, Lock, Mail, Stethoscope, Syringe, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { useSound } from "@/hooks/useSound";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ForgotPasswordModal } from "@/pages/auth/ForgotPasswordModal";
import { Button } from "@/components/ui/Button";
import { OTPVerification } from "@/components/auth/OTPVerification";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const VITE_API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

const featurePills = [
  { icon: Stethoscope, text: "Remote Consultations" },
  { icon: Heart, text: "AI Symptom Check" },
  { icon: Syringe, text: "E-Prescriptions" }
];

const avatarColors = ["#0D9488", "#0284C7", "#059669"];

const LoginPage = () => {
  usePageMeta({
    title: "Login | Fast Care Now",
    description: "Sign in to your Fast Care Now account to book appointments, access remote consultations, and manage your healthcare.",
    canonical: "https://fcncare.com/login"
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const { playSuccess, playTransition } = useSound();

  const from = (location.state as { from?: string })?.from ?? null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);
  const [googleOnly, setGoogleOnly] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLocked, setOtpLocked] = useState(false);
  const [isOTPLoading, setIsOTPLoading] = useState(false);

  const heartbeatRef = useRef<SVGPathElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    playTransition();

    const token = searchParams.get("accessToken");
    if (token) {
      useAuthStore.getState().setTokens({ accessToken: token, refreshToken: "" });
      authService.getMe().then(({ data }) => {
        const user = data.data;
        if (user) {
          useAuthStore.getState().login(user, { accessToken: token, refreshToken: "" });
          playSuccess();
          redirectUser(user);
        }
      }).catch(() => navigate("/login"));
    }
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;

    if (heartbeatRef.current) {
      const length = heartbeatRef.current.getTotalLength();
      gsap.fromTo(heartbeatRef.current, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" });
    }

    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll(".word");
      gsap.fromTo(words, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power2.out" });
    }
  }, [shouldReduceMotion]);

  const redirectUser = (user: { role: string; status: string }) => {
    if (user.role === "admin" || user.role === "super_admin") {
      navigate("/admin", { replace: true });
    } else if ((user.role === "doctor" || user.role === "nurse" || user.role === "rural_health_officer") && user.status === "pending") {
      navigate("/pending", { replace: true });
    } else {
      authService.getOnboardingStatus().then(({ data }) => {
        if (data.data?.completed) {
          useAuthStore.getState().setOnboardingCompleted(true);
          navigate(from ?? "/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }).catch(() => navigate(from ?? "/dashboard", { replace: true }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data: response } = await authService.login(email, password);
      const payload = response.data;
      if (!payload) {
        throw new Error(response.error?.message ?? "Login failed");
      }

      if ("requiresOTP" in payload && payload.requiresOTP) {
        setOtpEmail(payload.email);
        setRequiresOTP(true);
        setIsLoading(false);
        return;
      }

      const loginPayload = payload as { user: any; accessToken: string };
      useAuthStore.getState().login(loginPayload.user, { accessToken: loginPayload.accessToken, refreshToken: "" });
      playSuccess();
      redirectUser(loginPayload.user);
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === "GOOGLE_ACCOUNT_ONLY") {
        setGoogleOnly(true);
        setError(null);
      } else if (code === "ACCOUNT_SUSPENDED") setError({ type: "danger", message: err?.response?.data?.error?.message ?? "Account suspended" });
      else if (code === "ACCOUNT_REJECTED") setError({ type: "danger", message: err?.response?.data?.error?.message ?? "Account application was rejected" });
      else setError({ type: "danger", message: "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setIsOTPLoading(true);
    setOtpError(null);
    try {
      const { data: response } = await authService.loginVerifyOTP(otpEmail, otp);
      const payload = response.data;
      if (!payload) throw new Error(response.error?.message ?? "Verification failed");

      useAuthStore.getState().login(payload.user, { accessToken: payload.accessToken, refreshToken: "" });
      playSuccess();
      redirectUser(payload.user);
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === "OTP_LOCKED") {
        setOtpLocked(true);
        setOtpError("Too many failed attempts. Please log in again.");
      } else {
        setOtpError(err?.response?.data?.error?.message ?? "Invalid OTP. Please try again.");
      }
    } finally {
      setIsOTPLoading(false);
    }
  };

  const handleResendOTP = async () => {
    await authService.resendOTP(otpEmail, "login");
  };

  const handleBackToLogin = () => {
    setRequiresOTP(false);
    setOtpEmail("");
    setOtpError(null);
    setOtpLocked(false);
    setPassword("");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Brand Panel (Desktop) */}
      <div className="relative hidden w-3/5 overflow-hidden bg-gradient-to-br from-teal-900 via-slate-900 to-sky-950 md:flex flex-col justify-between p-12 lg:p-16 text-white">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/">
            <img
              src="/logo/fcn-logo-full.png"
              alt="Fast Care Now Logo"
              className="h-10 w-auto object-contain brightness-110"
            />
          </Link>
          <LanguageSwitcher variant="pill" />
        </div>

        <div className="relative z-10 my-auto py-8">
          <svg className="mb-6 h-16 w-full max-w-md" viewBox="0 0 400 80" preserveAspectRatio="none">
            <path
              ref={heartbeatRef}
              d="M0,40 L80,40 L100,40 L110,10 L120,70 L135,20 L150,60 L165,30 L180,50 L200,40 L220,40 L240,40 L250,20 L260,60 L275,30 L290,55 L310,10 L325,70 L340,40 L400,40"
              fill="none"
              stroke="#2DD4BF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <h1 ref={headlineRef} className="mb-4 text-4xl lg:text-5xl font-black leading-tight tracking-tight">
            {"Healthcare Without Walls".split(" ").map((word, i) => (
              <span key={i} className="word mr-3 inline-block opacity-0">{word}</span>
            ))}
          </h1>

          <p className="max-w-md text-base text-slate-300 font-medium mb-8 leading-relaxed">
            Direct access to verified doctors, home nurse visits, electronic prescriptions, and AI symptom triage built for Ethiopia.
          </p>

          <div className="flex flex-wrap gap-2.5">
            {featurePills.map((pill, i) => (
              <motion.div
                key={pill.text}
                initial={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: shouldReduceMotion ? 0 : 0.3 + i * 0.15 }}
              >
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold text-teal-300 backdrop-blur-md border border-white/10 shadow-sm">
                  <pill.icon className="h-4 w-4 text-teal-400" /> {pill.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 pt-6 border-t border-white/10">
          <div className="flex -space-x-2">
            {avatarColors.map((color, i) => (
              <div
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-black text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                {["JD", "AK", "MR"][i]}
              </div>
            ))}
          </div>
          <span className="text-xs font-medium text-slate-300">
            Trusted by 50+ doctors and 3 partner hospitals in Ethiopia
          </span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="flex w-full items-center justify-center px-4 sm:px-8 py-10 md:w-2/5">
        <div className="w-full max-w-sm">
          {/* Mobile Top Header */}
          <div className="mb-6 flex items-center justify-between md:hidden">
            <Link to="/">
              <img
                src="/logo/fcn-logo-full.png"
                alt="Fast Care Now Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <LanguageSwitcher variant="pill" />
          </div>

          <motion.div
            initial={!shouldReduceMotion ? { opacity: 0, y: 15 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
            className="rounded-3xl border border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-slate-900/90 p-6 sm:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-md"
          >
            <AnimatePresence mode="wait">
              {!requiresOTP ? (
                <motion.div
                  key="login-form"
                  initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined}
                  animate={{ opacity: 1, x: 0 }}
                  exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined}
                >
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Welcome back
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Sign in to your Fast Care Now account
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={!shouldReduceMotion ? { opacity: 0, y: -10 } : undefined}
                          animate={{ opacity: 1, y: 0 }}
                          exit={!shouldReduceMotion ? { opacity: 0, y: -10 } : undefined}
                          className="rounded-2xl px-4 py-3 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        >
                          {error.message}
                        </motion.div>
                      )}
                      {googleOnly && (
                        <motion.div
                          initial={!shouldReduceMotion ? { opacity: 0, y: -10 } : undefined}
                          animate={{ opacity: 1, y: 0 }}
                          exit={!shouldReduceMotion ? { opacity: 0, y: -10 } : undefined}
                          className="rounded-2xl bg-teal-500/10 border border-teal-500/20 px-4 py-3 text-xs text-teal-700 dark:text-teal-300 font-medium"
                        >
                          <p className="font-bold">This account was created with Google.</p>
                          <p className="mt-1">Please use the Google sign-in option.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Email
                      </span>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600 dark:text-teal-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-teal-400 dark:focus:bg-slate-900"
                          placeholder="you@example.com"
                          aria-label="Email address"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Password
                        </span>
                        <button
                          type="button"
                          onClick={() => setForgotOpen(true)}
                          className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600 dark:text-teal-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-teal-400 dark:focus:bg-slate-900"
                          placeholder="••••••••"
                          aria-label="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </label>

                    <Button
                      type="submit"
                      variant="action"
                      loading={isLoading}
                      className="w-full min-h-[50px] mt-2 shadow-[0_8px_20px_rgba(13,148,136,0.35)]"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </form>

                  <p className="mt-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Register here
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <OTPVerification
                  key="login-otp"
                  email={otpEmail}
                  onVerify={handleVerifyOTP}
                  onResend={handleResendOTP}
                  onBack={otpLocked ? undefined : handleBackToLogin}
                  isLoading={isOTPLoading}
                  error={otpError}
                  locked={otpLocked}
                  title="Two-factor authentication"
                  subtitle="Enter the 6-digit code sent to"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
};

export default LoginPage;
