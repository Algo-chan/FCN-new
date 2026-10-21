import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { Check, Heart, MapPin, ClipboardList, X, Plus, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { clsx } from "clsx";

const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const conditionChips = [
  "Type 2 Diabetes",
  "Hypertension",
  "Asthma",
  "Heart Disease",
  "Thyroid Disorder",
  "Arthritis",
  "Depression/Anxiety",
  "Chronic Kidney Disease",
];

const allergyChips = ["Penicillin", "Sulfa drugs", "NSAIDs", "Latex", "Peanuts"];

interface Step1Data {
  date_of_birth: string;
  blood_type: string;
  weight_kg: string;
  height_cm: string;
}

interface Step2Data {
  chronic_conditions: string[];
  known_allergies: string;
}

interface Step3Data {
  home_address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const calcBMI = (weight: number, height: number): { bmi: number; label: string; color: string; badge: string } | null => {
  if (!weight || !height) return null;
  const h = height / 100;
  const bmi = weight / (h * h);
  if (bmi < 18.5) return { bmi, label: "Underweight", color: "#FBBF24", badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  if (bmi < 25) return { bmi, label: "Normal", color: "#10B981", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
  if (bmi < 30) return { bmi, label: "Overweight", color: "#FBBF24", badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  return { bmi, label: "Obese", color: "#F43F5E", badge: "bg-rose-500/10 text-rose-600 border-rose-500/20" };
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { playTransition, playSuccess } = useSound();

  const [step, setStep] = useState(1);
  const [s1, setS1] = useState<Step1Data>({ date_of_birth: "", blood_type: "", weight_kg: "", height_cm: "" });
  const [s2, setS2] = useState<Step2Data>({ chronic_conditions: [], known_allergies: "" });
  const [s3, setS3] = useState<Step3Data>({ home_address: "", emergency_contact_name: "", emergency_contact_phone: "" });
  const [customCondition, setCustomCondition] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");
  const [noneAbove, setNoneAbove] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const particlesRef = useRef<HTMLDivElement>(null);

  const bmiInfo = useMemo(() => {
    const w = parseFloat(s1.weight_kg);
    const h = parseFloat(s1.height_cm);
    return calcBMI(w, h);
  }, [s1.weight_kg, s1.height_cm]);

  const toggleCondition = (cond: string) => {
    setS2((prev) => ({
      ...prev,
      chronic_conditions: prev.chronic_conditions.includes(cond)
        ? prev.chronic_conditions.filter((c) => c !== cond)
        : [...prev.chronic_conditions, cond],
    }));
    setNoneAbove(false);
  };

  const addCustomCondition = () => {
    const val = customCondition.trim();
    if (val && !s2.chronic_conditions.includes(val)) {
      setS2((prev) => ({ ...prev, chronic_conditions: [...prev.chronic_conditions, val] }));
      setCustomCondition("");
    }
  };

  const addCustomAllergy = () => {
    const val = customAllergy.trim();
    if (val) {
      setS2((prev) => ({
        ...prev,
        known_allergies: prev.known_allergies ? `${prev.known_allergies}, ${val}` : val,
      }));
      setCustomAllergy("");
    }
  };

  useEffect(() => {
    playTransition();
  }, [step, playTransition]);

  useEffect(() => {
    if (isComplete && particlesRef.current && !shouldReduceMotion) {
      const colors = ["#14B8A6", "#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6"];
      for (let i = 0; i < 30; i++) {
        const el = document.createElement("div");
        el.style.cssText = `position:absolute;width:${6 + Math.random() * 6}px;height:${6 + Math.random() * 6}px;border-radius:${Math.random() > 0.5 ? "50%" : "2px"};background:${colors[i % colors.length]};left:50%;top:50%`;
        particlesRef.current.appendChild(el);
        gsap.to(el, {
          x: (Math.random() - 0.5) * 600,
          y: (Math.random() - 0.5) * 600,
          rotation: Math.random() * 360,
          opacity: 0,
          duration: 1.8,
          ease: "power2.out",
          delay: i * 0.03,
        });
      }
      setTimeout(() => playSuccess(), 300);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2600);
    }
  }, [isComplete, navigate, playSuccess, shouldReduceMotion]);

  const handleStep1 = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.saveOnboardingStep1({
        date_of_birth: s1.date_of_birth || undefined,
        blood_type: s1.blood_type || undefined,
        weight_kg: s1.weight_kg ? parseFloat(s1.weight_kg) : undefined,
        height_cm: s1.height_cm ? parseFloat(s1.height_cm) : undefined,
      });
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save health profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.saveOnboardingStep2({
        chronic_conditions: noneAbove ? [] : s2.chronic_conditions,
        known_allergies: noneAbove ? "" : s2.known_allergies,
      });
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save conditions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (!s3.home_address.trim() || !s3.emergency_contact_name.trim() || !s3.emergency_contact_phone.trim()) {
      setError("Please fill in all fields before completing onboarding");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authService.saveOnboardingStep3({
        home_address: s3.home_address.trim(),
        emergency_contact_name: s3.emergency_contact_name.trim(),
        emergency_contact_phone: s3.emergency_contact_phone.trim(),
      });
      useAuthStore.getState().setOnboardingCompleted(true);
      setIsComplete(true);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save emergency info");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await authService.skipOnboarding();
      useAuthStore.getState().setOnboardingCompleted(true);
    } catch {
      // ignore — user can still navigate
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <div ref={particlesRef} className="pointer-events-none fixed inset-0 z-50 overflow-hidden" />

      {/* Top Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <img
          src="/logo/fcn-logo-full.png"
          alt="Fast Care Now Logo"
          className="h-8 sm:h-9 w-auto object-contain"
        />
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="pill" />
          {!isComplete && (
            <button
              onClick={handleSkip}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-lg">
          {!isComplete ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-slate-900/90 p-6 sm:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-md">
              {/* Stepper */}
              <div className="mb-6">
                <StepIndicator
                  currentStep={step}
                  totalSteps={3}
                  stepTitles={["Health Profile", "Medical History", "Emergency & Location"]}
                />
              </div>

              <AnimatePresence mode="wait">
                {/* Step 1: Health Profile */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined}
                    animate={{ opacity: 1, x: 0 }}
                    exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined}
                    className="space-y-4"
                  >
                    <div className="text-center mb-4">
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2 shadow-sm">
                        <Heart className="h-6 w-6" />
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        Your Basic Health Profile
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        This information helps doctors provide safer, accurate medical care
                      </p>
                    </div>

                    {error && (
                      <div className="rounded-2xl px-4 py-3 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <label className="col-span-2 block">
                        <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Date of birth
                        </span>
                        <input
                          type="date"
                          value={s1.date_of_birth}
                          onChange={(e) => setS1((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          aria-label="Date of birth"
                        />
                      </label>

                      <div className="col-span-2">
                        <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Blood type
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {bloodTypes.map((bt) => {
                            const isSelected = s1.blood_type === bt;
                            return (
                              <button
                                key={bt}
                                type="button"
                                onClick={() => setS1((prev) => ({ ...prev, blood_type: bt }))}
                                className={clsx(
                                  "h-11 rounded-xl text-xs font-bold transition-all duration-150 select-none",
                                  "hover:scale-[1.02] active:scale-[0.98]",
                                  isSelected
                                    ? "bg-teal-500 text-white shadow-[0_4px_12px_rgba(20,184,166,0.35)]"
                                    : "border border-slate-200 dark:border-white/10 bg-slate-50/50 text-slate-700 dark:bg-white/5 dark:text-slate-300 hover:border-slate-300"
                                )}
                              >
                                {bt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Weight (kg)
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={s1.weight_kg}
                          onChange={(e) => setS1((prev) => ({ ...prev, weight_kg: e.target.value }))}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          placeholder="e.g. 70"
                          aria-label="Weight in kg"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Height (cm)
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={s1.height_cm}
                          onChange={(e) => setS1((prev) => ({ ...prev, height_cm: e.target.value }))}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          placeholder="e.g. 175"
                          aria-label="Height in cm"
                        />
                      </label>
                    </div>

                    {bmiInfo && (
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Body Mass Index (BMI)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            {bmiInfo.bmi.toFixed(1)}
                          </span>
                          <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-bold border", bmiInfo.badge)}>
                            {bmiInfo.label}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="action"
                      onClick={handleStep1}
                      loading={isLoading}
                      className="w-full min-h-[50px] mt-2"
                    >
                      <span>Continue to Medical History</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Medical History */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined}
                    animate={{ opacity: 1, x: 0 }}
                    exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined}
                    className="space-y-4"
                  >
                    <div className="text-center mb-4">
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2 shadow-sm">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        Conditions & Allergies
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Select any existing conditions or known drug/food allergies
                      </p>
                    </div>

                    {error && (
                      <div className="rounded-2xl px-4 py-3 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {error}
                      </div>
                    )}

                    {/* Chronic Conditions */}
                    <div>
                      <span className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Chronic conditions
                      </span>

                      {s2.chronic_conditions.length > 0 && (
                        <div className="mb-2.5 flex flex-wrap gap-1.5">
                          {s2.chronic_conditions.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-300 border border-teal-500/20"
                            >
                              {c}
                              <button
                                type="button"
                                onClick={() => toggleCondition(c)}
                                className="hover:text-rose-500 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {conditionChips.map((cond) => {
                          const isSelected = s2.chronic_conditions.includes(cond);
                          return (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => toggleCondition(cond)}
                              className={clsx(
                                "rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 select-none",
                                isSelected
                                  ? "bg-teal-500 text-white shadow-sm"
                                  : "border border-slate-200 dark:border-white/10 bg-slate-50/50 text-slate-700 dark:bg-white/5 dark:text-slate-300 hover:border-slate-300"
                              )}
                            >
                              {cond}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={customCondition}
                          onChange={(e) => setCustomCondition(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomCondition();
                            }
                          }}
                          className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          placeholder="Add custom condition..."
                          aria-label="Custom condition"
                        />
                        <button
                          type="button"
                          onClick={addCustomCondition}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm hover:brightness-105 active:scale-95 transition-all"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Allergies */}
                    <div>
                      <span className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Known allergies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {allergyChips.map((a) => {
                          const isSelected = s2.known_allergies.includes(a);
                          return (
                            <button
                              key={a}
                              type="button"
                              onClick={() =>
                                setS2((prev) => ({
                                  ...prev,
                                  known_allergies: prev.known_allergies === a ? "" : a,
                                }))
                              }
                              className={clsx(
                                "rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 select-none",
                                isSelected
                                  ? "bg-rose-500 text-white shadow-sm"
                                  : "border border-slate-200 dark:border-white/10 bg-slate-50/50 text-slate-700 dark:bg-white/5 dark:text-slate-300 hover:border-slate-300"
                              )}
                            >
                              {a}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={customAllergy}
                          onChange={(e) => setCustomAllergy(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomAllergy();
                            }
                          }}
                          className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          placeholder="Add custom allergy..."
                          aria-label="Custom allergy"
                        />
                        <button
                          type="button"
                          onClick={addCustomAllergy}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm hover:brightness-105 active:scale-95 transition-all"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={noneAbove}
                        onChange={(e) => {
                          setNoneAbove(e.target.checked);
                          if (e.target.checked) {
                            setS2((prev) => ({ ...prev, chronic_conditions: [], known_allergies: "" }));
                          }
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-semibold">I have no known chronic conditions or allergies</span>
                    </label>

                    <div className="flex gap-2.5 pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => setStep(1)}
                        className="flex-1 min-h-[48px]"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        <span>Back</span>
                      </Button>
                      <Button
                        variant="action"
                        onClick={handleStep2}
                        loading={isLoading}
                        className="flex-1 min-h-[48px]"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Location & Emergency Contact */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined}
                    animate={{ opacity: 1, x: 0 }}
                    exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined}
                    className="space-y-4"
                  >
                    <div className="text-center mb-4">
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2 shadow-sm">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        Reach You When It Matters
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        For home visits, emergency dispatches, and hospital coordination
                      </p>
                    </div>

                    {error && (
                      <div className="rounded-2xl px-4 py-3 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {error}
                      </div>
                    )}

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Home address
                      </span>
                      <textarea
                        value={s3.home_address}
                        onChange={(e) => setS3((prev) => ({ ...prev, home_address: e.target.value }))}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        placeholder="House no, Woreda/Kebele, Landmark (e.g. Near Dire Dawa University)..."
                        aria-label="Home address"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Emergency contact name
                        </span>
                        <input
                          type="text"
                          value={s3.emergency_contact_name}
                          onChange={(e) => setS3((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          placeholder="Family member / Friend"
                          aria-label="Emergency contact name"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Emergency phone
                        </span>
                        <input
                          type="tel"
                          value={s3.emergency_contact_phone}
                          onChange={(e) => setS3((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          placeholder="+251 91X XXX XXX"
                          aria-label="Emergency contact phone"
                        />
                      </label>
                    </div>

                    <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-3.5 text-xs text-teal-800 dark:text-teal-300">
                      ℹ️ This information is strictly encrypted and shared only with your treating clinicians during active consultations or emergencies.
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => setStep(2)}
                        className="flex-1 min-h-[48px]"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        <span>Back</span>
                      </Button>
                      <Button
                        variant="action"
                        onClick={handleStep3}
                        loading={isLoading}
                        className="flex-1 min-h-[48px]"
                      >
                        <span>Complete Profile</span>
                        <Check className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Pattern #9 Celebration Success Screen */
            <motion.div
              initial={!shouldReduceMotion ? { scale: 0.9, opacity: 0 } : undefined}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-3xl border border-emerald-500/30 bg-white/95 dark:border-emerald-500/20 dark:bg-slate-900/90 p-8 text-center shadow-[0_16px_48px_rgba(16,185,129,0.2)] backdrop-blur-md"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white mb-5 shadow-[0_8px_24px_rgba(16,185,129,0.4)] animate-bounce">
                <Check className="h-10 w-10 stroke-[3]" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                You're All Set!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed mb-6">
                Welcome to Fast Care Now. Your health profile has been saved. Taking you to your dashboard...
              </p>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Redirecting in a moment...</span>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OnboardingPage;
