import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Minus, Pill, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { consultationService } from "@/services/consultation.service";
import toast from "react-hot-toast";

interface MedicationEntry {
  id: string;
  drug_name: string;
  strength: string;
  form: string;
  instructions: string;
  frequency_per_day: number;
  reminder_times: string[];
  supply_days: number;
  is_ongoing: boolean;
  quantity: number | undefined;
}

interface PrescribePanelProps {
  appointmentId: string;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
  onPrescriptionIssued: () => void;
}

const COMMON_MEDICATIONS = [
  "Paracetamol", "Amoxicillin", "Metformin", "Lisinopril", "Atenolol",
  "Omeprazole", "Ciprofloxacin", "Chloroquine", "Albendazole", "Ibuprofen",
  "Diclofenac", "Prednisolone", "Salbutamol (inhaler)", "Furosemide", "Atorvastatin",
  "Glibenclamide", "Cotrimoxazole", "Doxycycline", "Metronidazole", "Erythromycin",
  "Tetracycline", "Ampicillin", "Folic Acid", "Iron supplements", "Vitamin B complex",
  "ORS (Oral Rehydration Salts)", "Zinc", "Mebendazole", "Artemether-Lumefantrine (Coartem)", "Hydrocortisone cream"
];

const MEDICATION_FORMS = [
  "Tablet", "Capsule", "Liquid/Syrup", "Injection", "Cream/Ointment", "Inhaler", "Drops", "Suppository"
];

let medicationIdCounter = 0;
function createMedication(): MedicationEntry {
  medicationIdCounter++;
  return {
    id: `med-${medicationIdCounter}`,
    drug_name: "",
    strength: "",
    form: "Tablet",
    instructions: "",
    frequency_per_day: 2,
    reminder_times: [],
    supply_days: 30,
    is_ongoing: false,
    quantity: undefined
  };
}

export function PrescribePanel({
  appointmentId,
  patientName,
  isOpen,
  onClose,
  onPrescriptionIssued
}: PrescribePanelProps) {
  const [medications, setMedications] = useState<MedicationEntry[]>([createMedication()]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});

  const addMedication = useCallback(() => {
    setMedications((prev) => [...prev, createMedication()]);
  }, []);

  const removeMedication = useCallback((id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMedication = useCallback(
    (id: string, field: keyof MedicationEntry, value: unknown) => {
      setMedications((prev) =>
        prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
      );
    },
    []
  );

  const handleSubmit = async () => {
    const validMeds = medications.filter(
      (m) => m.drug_name.trim().length >= 2 && m.instructions.trim().length >= 5
    );

    if (validMeds.length === 0) {
      toast.error("Please add at least one medication with drug name and instructions");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        medications: validMeds.map((m) => ({
          drug_name: m.drug_name,
          strength: m.strength,
          form: m.form || undefined,
          instructions: m.instructions,
          frequency_per_day: m.frequency_per_day,
          reminder_times: m.reminder_times.length > 0 ? m.reminder_times : undefined,
          supply_days: m.is_ongoing ? 30 : m.supply_days,
          is_ongoing: m.is_ongoing,
          quantity: m.quantity || undefined
        })),
        notes: notes.trim() || undefined
      };

      await consultationService.issuePrescription(appointmentId, payload);
      toast.success("Prescription issued successfully");
      onPrescriptionIssued();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err?.response?.data?.error?.message ?? "Failed to issue prescription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 z-40 h-full w-full border-l border-gray-800 bg-gray-900 sm:w-[400px]"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">Issue Prescription</h3>
                  <p className="text-xs text-gray-500">for {patientName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700">
                <div className="mb-4">
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Clinical notes / Prescription instructions (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-teal-500/50"
                    placeholder="e.g., Take with food, avoid alcohol..."
                  />
                  <p className="mt-1 text-right text-[10px] text-gray-600">{notes.length}/500</p>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {medications.map((med, index) => (
                      <motion.div
                        key={med.id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800/50"
                      >
                        <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
                          <span className="text-xs font-medium text-gray-300">
                            Medication {index + 1}
                          </span>
                          {medications.length > 1 && (
                            <button
                              onClick={() => removeMedication(med.id)}
                              className="rounded-full p-1 text-gray-500 hover:bg-gray-700 hover:text-red-400"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 p-3">
                          <div className="relative">
                            <label className="mb-1 block text-[10px] text-gray-500">Drug name</label>
                            <input
                              value={med.drug_name}
                              onChange={(e) => {
                                updateMedication(med.id, "drug_name", e.target.value);
                                setShowSuggestions((prev) => ({
                                  ...prev,
                                  [med.id]: e.target.value.length > 0
                                }));
                              }}
                              onFocus={() =>
                                setShowSuggestions((prev) => ({
                                  ...prev,
                                  [med.id]: med.drug_name.length > 0
                                }))
                              }
                              onBlur={() =>
                                setTimeout(
                                  () =>
                                    setShowSuggestions((prev) => ({ ...prev, [med.id]: false })),
                                  200
                                )
                              }
                              placeholder="Search medications..."
                              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-teal-500/50"
                            />
                            {showSuggestions[med.id] && (
                              <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
                                {COMMON_MEDICATIONS.filter((m) =>
                                  m.toLowerCase().includes(med.drug_name.toLowerCase())
                                ).map((m) => (
                                  <button
                                    key={m}
                                    onMouseDown={() => {
                                      updateMedication(med.id, "drug_name", m);
                                      setShowSuggestions((prev) => ({ ...prev, [med.id]: false }));
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-800"
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1 block text-[10px] text-gray-500">Strength</label>
                              <input
                                value={med.strength}
                                onChange={(e) => updateMedication(med.id, "strength", e.target.value)}
                                placeholder="e.g., 500mg"
                                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-teal-500/50"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] text-gray-500">Form</label>
                              <select
                                value={med.form}
                                onChange={(e) => updateMedication(med.id, "form", e.target.value)}
                                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-teal-500/50"
                              >
                                {MEDICATION_FORMS.map((f) => (
                                  <option key={f} value={f}>
                                    {f}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-[10px] text-gray-500">Instructions</label>
                            <textarea
                              value={med.instructions}
                              onChange={(e) =>
                                updateMedication(med.id, "instructions", e.target.value)
                              }
                              placeholder="e.g., Take 2 tablets every 8 hours with food for 5 days"
                              rows={2}
                              className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-teal-500/50"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1 block text-[10px] text-gray-500">Frequency/day</label>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    updateMedication(
                                      med.id,
                                      "frequency_per_day",
                                      Math.max(1, med.frequency_per_day - 1)
                                    )
                                  }
                                  className="rounded-lg bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-8 text-center text-sm text-gray-100">
                                  {med.frequency_per_day}
                                </span>
                                <button
                                  onClick={() =>
                                    updateMedication(
                                      med.id,
                                      "frequency_per_day",
                                      Math.min(6, med.frequency_per_day + 1)
                                    )
                                  }
                                  className="rounded-lg bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-[10px] text-gray-500">Quantity</label>
                              <input
                                type="number"
                                value={med.quantity ?? ""}
                                onChange={(e) =>
                                  updateMedication(
                                    med.id,
                                    "quantity",
                                    e.target.value ? parseInt(e.target.value) : undefined
                                  )
                                }
                                min={1}
                                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-teal-500/50"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="mb-1 block text-[10px] text-gray-500">
                                Supply days
                              </label>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    updateMedication(
                                      med.id,
                                      "supply_days",
                                      Math.max(1, med.supply_days - 7)
                                    )
                                  }
                                  disabled={med.is_ongoing}
                                  className="rounded-lg bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 disabled:opacity-30"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-8 text-center text-sm text-gray-100">
                                  {med.is_ongoing ? "—" : med.supply_days}
                                </span>
                                <button
                                  onClick={() =>
                                    updateMedication(
                                      med.id,
                                      "supply_days",
                                      Math.min(365, med.supply_days + 7)
                                    )
                                  }
                                  disabled={med.is_ongoing}
                                  className="rounded-lg bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 disabled:opacity-30"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <label className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
                              <input
                                type="checkbox"
                                checked={med.is_ongoing}
                                onChange={(e) =>
                                  updateMedication(med.id, "is_ongoing", e.target.checked)
                                }
                                className="rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500/30"
                              />
                              Ongoing
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <button
                  onClick={addMedication}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-600 py-2.5 text-sm text-gray-400 transition-colors hover:border-teal-500/50 hover:text-teal-400"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Medication
                </button>
              </div>

              <div className="flex gap-2 border-t border-gray-800 px-4 py-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-500 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-400 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Pill className="h-4 w-4" />
                  )}
                  Issue Prescription
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
