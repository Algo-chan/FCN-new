import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "clsx";
import { Clock, AlertTriangle, X, Pill, Plus, Minus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { issueFollowUpPrescription } from "@/services/doctor-dashboard.service";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";

interface FollowUpPrescriptionPanelProps {
  appointmentId: string;
  patientName: string;
  deadline: string;
  onSuccess: () => void;
  onClose: () => void;
}

interface MedicationEntry {
  id: string;
  drug_name: string;
  strength: string;
  form: string;
  instructions: string;
  frequency_per_day: number;
  supply_days: number;
  is_ongoing: boolean;
  quantity: number | undefined;
}

const COMMON_MEDICATIONS = [
  "Paracetamol", "Amoxicillin", "Metformin", "Lisinopril", "Atenolol",
  "Omeprazole", "Ciprofloxacin", "Chloroquine", "Albendazole", "Ibuprofen",
  "Diclofenac", "Prednisolone", "Salbutamol (inhaler)", "Furosemide", "Atorvastatin",
  "Glibenclamide", "Cotrimoxazole", "Doxycycline", "Metronidazole", "Erythromycin",
];

let medIdCounter = 0;
const createMed = (): MedicationEntry => {
  medIdCounter++;
  return { id: `med-${medIdCounter}`, drug_name: "", strength: "", form: "Tablet", instructions: "", frequency_per_day: 2, supply_days: 30, is_ongoing: false, quantity: undefined };
};

export const FollowUpPrescriptionPanel = ({ appointmentId, patientName, deadline, onSuccess, onClose }: FollowUpPrescriptionPanelProps) => {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { playSuccess, playNotification } = useSound();
  const { addToast } = useNotifications();
  const warningPlayedRef = useRef(false);

  const [medications, setMedications] = useState<MedicationEntry[]>([createMed()]);
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});

  const deadlineDate = new Date(deadline);
  const [timeLeft, setTimeLeft] = useState(deadlineDate.getTime() - Date.now());
  const expired = timeLeft <= 0;
  const lessThanHour = timeLeft > 0 && timeLeft < 3600000;

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = deadlineDate.getTime() - Date.now();
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [deadlineDate]);

  useEffect(() => {
    if (lessThanHour && !warningPlayedRef.current) {
      playNotification();
      warningPlayedRef.current = true;
    }
  }, [lessThanHour, playNotification]);

  const hours = Math.floor(timeLeft / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const mutation = useMutation({
    mutationFn: () => {
      const validMeds = medications.filter((m) => m.drug_name.trim().length >= 2 && m.instructions.trim().length >= 5);
      return issueFollowUpPrescription(appointmentId, validMeds.map((m) => ({
        drug_name: m.drug_name,
        strength: m.strength,
        form: m.form || undefined,
        instructions: m.instructions,
        frequency_per_day: m.frequency_per_day,
        supply_days: m.is_ongoing ? 30 : m.supply_days,
        is_ongoing: m.is_ongoing,
        quantity: m.quantity || undefined,
      })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-schedule"] });
      playSuccess();
      addToast({ type: "success", title: "Follow-up prescription issued" });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      addToast({ type: "danger", title: err?.response?.data?.error?.message ?? "Failed to issue prescription" });
    },
  });

  if (expired) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg border border-fcn-danger/30 bg-fcn-danger/5 p-6 text-center"
      >
        <div className="text-4xl mb-3">⛔</div>
        <h3 className="text-lg font-bold text-fcn-danger mb-2">Prescription Window Expired</h3>
        <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">
          The 48-hour follow-up period has ended. Ask patient to book a new appointment.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">Follow-Up Prescription</h3>
          <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">for {patientName}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full text-fcn-text-light/40 hover:text-fcn-text-light hover:bg-fcn-primary/10">
          <X className="h-4 w-4" />
        </button>
      </div>

      <motion.div
        animate={lessThanHour ? { scale: [1, 1.05, 1] } : undefined}
        transition={{ duration: 2, repeat: Infinity }}
        className={clsx(
          "flex items-center gap-3 p-3 rounded-lg border",
          lessThanHour ? "border-fcn-danger/30 bg-fcn-danger/5" : "border-fcn-warning/30 bg-fcn-warning/5"
        )}
      >
        <Clock className={clsx("h-5 w-5", lessThanHour ? "text-fcn-danger" : "text-fcn-warning")} />
        <div>
          <p className={clsx("text-xs font-medium", lessThanHour ? "text-fcn-danger" : "text-fcn-warning")}>
            Window closes in:
          </p>
          <p className={clsx("text-xl font-bold font-mono", lessThanHour ? "text-fcn-danger" : "text-fcn-warning")}>
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>
      </motion.div>

      <div className="space-y-3">
        {medications.map((med, index) => (
          <div key={med.id} className="rounded-lg border border-fcn-primary/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-fcn-text-light dark:text-fcn-text-dark">Medication {index + 1}</span>
              {medications.length > 1 && (
                <button onClick={() => setMedications((prev) => prev.filter((m) => m.id !== med.id))} className="text-fcn-danger text-xs hover:underline">
                  Remove
                </button>
              )}
            </div>
            <div className="relative">
              <input
                value={med.drug_name}
                onChange={(e) => {
                  setMedications((prev) => prev.map((m) => m.id === med.id ? { ...m, drug_name: e.target.value } : m));
                  setShowSuggestions((prev) => ({ ...prev, [med.id]: e.target.value.length > 0 }));
                }}
                onFocus={() => setShowSuggestions((prev) => ({ ...prev, [med.id]: med.drug_name.length > 0 }))}
                onBlur={() => setTimeout(() => setShowSuggestions((prev) => ({ ...prev, [med.id]: false })), 200)}
                placeholder="Drug name..."
                className="w-full rounded-lg border border-fcn-primary/20 bg-white px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark"
              />
              {showSuggestions[med.id] && (
                <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-fcn-primary/10 bg-white dark:bg-fcn-dark shadow-xl">
                  {COMMON_MEDICATIONS.filter((m) => m.toLowerCase().includes(med.drug_name.toLowerCase())).map((m) => (
                    <button key={m} onMouseDown={() => { setMedications((prev) => prev.map((x) => x.id === med.id ? { ...x, drug_name: m } : x)); setShowSuggestions((prev) => ({ ...prev, [med.id]: false })); }}
                      className="w-full px-3 py-1.5 text-left text-xs text-fcn-text-light hover:bg-fcn-primary/5 dark:text-fcn-text-dark">
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={med.strength} onChange={(e) => setMedications((prev) => prev.map((m) => m.id === med.id ? { ...m, strength: e.target.value } : m))}
                placeholder="Strength (e.g. 500mg)" className="rounded-lg border border-fcn-primary/20 bg-white px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark" />
              <select value={med.form} onChange={(e) => setMedications((prev) => prev.map((m) => m.id === med.id ? { ...m, form: e.target.value } : m))}
                className="rounded-lg border border-fcn-primary/20 bg-white px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark">
                {["Tablet", "Capsule", "Liquid/Syrup", "Injection", "Cream", "Inhaler", "Drops"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <textarea value={med.instructions} onChange={(e) => setMedications((prev) => prev.map((m) => m.id === med.id ? { ...m, instructions: e.target.value } : m))}
              placeholder="Instructions (e.g. Take 2 tablets every 8 hours)" rows={2}
              className="w-full resize-none rounded-lg border border-fcn-primary/20 bg-white px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark" />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Freq:</span>
                <button onClick={() => setMedications((prev) => prev.map((m) => m.id === med.id ? { ...m, frequency_per_day: Math.max(1, m.frequency_per_day - 1) } : m))}
                  className="p-1 rounded bg-fcn-primary/10 text-fcn-primary hover:bg-fcn-primary/20"><Minus className="h-3 w-3" /></button>
                <span className="w-6 text-center text-xs font-medium">{med.frequency_per_day}</span>
                <button onClick={() => setMedications((prev) => prev.map((m) => m.id === med.id ? { ...m, frequency_per_day: Math.min(6, m.frequency_per_day + 1) } : m))}
                  className="p-1 rounded bg-fcn-primary/10 text-fcn-primary hover:bg-fcn-primary/20"><Plus className="h-3 w-3" /></button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Days:</span>
                <button onClick={() => setMedications((prev) => prev.map((m) => m.id === med.id ? { ...m, supply_days: Math.max(1, m.supply_days - 7) } : m))}
                  disabled={med.is_ongoing}
                  className="p-1 rounded bg-fcn-primary/10 text-fcn-primary hover:bg-fcn-primary/20 disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                <span className="w-6 text-center text-xs font-medium">{med.is_ongoing ? "-" : med.supply_days}</span>
                <button onClick={() => setMedications((prev) => prev.map((m) => m.id === med.id ? { ...m, supply_days: Math.min(365, m.supply_days + 7) } : m))}
                  disabled={med.is_ongoing}
                  className="p-1 rounded bg-fcn-primary/10 text-fcn-primary hover:bg-fcn-primary/20 disabled:opacity-30"><Plus className="h-3 w-3" /></button>
              </div>
              <label className="flex items-center gap-1 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                <input type="checkbox" checked={med.is_ongoing} onChange={(e) => setMedications((prev) => prev.map((m) => m.id === med.id ? { ...m, is_ongoing: e.target.checked } : m))}
                  className="rounded border-fcn-primary/30 text-fcn-primary focus:ring-fcn-primary/30" />
                Ongoing
              </label>
            </div>
          </div>
        ))}
        <button onClick={() => setMedications((prev) => [...prev, createMed()])}
          className="w-full py-2 rounded-lg border border-dashed border-fcn-primary/20 text-xs text-fcn-primary hover:bg-fcn-primary/5">
          + Add Medication
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-fcn-primary/20 text-sm text-fcn-text-light dark:text-fcn-text-dark hover:bg-fcn-primary/5">
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || medications.every((m) => m.drug_name.trim().length < 2)}
          className="flex-1 py-2 rounded-lg bg-fcn-primary text-sm font-medium text-white hover:bg-fcn-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Pill className="h-4 w-4" />}
          Issue Prescription
        </button>
      </div>
    </div>
  );
};
