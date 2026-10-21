import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, Lock, Mail, MapPin, Stethoscope, User, ArrowRight, ArrowLeft } from "lucide-react";
import { authService } from "@/services/auth.service";
import { doctorsService } from "@/services/doctors.service";
import { hospitalsService } from "@/services/hospitals.service";
import { useAuthStore } from "@/store/auth.store";
import { useSound } from "@/hooks/useSound";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/Button";
import { INSTALL_PROMPT_KEY } from "@/components/pwa/InstallPromptBanner";
import { Spinner } from "@/components/ui/Spinner";
import { OTPVerification } from "@/components/auth/OTPVerification";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { clsx } from "clsx";

type Role = "patient" | "doctor" | "nurse" | "rural_health_officer";
type Phase = "account" | "otp" | "role" | "review";

interface FormData {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role | null;
  license_number: string;
  specialty: string;
  years_experience: string;
  hospital_name: string;
  hospital_id: string;
  nursing_license_number: string;
  coverage_zone: string;
}

const roleCards = [
  {
    role: "patient" as Role,
    icon: User,
    title: "Patient",
    desc: "Get remote healthcare from home",
    accent: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10 dark:bg-teal-400/20",
  },
  {
    role: "doctor" as Role,
    icon: Stethoscope,
    title: "Doctor",
    desc: "Consult patients remotely",
    accent: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10 dark:bg-sky-400/20",
  },
  {
    role: "nurse" as Role,
    icon: Activity,
    title: "Nurse / Health Worker",
    desc: "Provide home care services",
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-400/20",
  },
  {
    role: "rural_health_officer" as Role,
    icon: MapPin,
    title: "Rural Health Officer",
    desc: "Connect rural communities to care",
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-400/20",
  },
];

const calcStrength = (pw: string): { label: string; color: string; width: string } => {
  const score = [/.{8}/, /[A-Z]/, /\d/, /[!@#$%^&*]/].filter((r) => r.test(pw)).length;
  if (!pw) return { label: "", color: "", width: "0%" };
  if (score <= 1) return { label: "Weak", color: "#F87171", width: "25%" };
  if (score === 2) return { label: "Fair", color: "#FBBF24", width: "50%" };
  if (score === 3) return { label: "Good", color: "#2DD4BF", width: "75%" };
  return { label: "Strong", color: "#10B981", width: "100%" };
};

const RegisterPage = () => {
  usePageMeta({
    title: "Register | Fast Care Now",
    description: "Create your Fast Care Now account as a patient, doctor, nurse, or rural health officer. Join Ethiopia's platform for immediate, reliable healthcare.",
    canonical: "https://fcncare.com/register",
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const { playSuccess } = useSound();

  const isGoogle = searchParams.get("googleRegister") === "true";
  const googleEmail = searchParams.get("email") || "";
  const googleName = searchParams.get("name") || "";
  const googleId = searchParams.get("googleId") || "";

  const [phase, setPhase] = useState<Phase>(isGoogle ? "role" : "account");
  const [form, setForm] = useState<FormData>({
    full_name: googleName,
    email: googleEmail,
    password: "",
    confirmPassword: "",
    role: null,
    license_number: "",
    specialty: "",
    years_experience: "",
    hospital_name: "",
    hospital_id: "",
    nursing_license_number: "",
    coverage_zone: "",
  });

  const { data: hospitalsResponse, isError: hospitalsError } = useQuery({
    queryKey: ["hospitals", "active"],
    queryFn: () => hospitalsService.getAllHospitals("active"),
    enabled: form.role === "doctor",
  });

  const hospitals = useMemo(() => hospitalsResponse?.data ?? [], [hospitalsResponse]);

  const { data: hospitalSpecialties, isLoading: specialtiesLoading } = useQuery({
    queryKey: ["hospital-specialties", form.hospital_id],
    queryFn: () => doctorsService.getHospitalSpecialties(form.hospital_id),
    enabled: !!form.hospital_id && form.role === "doctor",
  });

  const dynamicSpecialties = useMemo(() => {
    if (hospitalSpecialties && hospitalSpecialties.length > 0) return hospitalSpecialties;
    return null;
  }, [hospitalSpecialties]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLocked, setOtpLocked] = useState(false);
  const [isOTPLoading, setIsOTPLoading] = useState(false);

  const pwStrength = useMemo(() => calcStrength(form.password), [form.password]);

  const currentStepNumber = phase === "account" || phase === "otp" ? 1 : phase === "role" ? 2 : 3;

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep1 = useCallback(() => {
    if (isGoogle) return true;
    const errs: Record<string, string> = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      errs.full_name = "Name must be at least 2 characters";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Valid email required";
    }
    if (form.password.length < 8) {
      errs.password = "At least 8 characters required";
    } else if (!/[A-Z]/.test(form.password)) {
      errs.password = "Need an uppercase letter";
    } else if (!/\d/.test(form.password)) {
      errs.password = "Need a number";
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, isGoogle]);

  const validateStep2 = useCallback(() => {
    if (!form.role) {
      setErrors({ role: "Please select a role to continue" });
      return false;
    }
    const errs: Record<string, string> = {};
    if (form.role === "doctor") {
      if (!form.license_number.trim()) errs.license_number = "License number required";
      if (!form.specialty) errs.specialty = "Specialty required";
    }
    if (form.role === "nurse" || form.role === "rural_health_officer") {
      if (!form.nursing_license_number.trim()) errs.nursing_license_number = "License number required";
      if (!form.coverage_zone.trim()) errs.coverage_zone = "Coverage zone required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const handleSendOTP = async () => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      await authService.registerStep1({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setPhase("otp");
    } catch (err: any) {
      setApiError(err?.response?.data?.error?.message ?? "Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setIsOTPLoading(true);
    setOtpError(null);
    try {
      await authService.verifyRegistrationOTP(form.email.trim(), otp);
      setPhase("role");
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === "OTP_LOCKED") {
        setOtpLocked(true);
        setOtpError("Too many failed attempts. Please go back and try again.");
      } else {
        setOtpError(err?.response?.data?.error?.message ?? "Invalid OTP. Please try again.");
      }
    } finally {
      setIsOTPLoading(false);
    }
  };

  const handleResendOTP = async () => {
    await authService.resendOTP(form.email.trim(), "registration");
  };

  const handleSubmit = async () => {
    if (!agreeTerms) {
      setApiError("You must agree to the terms to complete registration");
      return;
    }
    setIsSubmitting(true);
    setApiError(null);

    const payload: Record<string, unknown> = {
      email: form.email.trim(),
      role: form.role,
    };

    if (isGoogle) {
      payload.googleId = googleId;
      payload.full_name = form.full_name.trim();
    }

    if (form.role === "doctor") {
      payload.license_number = form.license_number.trim();
      payload.specialty = form.specialty;
      payload.years_experience = form.years_experience ? parseInt(form.years_experience) : 0;
      payload.hospital_name = form.hospital_name.trim() || undefined;
    }
    if (form.role === "nurse" || form.role === "rural_health_officer") {
      payload.nursing_license_number = form.nursing_license_number.trim();
      payload.coverage_zone = form.coverage_zone.trim();
    }

    try {
      const apiCall = isGoogle ? authService.registerGoogle : authService.registerStep2;
      const { data: response } = await apiCall(payload);
      const result = response.data;
      if (!result) throw new Error(response.error?.message ?? "Registration failed");

      if (result.accessToken) {
        useAuthStore.getState().login(result.user, { accessToken: result.accessToken, refreshToken: "" });
      } else {
        useAuthStore.getState().setUser(result.user);
      }
      playSuccess();
      localStorage.setItem(INSTALL_PROMPT_KEY, "1");

      if (result.requiresApproval) {
        navigate("/pending", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (err: any) {
      setApiError(err?.response?.data?.error?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Brand Panel (Desktop) */}
      <div className="relative hidden w-3/5 overflow-hidden bg-gradient-to-br from-teal-900 via-slate-900 to-sky-950 md:flex flex-col justify-between p-12 lg:p-16 text-white">
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
          <h1 className="mb-4 text-4xl lg:text-5xl font-black leading-tight tracking-tight">
            Join Fast Care Now Today
          </h1>
          <p className="max-w-md text-base text-slate-300 font-medium mb-8 leading-relaxed">
            Connect with patients, access AI-powered diagnostics, and deliver quality healthcare across Ethiopia.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-400 border-t border-white/10 pt-6">
          © {new Date().getFullYear()} Fast Care Now. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full items-center justify-center px-4 sm:px-8 py-10 md:w-2/5">
        <div className="w-full max-w-md">
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
            className="rounded-3xl border border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-slate-900/90 p-6 sm:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-md"
          >
            {/* Step Indicator */}
            <div className="mb-6">
              <StepIndicator
                currentStep={currentStepNumber}
                totalSteps={3}
                stepTitles={["Account Info", "Role & License", "Review & Confirm"]}
              />
            </div>

            <AnimatePresence mode="wait">
              {phase === "account" && (
                <motion.div
                  key="account"
                  initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined}
                  animate={{ opacity: 1, x: 0 }}
                  exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined}
                  className="space-y-4"
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Create your account
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Enter your name, email and password to begin
                    </p>
                  </div>

                  {apiError && (
                    <div className="rounded-2xl px-4 py-3 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {apiError}
                    </div>
                  )}

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Full name
                    </span>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600 dark:text-teal-400" />
                      <input
                        type="text"
                        value={form.full_name}
                        onChange={(e) => update("full_name", e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-teal-400 dark:focus:bg-slate-900"
                        placeholder="Dr. Abebe Bikila"
                        aria-label="Full name"
                      />
                    </div>
                    {errors.full_name && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.full_name}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Email
                    </span>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600 dark:text-teal-400" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        autoComplete="email"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-teal-400 dark:focus:bg-slate-900"
                        placeholder="you@example.com"
                        aria-label="Email"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Password
                    </span>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600 dark:text-teal-400" />
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        autoComplete="new-password"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-teal-400 dark:focus:bg-slate-900"
                        placeholder="••••••••"
                        aria-label="Password"
                      />
                    </div>
                    {form.password && (
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: pwStrength.width, backgroundColor: pwStrength.color }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                    {form.password && (
                      <p className="mt-0.5 text-xs font-semibold" style={{ color: pwStrength.color }}>
                        {pwStrength.label}
                      </p>
                    )}
                    {errors.password && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.password}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Confirm password
                    </span>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      autoComplete="new-password"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-teal-400 dark:focus:bg-slate-900"
                      placeholder="••••••••"
                      aria-label="Confirm password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{errors.confirmPassword}</p>
                    )}
                  </label>

                  <Button
                    variant="action"
                    onClick={() => {
                      if (validateStep1()) handleSendOTP();
                    }}
                    loading={isSubmitting}
                    className="w-full min-h-[50px] mt-2"
                  >
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>

                  <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Already have an account?{" "}
                    <Link to="/login" className="font-bold text-teal-600 dark:text-teal-400 hover:underline">
                      Login
                    </Link>
                  </p>
                </motion.div>
              )}

              {phase === "otp" && (
                <OTPVerification
                  key="otp"
                  email={form.email.trim()}
                  onVerify={handleVerifyOTP}
                  onResend={handleResendOTP}
                  onBack={() => setPhase("account")}
                  isLoading={isOTPLoading}
                  error={otpError}
                  locked={otpLocked}
                  title="Verify your email"
                  subtitle="Enter the 6-digit code sent to"
                />
              )}

              {phase === "role" && (
                <motion.div
                  key="role"
                  initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined}
                  animate={{ opacity: 1, x: 0 }}
                  exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined}
                  className="space-y-4"
                >
                  <div className="mb-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      I am joining as...
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Select your role on Fast Care Now
                    </p>
                  </div>

                  {errors.role && (
                    <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl">
                      {errors.role}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    {roleCards.map((card) => {
                      const isSelected = form.role === card.role;
                      return (
                        <button
                          key={card.role}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, role: card.role }));
                            setErrors((prev) => ({ ...prev, role: "" }));
                          }}
                          className={clsx(
                            "rounded-2xl border-2 p-3.5 text-left transition-all duration-150 select-none",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            isSelected
                              ? "border-teal-500 bg-teal-500/10 dark:bg-teal-400/20 shadow-[0_4px_16px_rgba(20,184,166,0.25)]"
                              : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02]"
                          )}
                        >
                          <div
                            className={clsx(
                              "w-10 h-10 rounded-xl flex items-center justify-center mb-2",
                              card.bg,
                              card.accent
                            )}
                          >
                            <card.icon className="h-5 w-5" />
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {card.title}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                            {card.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Doctor specific fields */}
                  <AnimatePresence>
                    {form.role === "doctor" && (
                      <motion.div
                        key="doctor-fields"
                        initial={!shouldReduceMotion ? { height: 0, opacity: 0 } : undefined}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 pt-2"
                      >
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            License number
                          </span>
                          <input
                            type="text"
                            value={form.license_number}
                            onChange={(e) => update("license_number", e.target.value)}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            placeholder="e.g. ETH-MD-12345"
                            aria-label="License number"
                          />
                          {errors.license_number && (
                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.license_number}</p>
                          )}
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Hospital affiliation
                          </span>
                          <select
                            value={form.hospital_id}
                            onChange={(e) => {
                              update("hospital_id", e.target.value);
                              const h = hospitals.find((x) => x.id === e.target.value);
                              update("hospital_name", h?.name ?? "");
                              update("specialty", "");
                            }}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            aria-label="Hospital"
                          >
                            <option value="">Select a hospital...</option>
                            {hospitals.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name} — {h.location}
                              </option>
                            ))}
                          </select>
                          {hospitalsError && (
                            <p className="mt-1 text-xs text-rose-500">
                              Couldn't load hospitals. Please refresh and try again.
                            </p>
                          )}
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Specialty
                          </span>
                          {form.hospital_id && specialtiesLoading ? (
                            <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 px-3 dark:border-white/10">
                              <Spinner size="sm" />
                              <span className="text-xs text-slate-500">Loading specialties...</span>
                            </div>
                          ) : dynamicSpecialties && dynamicSpecialties.length > 0 ? (
                            <select
                              value={form.specialty}
                              onChange={(e) => update("specialty", e.target.value)}
                              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                              aria-label="Specialty"
                            >
                              <option value="">Select specialty...</option>
                              {dynamicSpecialties.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          ) : form.hospital_id ? (
                            <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-500 dark:border-white/10">
                              No specialties found for this hospital
                            </div>
                          ) : (
                            <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-500 dark:border-white/10">
                              Select a hospital first
                            </div>
                          )}
                          {errors.specialty && (
                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.specialty}</p>
                          )}
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Years experience
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={form.years_experience}
                            onChange={(e) => update("years_experience", e.target.value)}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            placeholder="e.g. 5"
                            aria-label="Years experience"
                          />
                        </label>
                      </motion.div>
                    )}

                    {/* Nurse / Rural Health Officer specific fields */}
                    {(form.role === "nurse" || form.role === "rural_health_officer") && (
                      <motion.div
                        key="nurse-fields"
                        initial={!shouldReduceMotion ? { height: 0, opacity: 0 } : undefined}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 pt-2"
                      >
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Nursing license number
                          </span>
                          <input
                            type="text"
                            value={form.nursing_license_number}
                            onChange={(e) => update("nursing_license_number", e.target.value)}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            placeholder="e.g. NUR-ET-987"
                            aria-label="Nursing license number"
                          />
                          {errors.nursing_license_number && (
                            <p className="mt-1 text-xs text-rose-500 font-medium">
                              {errors.nursing_license_number}
                            </p>
                          )}
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Coverage zone
                          </span>
                          <input
                            type="text"
                            value={form.coverage_zone}
                            onChange={(e) => update("coverage_zone", e.target.value)}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            placeholder='e.g. "Sabian, Kezira"'
                            aria-label="Coverage zone"
                          />
                          {errors.coverage_zone && (
                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.coverage_zone}</p>
                          )}
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2.5 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => (isGoogle ? navigate("/login") : setPhase("account"))}
                      className="flex-1 min-h-[48px]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      <span>Back</span>
                    </Button>
                    <Button
                      variant="action"
                      onClick={() => {
                        if (validateStep2()) setPhase("review");
                      }}
                      className="flex-1 min-h-[48px]"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {phase === "review" && (
                <motion.div
                  key="review"
                  initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined}
                  animate={{ opacity: 1, x: 0 }}
                  exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined}
                  className="space-y-4"
                >
                  <div className="mb-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Review & Confirm
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Verify your details and agree to terms
                    </p>
                  </div>

                  {apiError && (
                    <div className="rounded-2xl px-4 py-3 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {apiError}
                    </div>
                  )}

                  <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Name</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{form.full_name}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Email</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{form.email}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Role</span>
                      <span className="font-bold capitalize text-teal-600 dark:text-teal-400">
                        {form.role}
                      </span>
                    </div>
                    {form.role === "doctor" && (
                      <>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-slate-500 dark:text-slate-400">License</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {form.license_number}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Specialty</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{form.specialty}</span>
                        </div>
                        {form.hospital_name && (
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Hospital</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {form.hospital_name}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {(form.role === "nurse" || form.role === "rural_health_officer") && (
                      <>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-slate-500 dark:text-slate-400">License</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {form.nursing_license_number}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Zone</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {form.coverage_zone}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>I agree to Fast Care Now's Terms of Service and Privacy Policy</span>
                  </label>

                  <div className="flex gap-2.5 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => setPhase("role")}
                      className="flex-1 min-h-[48px]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      <span>Back</span>
                    </Button>
                    <Button
                      variant="action"
                      onClick={handleSubmit}
                      loading={isSubmitting}
                      className="flex-1 min-h-[48px]"
                    >
                      <span>Complete Account</span>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
