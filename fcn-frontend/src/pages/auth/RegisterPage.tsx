import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, Check, Heart, Loader2, Lock, Mail, MapPin, Shield, Stethoscope, User, UserPlus } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";

type Role = "patient" | "doctor" | "nurse" | "rural_health_officer";

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
  nursing_license_number: string;
  coverage_zone: string;
}

const specialties = ["General", "Cardiology", "Endocrinology", "Pediatrics", "Dermatology", "Orthopedics", "Neurology", "Psychiatry", "Gynecology", "Other"];

const roleCards = [
  { role: "patient" as Role, icon: User, title: "Patient", desc: "Get remote healthcare from home" },
  { role: "doctor" as Role, icon: Stethoscope, title: "Doctor", desc: "Consult patients remotely" },
  { role: "nurse" as Role, icon: Activity, title: "Nurse / Health Worker", desc: "Provide home care services" },
  { role: "rural_health_officer" as Role, icon: MapPin, title: "Rural Health Officer", desc: "Connect rural communities to care" }
];

const calcStrength = (pw: string): { label: string; color: string; width: string } => {
  const score = [/.{8}/, /[A-Z]/, /\d/, /[!@#$%^&*]/].filter((r) => r.test(pw)).length;
  if (!pw) return { label: "", color: "", width: "0%" };
  if (score <= 1) return { label: "Weak", color: "#F87171", width: "25%" };
  if (score === 2) return { label: "Fair", color: "#FBBF24", width: "50%" };
  if (score === 3) return { label: "Good", color: "#2DD4BF", width: "75%" };
  return { label: "Strong", color: "#10B981", width: "100%" };
};

const VITE_API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

const RegisterPage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { playSuccess } = useSound();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    full_name: "", email: "", password: "", confirmPassword: "",
    role: null, license_number: "", specialty: "", years_experience: "",
    hospital_name: "", nursing_license_number: "", coverage_zone: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const pwStrength = useMemo(() => calcStrength(form.password), [form.password]);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep1 = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2) errs.full_name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email required";
    if (form.password.length < 8) errs.password = "At least 8 characters";
    else if (!/[A-Z]/.test(form.password)) errs.password = "Need an uppercase letter";
    else if (!/\d/.test(form.password)) errs.password = "Need a number";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const validateStep2 = useCallback(() => {
    if (!form.role) { setErrors({ role: "Select a role" }); return false; }
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

  const handleSubmit = async () => {
    if (!agreeTerms) { setApiError("You must agree to the terms"); return; }
    setIsSubmitting(true);
    setApiError(null);

    const payload: Record<string, unknown> = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role
    };

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
      const { data: response } = await authService.register(payload);
      const result = response.data;
      if (!result) throw new Error(response.error?.message ?? "Registration failed");

      if (result.accessToken) {
        useAuthStore.getState().login(result.user, { accessToken: result.accessToken, refreshToken: "" });
      }
      playSuccess();

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
    <div className="flex min-h-screen">
      {/* Left Panel - same as login */}
      <div className="relative hidden w-3/5 overflow-hidden bg-gradient-to-br from-fcn-primary to-fcn-dark md:block">
        <div className="absolute inset-0 opacity-[0.03]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="medical-cross" style={{ left: `${(i * 9 + 3) % 100}%`, top: `${(i * 7 + 5) % 100}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + (i % 3)}s` }} />
          ))}
        </div>
        <div className="absolute left-8 top-8 z-10">
          <div className="text-3xl font-extrabold tracking-tight text-white">FCN</div>
          <div className="text-sm font-medium text-white/70">Foundation Care Network</div>
        </div>
        <div className="relative z-10 flex h-full flex-col justify-center px-16 pb-24">
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white">Join FCN Today</h1>
          <p className="max-w-md text-lg text-white/70">Connect with patients, access AI-powered diagnostics, and deliver quality healthcare across Ethiopia.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full items-center justify-center bg-white px-6 dark:bg-fcn-dark md:w-2/5 md:px-10">
        <motion.div initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm">

          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <motion.div layoutId={step === s ? "step" : undefined} className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step > s ? "bg-fcn-accent text-white" : step === s ? "bg-fcn-primary text-white" : "bg-fcn-primary/10 text-fcn-text-light/50 dark:text-fcn-text-dark/50"}`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </motion.div>
                {s < 3 && <span className={`h-0.5 w-8 ${step > s ? "bg-fcn-accent" : "bg-fcn-primary/10"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={!shouldReduceMotion ? { opacity: 0, x: 40 } : undefined} animate={{ opacity: 1, x: 0 }} exit={!shouldReduceMotion ? { opacity: 0, x: -40 } : undefined} className="space-y-4">
                <div className="mb-4 text-center">
                  <h2 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Create your account</h2>
                  <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">Step 1 of 3 — Account info</p>
                </div>

                <a href={`${VITE_API_URL}/auth/google`} className="flex w-full items-center justify-center gap-3 rounded-md border border-fcn-primary/20 bg-white px-4 py-2.5 text-sm font-medium text-fcn-text-light shadow-sm transition hover:shadow-md dark:bg-fcn-dark dark:text-fcn-text-dark">
                  <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Sign up with Google
                </a>

                <div className="flex items-center gap-3"><span className="h-px flex-1 bg-fcn-primary/10" /><span className="text-xs text-fcn-text-light/50">or</span><span className="h-px flex-1 bg-fcn-primary/10" /></div>

                {apiError && <p className="rounded-md bg-fcn-danger/10 px-3 py-2 text-sm text-fcn-danger">{apiError}</p>}

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Full name</span>
                  <span className="relative block">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-primary" />
                    <input type="text" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white pl-10 pr-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark" placeholder="John Doe" aria-label="Full name" />
                  </span>
                  {errors.full_name && <p className="mt-1 text-xs text-fcn-danger">{errors.full_name}</p>}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Email</span>
                  <span className="relative block">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-primary" />
                    <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white pl-10 pr-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark" placeholder="you@example.com" aria-label="Email" />
                  </span>
                  {errors.email && <p className="mt-1 text-xs text-fcn-danger">{errors.email}</p>}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Password</span>
                  <span className="relative block">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-primary" />
                    <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white pl-10 pr-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark" placeholder="••••••••" aria-label="Password" />
                  </span>
                  {form.password && <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-fcn-primary/10"><motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: pwStrength.width, backgroundColor: pwStrength.color }} transition={{ duration: 0.3 }} /></div>}
                  {form.password && <p className="mt-0.5 text-xs" style={{ color: pwStrength.color }}>{pwStrength.label}</p>}
                  {errors.password && <p className="mt-1 text-xs text-fcn-danger">{errors.password}</p>}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Confirm password</span>
                  <input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} autoComplete="new-password" className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark" placeholder="••••••••" aria-label="Confirm password" />
                  {errors.confirmPassword && <p className="mt-1 text-xs text-fcn-danger">{errors.confirmPassword}</p>}
                </label>

                <Button onClick={() => { if (validateStep1()) setStep(2); }} className="w-full">Next</Button>
                <p className="text-center text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Already have an account? <Link to="/login" className="font-medium text-fcn-primary hover:underline">Login</Link></p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={!shouldReduceMotion ? { opacity: 0, x: 40 } : undefined} animate={{ opacity: 1, x: 0 }} exit={!shouldReduceMotion ? { opacity: 0, x: -40 } : undefined} className="space-y-4">
                <div className="mb-2 text-center">
                  <h2 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">I am joining FCN as...</h2>
                  <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">Step 2 of 3 — Select your role</p>
                </div>

                {errors.role && <p className="text-center text-xs text-fcn-danger">{errors.role}</p>}

                <div className="grid grid-cols-2 gap-3">
                  {roleCards.map((card) => (
                    <motion.button key={card.role} type="button" whileHover={shouldReduceMotion ? {} : { scale: 1.03 }} whileTap={shouldReduceMotion ? {} : { scale: 0.98 }} onClick={() => { setForm((prev) => ({ ...prev, role: card.role })); setErrors((prev) => ({ ...prev, role: "" })); }} className={`rounded-lg border-2 p-3 text-left transition ${form.role === card.role ? "border-fcn-accent bg-fcn-accent/5 shadow-[0_0_16px_rgba(45,212,191,0.2)]" : "border-fcn-primary/10 hover:border-fcn-primary/30"}`}>
                      <card.icon className={`mb-1.5 h-6 w-6 ${form.role === card.role ? "text-fcn-accent" : "text-fcn-primary"}`} />
                      <div className={`text-sm font-semibold ${form.role === card.role ? "text-fcn-accent" : "text-fcn-text-light dark:text-fcn-text-dark"}`}>{card.title}</div>
                      <div className="mt-0.5 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">{card.desc}</div>
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {form.role === "doctor" && (
                    <motion.div key="doctor-fields" initial={!shouldReduceMotion ? { height: 0, opacity: 0 } : undefined} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                      <label className="block"><span className="mb-1 block text-sm font-medium">License number</span><input type="text" value={form.license_number} onChange={(e) => update("license_number", e.target.value)} className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark" aria-label="License number" />{errors.license_number && <p className="mt-1 text-xs text-fcn-danger">{errors.license_number}</p>}</label>
                      <label className="block"><span className="mb-1 block text-sm font-medium">Specialty</span><select value={form.specialty} onChange={(e) => update("specialty", e.target.value)} className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark" aria-label="Specialty"><option value="">Select...</option>{specialties.map((s) => <option key={s} value={s}>{s}</option>)}</select>{errors.specialty && <p className="mt-1 text-xs text-fcn-danger">{errors.specialty}</p>}</label>
                      <label className="block"><span className="mb-1 block text-sm font-medium">Years experience</span><input type="number" min="0" value={form.years_experience} onChange={(e) => update("years_experience", e.target.value)} className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark" aria-label="Years experience" /></label>
                      <label className="block"><span className="mb-1 block text-sm font-medium">Hospital name</span><input type="text" value={form.hospital_name} onChange={(e) => update("hospital_name", e.target.value)} className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark" aria-label="Hospital name" /></label>
                    </motion.div>
                  )}

                  {(form.role === "nurse" || form.role === "rural_health_officer") && (
                    <motion.div key="nurse-fields" initial={!shouldReduceMotion ? { height: 0, opacity: 0 } : undefined} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                      <label className="block"><span className="mb-1 block text-sm font-medium">Nursing license number</span><input type="text" value={form.nursing_license_number} onChange={(e) => update("nursing_license_number", e.target.value)} className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark" aria-label="Nursing license number" />{errors.nursing_license_number && <p className="mt-1 text-xs text-fcn-danger">{errors.nursing_license_number}</p>}</label>
                      <label className="block"><span className="mb-1 block text-sm font-medium">Coverage zone</span><input type="text" value={form.coverage_zone} onChange={(e) => update("coverage_zone", e.target.value)} className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark" placeholder='e.g. "Sabian, Kezira"' aria-label="Coverage zone" />{errors.coverage_zone && <p className="mt-1 text-xs text-fcn-danger">{errors.coverage_zone}</p>}</label>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button onClick={() => { if (validateStep2()) setStep(3); }} className="flex-1">Next</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={!shouldReduceMotion ? { opacity: 0, x: 40 } : undefined} animate={{ opacity: 1, x: 0 }} exit={!shouldReduceMotion ? { opacity: 0, x: -40 } : undefined} className="space-y-4">
                <div className="mb-2 text-center">
                  <h2 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Review & Confirm</h2>
                  <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">Step 3 of 3 — Verify your details</p>
                </div>

                {apiError && <p className="rounded-md bg-fcn-danger/10 px-3 py-2 text-sm text-fcn-danger">{apiError}</p>}

                <div className="space-y-2 rounded-lg border border-fcn-primary/10 bg-fcn-light/50 p-4 dark:bg-fcn-dark/50">
                  <div className="flex justify-between text-sm"><span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">Name</span><span className="font-medium">{form.full_name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">Email</span><span className="font-medium">{form.email}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">Role</span><span className="font-medium capitalize">{form.role}</span></div>
                  {form.role === "doctor" && (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">License</span><span className="font-medium">{form.license_number}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">Specialty</span><span className="font-medium">{form.specialty}</span></div>
                    </>
                  )}
                  {(form.role === "nurse" || form.role === "rural_health_officer") && (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">License</span><span className="font-medium">{form.nursing_license_number}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">Zone</span><span className="font-medium">{form.coverage_zone}</span></div>
                    </>
                  )}
                </div>

                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-fcn-primary/30 text-fcn-primary focus:ring-fcn-accent" />
                  <span className="text-fcn-text-light/70 dark:text-fcn-text-dark/70">I agree to FCN Terms of Service and Privacy Policy</span>
                </label>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button onClick={handleSubmit} loading={isSubmitting} className="flex-1">{isSubmitting ? "Creating..." : "Submit"}</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;