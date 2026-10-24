import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Pill,
  CheckCircle2,
  HelpCircle,
  FileText,
  Copy,
  Check,
  Stethoscope,
  FlaskConical,
  Clock,
  ArrowRight
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { consultationService } from "@/services/consultation.service";
import type {
  ClinicalAiAssessment,
  ClinicalAiMedication,
  ClinicalAiDiagnosis
} from "@/types";

interface DoctorAICopilotTabProps {
  appointmentId: string;
  patientName: string;
  onPreFillPrescription?: (med: {
    drug_name: string;
    dosage: string;
    form: string;
    instructions: string;
    frequency_per_day: number;
    duration_days: number;
  }) => void;
  onInsertNote?: (text: string) => void;
}

export function DoctorAICopilotTab({
  appointmentId,
  patientName,
  onPreFillPrescription,
  onInsertNote
}: DoctorAICopilotTabProps) {
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<ClinicalAiAssessment | null>(null);
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState<number | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await consultationService.getAiAssistance(appointmentId);
      if (res.data) {
        setAssessment(res.data);
        toast.success("Consultation analysis updated");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        "Could not generate AI clinical assistance. Please check network or try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuestion = (question: string, index: number) => {
    navigator.clipboard.writeText(question);
    setCopiedQuestionIdx(index);
    toast.success("Question copied to clipboard");
    setTimeout(() => setCopiedQuestionIdx(null), 2000);
  };

  const handleCopyText = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleInsertSummaryIntoNote = () => {
    if (!assessment) return;
    const ddxSummary = assessment.differential_diagnoses
      .map((d) => `• ${d.condition} (${d.probability} probability)`)
      .join("\n");

    const noteText = `[AI Clinical Summary]:\n${assessment.consultation_summary}\n\n[Differential Diagnoses]:\n${ddxSummary}`;
    onInsertNote?.(noteText);
    toast.success("Inserted into clinical summary note");
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-fcn-text-light dark:text-fcn-text-dark">
      {/* Top Banner / Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-fcn-primary/20 bg-gradient-to-br from-fcn-primary/10 via-fcn-accent/5 to-white dark:to-fcn-surface-dark p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-fcn-primary to-fcn-accent text-white shadow-sm">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-fcn-text-light dark:text-white">
                  Clinical AI Co-Pilot
                </h3>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Ethiopian STG Aligned
                </span>
              </div>
              <p className="text-[11px] text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
                On-demand differential diagnosis, drug safety & clinical guidance
              </p>
            </div>
          </div>
        </div>

        {/* Trigger Button */}
        <div className="mt-4 pt-3 border-t border-fcn-primary/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {assessment ? (
            <div className="flex items-center gap-1.5 text-[11px] text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Analyzed at{" "}
                <strong className="text-fcn-text-light dark:text-white">
                  {new Date(assessment.analyzed_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })}
                </strong>
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              Click to evaluate live chat, patient vitals & medical history.
            </p>
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className={clsx(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-60",
              assessment
                ? "bg-fcn-surface-dark/80 hover:bg-fcn-surface-dark text-white border border-white/10 dark:bg-fcn-primary dark:hover:bg-fcn-primary-hover"
                : "bg-gradient-to-r from-fcn-primary to-fcn-accent hover:brightness-110 shadow-fcn-primary/20"
            )}
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Evaluating Consultation...</span>
              </>
            ) : assessment ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Re-Analyze Consultation</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Analyze Consultation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !assessment && (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-20 rounded-xl bg-fcn-primary/5 border border-fcn-primary/10" />
          <div className="h-36 rounded-xl bg-fcn-primary/5 border border-fcn-primary/10" />
          <div className="h-40 rounded-xl bg-fcn-primary/5 border border-fcn-primary/10" />
        </div>
      )}

      {/* Empty State before first analysis */}
      {!loading && !assessment && (
        <div className="rounded-2xl border border-dashed border-fcn-primary/20 bg-white/50 dark:bg-fcn-surface-dark/50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-fcn-primary/10 text-fcn-primary mb-3">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-fcn-text-light dark:text-white">
            Ready for Clinical Evaluation
          </h4>
          <p className="mt-1 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 max-w-sm mx-auto leading-relaxed">
            Click <strong>&quot;Analyze Consultation&quot;</strong> anytime during the session. The AI Co-Pilot will cross-check the patient&apos;s symptoms, vitals, and allergies against Ethiopian Standard Treatment Guidelines.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            <span className="flex items-center gap-1 bg-fcn-primary/5 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Differential Diagnoses
            </span>
            <span className="flex items-center gap-1 bg-fcn-primary/5 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Allergy Cross-Checking
            </span>
            <span className="flex items-center gap-1 bg-fcn-primary/5 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> First-Line Regimens
            </span>
          </div>
        </div>
      )}

      {/* Populated Results View */}
      {assessment && (
        <div className="flex flex-col gap-4">
          {/* Medical Disclaimer Banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-fcn-primary/15 bg-fcn-surface-light dark:bg-fcn-surface-dark px-3.5 py-2.5 text-[11px] text-fcn-text-light/70 dark:text-fcn-text-dark/70">
            <ShieldCheck className="h-4 w-4 text-fcn-primary shrink-0 mt-0.5" />
            <p>
              <strong>Physician Advisory Only:</strong> This AI recommendation is provided to assist clinical decision-making and must be reviewed, verified, and approved by the attending physician in accordance with clinical judgment.
            </p>
          </div>

          {/* Red Flag Alerts (Urgent) */}
          {assessment.red_flags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-900 dark:text-rose-200"
            >
              <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300">
                <AlertOctagon className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Critical Red Flags / Urgent Risks</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-xs">
                {assessment.red_flags.map((flag, idx) => (
                  <li key={idx} className="font-semibold">
                    {flag}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Allergy / Drug Safety Warnings */}
          {assessment.allergy_warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Drug Allergy & Contraindication Warnings</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-xs">
                {assessment.allergy_warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Consultation Summary */}
          <div className="rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-fcn-primary" />
                Clinical Presentation Summary
              </h4>
              <div className="flex items-center gap-1">
                {onInsertNote && (
                  <button
                    type="button"
                    onClick={handleInsertSummaryIntoNote}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-fcn-primary/10 hover:bg-fcn-primary/20 text-fcn-primary text-[10px] font-bold transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Insert into Notes</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyText(assessment.consultation_summary, "summary")}
                  className="p-1 rounded-lg hover:bg-fcn-primary/10 text-fcn-text-light/50 transition-colors"
                  title="Copy text"
                >
                  {copiedSection === "summary" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-fcn-text-light/80 dark:text-fcn-text-dark/80 leading-relaxed">
              {assessment.consultation_summary}
            </p>
          </div>

          {/* Differential Diagnoses (DDx) */}
          <div className="rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50 flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-fcn-primary" />
                Differential Diagnoses (DDx)
              </h4>
              <span className="text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40 font-medium">
                Ranked by clinical likelihood
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {assessment.differential_diagnoses.map((ddx, idx) => {
                const probColor =
                  ddx.probability === "High"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : ddx.probability === "Moderate"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-fcn-primary/10 bg-fcn-surface-light/40 dark:bg-fcn-dark/40 p-3 text-xs flex flex-col gap-1.5 transition-all hover:border-fcn-primary/25"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-fcn-text-light dark:text-white">
                          {idx + 1}. {ddx.condition}
                        </span>
                        {ddx.icd10_hint && (
                          <span className="rounded bg-fcn-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-fcn-primary font-semibold">
                            {ddx.icd10_hint}
                          </span>
                        )}
                      </div>
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0",
                          probColor
                        )}
                      >
                        {ddx.probability} Likelihood
                      </span>
                    </div>

                    <p className="text-fcn-text-light/70 dark:text-fcn-text-dark/70 text-[11px] leading-relaxed">
                      {ddx.reasoning}
                    </p>

                    {ddx.supporting_symptoms.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                          Evidence:
                        </span>
                        {ddx.supporting_symptoms.map((symptom, sIdx) => (
                          <span
                            key={sIdx}
                            className="rounded-md bg-white dark:bg-fcn-surface-dark px-1.5 py-0.5 text-[10px] text-fcn-text-light/80 dark:text-fcn-text-dark/80 border border-fcn-primary/10"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    )}

                    {ddx.key_distinguishing_features && (
                      <div className="text-[10px] text-fcn-text-light/60 dark:text-fcn-text-dark/60 italic pt-0.5">
                        Key discriminator: {ddx.key_distinguishing_features}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Treatment (Ethiopian STG) */}
          <div className="rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50 flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-fcn-primary" />
                Recommended Treatment (STG Aligned)
              </h4>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                First-Line Choices
              </span>
            </div>

            {/* Medications List */}
            <div className="flex flex-col gap-2.5">
              {assessment.recommended_treatment.first_line_medications.map((med, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-fcn-primary/10 bg-fcn-surface-light/40 dark:bg-fcn-dark/40 p-3 text-xs flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-fcn-text-light dark:text-white text-sm">
                          {med.drug_name}
                        </span>
                        <span className="rounded bg-fcn-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-fcn-primary">
                          {med.dosage} • {med.form}
                        </span>
                      </div>
                      {med.guideline_note && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          ✓ {med.guideline_note}
                        </p>
                      )}
                    </div>

                    {onPreFillPrescription && (
                      <button
                        type="button"
                        onClick={() =>
                          onPreFillPrescription({
                            drug_name: med.drug_name,
                            dosage: med.dosage,
                            form: med.form,
                            instructions: med.instructions,
                            frequency_per_day: med.frequency_per_day,
                            duration_days: med.duration_days
                          })
                        }
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 shrink-0"
                      >
                        <Pill className="h-3 w-3" />
                        <span>Pre-fill in Rx</span>
                      </button>
                    )}
                  </div>

                  <div className="rounded-lg bg-white/70 dark:bg-fcn-surface-dark/70 p-2 text-[11px] text-fcn-text-light/80 dark:text-fcn-text-dark/80 border border-fcn-primary/5">
                    <strong>Regimen:</strong> {med.instructions} ({med.duration_days} days, x{med.frequency_per_day}/day)
                  </div>
                </div>
              ))}

              {assessment.recommended_treatment.first_line_medications.length === 0 && (
                <p className="text-xs text-fcn-text-light/50 italic">
                  No specific prescription indicated. Consider non-pharmacological care below.
                </p>
              )}
            </div>

            {/* Non-Pharmacological & Patient Counseling */}
            {(assessment.recommended_treatment.non_pharmacological.length > 0 ||
              assessment.recommended_treatment.patient_counseling.length > 0) && (
              <div className="mt-3 pt-3 border-t border-fcn-primary/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {assessment.recommended_treatment.non_pharmacological.length > 0 && (
                  <div>
                    <h5 className="font-bold text-[11px] text-fcn-text-light/60 dark:text-fcn-text-dark/60 mb-1.5">
                      Non-Pharmacological
                    </h5>
                    <ul className="space-y-1 list-disc pl-4 text-[11px] text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                      {assessment.recommended_treatment.non_pharmacological.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessment.recommended_treatment.patient_counseling.length > 0 && (
                  <div>
                    <h5 className="font-bold text-[11px] text-fcn-text-light/60 dark:text-fcn-text-dark/60 mb-1.5">
                      Patient Counseling
                    </h5>
                    <ul className="space-y-1 list-disc pl-4 text-[11px] text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                      {assessment.recommended_treatment.patient_counseling.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recommended Diagnostic / Lab Tests */}
          {assessment.recommended_lab_tests.length > 0 && (
            <div className="rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50 flex items-center gap-1.5">
                  <FlaskConical className="h-3.5 w-3.5 text-fcn-primary" />
                  Recommended Investigations
                </h4>
              </div>
              <div className="space-y-2">
                {assessment.recommended_lab_tests.map((test, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-fcn-surface-light/40 dark:bg-fcn-dark/40 border border-fcn-primary/10 text-xs"
                  >
                    <div>
                      <div className="font-bold text-fcn-text-light dark:text-white">
                        {test.test_name}
                      </div>
                      <div className="text-[11px] text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
                        {test.rationale}
                      </div>
                    </div>
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0",
                        test.urgency === "Immediate"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      )}
                    >
                      {test.urgency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Clinical Inquiries for Doctor */}
          {assessment.suggested_clinical_questions.length > 0 && (
            <div className="rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50 flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-fcn-primary" />
                  Suggested Clarifying Questions for Patient
                </h4>
                <span className="text-[10px] text-fcn-text-light/40 font-medium">
                  Click to copy
                </span>
              </div>
              <div className="space-y-2">
                {assessment.suggested_clinical_questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-fcn-surface-light/40 dark:bg-fcn-dark/40 border border-fcn-primary/10 text-xs hover:border-fcn-primary/30 transition-colors"
                  >
                    <span className="text-fcn-text-light/90 dark:text-fcn-text-dark/90 text-xs leading-relaxed">
                      &quot;{q}&quot;
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyQuestion(q, idx)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-fcn-primary/10 hover:bg-fcn-primary/20 text-fcn-primary text-[10px] font-bold shrink-0 transition-colors"
                    >
                      {copiedQuestionIdx === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
