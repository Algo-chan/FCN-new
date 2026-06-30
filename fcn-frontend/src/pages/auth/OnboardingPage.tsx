import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { Check, Heart, MapPin, ClipboardList, X, Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";

const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const conditionChips = ["Type 2 Diabetes", "Hypertension", "Asthma", "Heart Disease", "Thyroid Disorder", "Arthritis", "Depression/Anxiety", "Chronic Kidney Disease"];

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

const calcBMI = (weight: number, height: number): { bmi: number; label: string; color: string } | null => {
  if (!weight || !height) return null;
  const h = height / 100;
  const bmi = weight / (h * h);
  if (bmi < 18.5) return { bmi, label: "Underweight", color: "#FBBF24" };
  if (bmi < 25) return { bmi, label: "Normal", color: "#10B981" };
  if (bmi < 30) return { bmi, label: "Overweight", color: "#FBBF24" };
  return { bmi, label: "Obese", color: "#F87171" };
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

  const progressPct = useMemo(() => ((step - 1) / 3) * 100, [step]);

  const toggleCondition = (cond: string) => {
    setS2((prev) => ({
      ...prev,
      chronic_conditions: prev.chronic_conditions.includes(cond)
        ? prev.chronic_conditions.filter((c) => c !== cond)
        : [...prev.chronic_conditions, cond]
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
      setS2((prev) => ({ ...prev, known_allergies: prev.known_allergies ? `${prev.known_allergies}, ${val}` : val }));
      setCustomAllergy("");
    }
  };

  useEffect(() => {
    playTransition();
  }, [step, playTransition]);

  useEffect(() => {
    if (isComplete && particlesRef.current) {
      const colors = ["#2DD4BF", "#0A7EA4", "#10B981", "#FBBF24"];
      for (let i = 0; i < 20; i++) {
        const el = document.createElement("div");
        el.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;background:${colors[i % 4]};left:50%;top:50%`;
        particlesRef.current.appendChild(el);
        gsap.to(el, {
          x: (Math.random() - 0.5) * 400,
          y: (Math.random() - 0.5) * 400,
          opacity: 0,
          duration: 1.5,
          ease: "power2.out",
          delay: i * 0.04
        });
      }
      setTimeout(() => playSuccess(), 300);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
    }
  }, [isComplete, navigate, playSuccess]);

  const handleStep1 = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.saveOnboardingStep1({
        date_of_birth: s1.date_of_birth || undefined,
        blood_type: s1.blood_type || undefined,
        weight_kg: s1.weight_kg ? parseFloat(s1.weight_kg) : undefined,
        height_cm: s1.height_cm ? parseFloat(s1.height_cm) : undefined
      });
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save");
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
        known_allergies: noneAbove ? "" : s2.known_allergies
      });
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (!s3.home_address.trim() || !s3.emergency_contact_name.trim() || !s3.emergency_contact_phone.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authService.saveOnboardingStep3({
        home_address: s3.home_address.trim(),
        emergency_contact_name: s3.emergency_contact_name.trim(),
        emergency_contact_phone: s3.emergency_contact_phone.trim()
      });
      setIsComplete(true);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-fcn-dark to-[#0A1628]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-xl font-extrabold tracking-tight text-white">FCN</div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/50">Step {step} of 3</span>
          {!isComplete && <button onClick={handleSkip} className="text-sm text-white/40 hover:text-white/70 transition-colors">Skip for now</button>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-6 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full bg-fcn-accent" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: shouldReduceMotion ? 0 : 0.4 }} />
      </div>

      <div ref={particlesRef} className="pointer-events-none absolute inset-0 z-10 overflow-hidden" />

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={!shouldReduceMotion ? { opacity: 0, x: 100 } : undefined} animate={{ opacity: 1, x: 0 }} exit={!shouldReduceMotion ? { opacity: 0, x: -100 } : undefined} className="space-y-5">
                <div className="flex justify-center"><Heart className="h-14 w-14 text-fcn-accent" /></div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">Let's set up your health profile</h2>
                  <p className="mt-1 text-sm text-white/50">This helps doctors understand you better</p>
                </div>

                {error && <p className="rounded-md bg-fcn-danger/10 px-3 py-2 text-sm text-fcn-danger">{error}</p>}

                <div className="grid grid-cols-2 gap-4">
                  <label className="col-span-2 block">
                    <span className="mb-1 block text-sm font-medium text-white/70">Date of birth</span>
                    <input type="date" value={s1.date_of_birth} onChange={(e) => setS1((prev) => ({ ...prev, date_of_birth: e.target.value }))} className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30" aria-label="Date of birth" />
                  </label>

                  <label className="col-span-2 block">
                    <span className="mb-1 block text-sm font-medium text-white/70">Blood type</span>
                    <div className="flex flex-wrap gap-2">
                      {bloodTypes.map((bt) => (
                        <motion.button key={bt} type="button" whileTap={shouldReduceMotion ? {} : { scale: 0.9 }} onClick={() => setS1((prev) => ({ ...prev, blood_type: bt }))} className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${s1.blood_type === bt ? "border-fcn-accent bg-fcn-accent text-white" : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"}`}>
                          {bt}
                        </motion.button>
                      ))}
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-white/70">Weight (kg)</span>
                    <input type="number" min="0" step="0.1" value={s1.weight_kg} onChange={(e) => setS1((prev) => ({ ...prev, weight_kg: e.target.value }))} className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30" aria-label="Weight in kg" />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-white/70">Height (cm)</span>
                    <input type="number" min="0" step="0.1" value={s1.height_cm} onChange={(e) => setS1((prev) => ({ ...prev, height_cm: e.target.value }))} className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30" aria-label="Height in cm" />
                  </label>
                </div>

                {bmiInfo && (
                  <div className="rounded-lg bg-white/5 px-4 py-3 text-center">
                    <span className="text-sm text-white/50">Your BMI: </span>
                    <span className="text-lg font-bold" style={{ color: bmiInfo.color }}>{bmiInfo.bmi.toFixed(1)}</span>
                    <span className="ml-2 text-sm" style={{ color: bmiInfo.color }}>— {bmiInfo.label}</span>
                  </div>
                )}

                <Button onClick={handleStep1} loading={isLoading} className="w-full">Next</Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={!shouldReduceMotion ? { opacity: 0, x: 100 } : undefined} animate={{ opacity: 1, x: 0 }} exit={!shouldReduceMotion ? { opacity: 0, x: -100 } : undefined} className="space-y-5">
                <div className="flex justify-center"><ClipboardList className="h-14 w-14 text-fcn-accent" /></div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">Your health conditions</h2>
                  <p className="mt-1 text-sm text-white/50">Your doctor will see this during consultations</p>
                </div>

                {error && <p className="rounded-md bg-fcn-danger/10 px-3 py-2 text-sm text-fcn-danger">{error}</p>}

                <div>
                  <span className="mb-2 block text-sm font-medium text-white/70">Chronic conditions</span>
                  {s2.chronic_conditions.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {s2.chronic_conditions.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 rounded-full bg-fcn-accent/20 px-3 py-1 text-xs font-medium text-fcn-accent">
                          {c} <button onClick={() => toggleCondition(c)} className="text-fcn-accent/60 hover:text-fcn-accent"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {conditionChips.map((cond) => (
                      <button key={cond} type="button" onClick={() => toggleCondition(cond)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${s2.chronic_conditions.includes(cond) ? "border-fcn-accent bg-fcn-accent/20 text-fcn-accent" : "border-white/10 bg-white/5 text-white/50 hover:border-white/30"}`}>
                        {cond}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input type="text" value={customCondition} onChange={(e) => setCustomCondition(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCondition(); } }} className="h-9 flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-white outline-none focus:border-fcn-accent" placeholder="Add custom condition..." aria-label="Custom condition" />
                    <button onClick={addCustomCondition} className="flex h-9 w-9 items-center justify-center rounded-md bg-fcn-accent/20 text-fcn-accent hover:bg-fcn-accent/30"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-sm font-medium text-white/70">Known allergies</span>
                  <div className="flex flex-wrap gap-2">
                    {allergyChips.map((a) => (
                      <button key={a} type="button" onClick={() => setS2((prev) => ({ ...prev, known_allergies: prev.known_allergies === a ? "" : a }))} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${s2.known_allergies === a ? "border-fcn-accent bg-fcn-accent/20 text-fcn-accent" : "border-white/10 bg-white/5 text-white/50 hover:border-white/30"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input type="text" value={customAllergy} onChange={(e) => setCustomAllergy(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomAllergy(); } }} className="h-9 flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-white outline-none focus:border-fcn-accent" placeholder="Add custom allergy..." aria-label="Custom allergy" />
                    <button onClick={addCustomAllergy} className="flex h-9 w-9 items-center justify-center rounded-md bg-fcn-accent/20 text-fcn-accent hover:bg-fcn-accent/30"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={noneAbove} onChange={(e) => { setNoneAbove(e.target.checked); if (e.target.checked) setS2((prev) => ({ ...prev, chronic_conditions: [], known_allergies: "" })); }} className="h-4 w-4 rounded border-white/30 text-fcn-accent focus:ring-fcn-accent" />
                  <span className="text-white/50">None of the above</span>
                </label>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button onClick={handleStep2} loading={isLoading} className="flex-1">Next</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && !isComplete && (
              <motion.div key="step3" initial={!shouldReduceMotion ? { opacity: 0, x: 100 } : undefined} animate={{ opacity: 1, x: 0 }} exit={!shouldReduceMotion ? { opacity: 0, x: -100 } : undefined} className="space-y-5">
                <div className="flex justify-center"><MapPin className="h-14 w-14 text-fcn-accent" /></div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">Help us reach you when it matters</h2>
                  <p className="mt-1 text-sm text-white/50">Emergency contact & location details</p>
                </div>

                {error && <p className="rounded-md bg-fcn-danger/10 px-3 py-2 text-sm text-fcn-danger">{error}</p>}

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-white/70">Home address</span>
                  <textarea value={s3.home_address} onChange={(e) => setS3((prev) => ({ ...prev, home_address: e.target.value }))} rows={3} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30" placeholder="Street, city, landmark..." aria-label="Home address" />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-white/70">Emergency contact name</span>
                    <input type="text" value={s3.emergency_contact_name} onChange={(e) => setS3((prev) => ({ ...prev, emergency_contact_name: e.target.value }))} className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30" placeholder="Full name" aria-label="Emergency contact name" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-white/70">Emergency phone</span>
                    <input type="tel" value={s3.emergency_contact_phone} onChange={(e) => setS3((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))} className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30" placeholder="+251 91X XXX XXX" aria-label="Emergency contact phone" />
                  </label>
                </div>

                <div className="rounded-lg border border-fcn-accent/20 bg-fcn-accent/5 px-4 py-3 text-sm text-fcn-accent/80">
                  This information helps nurses find your home during home visits and helps us contact your family if needed.
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button onClick={handleStep3} loading={isLoading} className="flex-1">Complete</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;