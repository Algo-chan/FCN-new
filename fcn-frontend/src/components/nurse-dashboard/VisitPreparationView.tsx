import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  MapPin, Phone, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  ExternalLink, Stethoscope, Pill, Activity, ClipboardList, ArrowLeft,
  FileText
} from "lucide-react";
import { clsx } from "clsx";
import { getVisitPreparation, updateVisitChecklist, type VisitPreparation } from "@/services/nurse-dashboard.service";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";

interface VisitPreparationViewProps {
  appointmentId: string;
  onClose: () => void;
}

export const VisitPreparationView = ({ appointmentId, onClose }: VisitPreparationViewProps) => {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();

  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [visitNotes, setVisitNotes] = useState("");
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    vitals: true,
    prescriptions: true,
    instructions: true,
  });

  const notesTimerRef = useRef<number>();

  const { data: res, isLoading } = useQuery({
    queryKey: ["visit-preparation", appointmentId],
    queryFn: () => getVisitPreparation(appointmentId),
  });

  const prep = res?.data;

  useEffect(() => {
    if (prep?.existing_checklist) {
      try {
        const existing = JSON.parse(
          typeof prep.existing_checklist.completed_items === "string"
            ? prep.existing_checklist.completed_items
            : JSON.stringify(prep.existing_checklist.completed_items)
        );
        setCompletedItems(Array.isArray(existing) ? existing : []);
        if (prep.existing_checklist.notes) setVisitNotes(prep.existing_checklist.notes);
      } catch { /* ignore */ }
    }
  }, [prep]);

  const updateMutation = useMutation({
    mutationFn: (data: { completedItems: string[]; notes?: string }) =>
      updateVisitChecklist(appointmentId, data.completedItems, data.notes),
    onError: () => {
      addToast({ type: "danger", title: "Failed to save checklist" });
    },
  });

  const toggleItem = useCallback((item: string) => {
    setCompletedItems((prev) => {
      const next = prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item];
      window.clearTimeout(notesTimerRef.current);
      notesTimerRef.current = window.setTimeout(() => {
        updateMutation.mutate({ completedItems: next, notes: visitNotes });
      }, 1000);
      return next;
    });
  }, [updateMutation, visitNotes]);

  const debouncedSaveNotes = useCallback((notes: string) => {
    window.clearTimeout(notesTimerRef.current);
    notesTimerRef.current = window.setTimeout(() => {
      updateMutation.mutate({ completedItems, notes });
    }, 2000);
  }, [updateMutation, completedItems]);

  const handleNotesChange = (value: string) => {
    setVisitNotes(value);
    debouncedSaveNotes(value);
  };

  const handleCompleteVisit = () => {
    if (!prep) return;
    const allItems = prep.suggested_checklist;
    updateMutation.mutate(
      { completedItems: allItems, notes: visitNotes },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["today-visits"] });
          queryClient.invalidateQueries({ queryKey: ["nurse-stats"] });
          playSuccess();
          addToast({ type: "success", title: "Visit completed! Doctor has been notified." });
          setConfirmCompleteOpen(false);
          onClose();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!prep) return null;

  const allItems = prep.suggested_checklist;
  const progress = allItems.length > 0 ? (completedItems.length / allItems.length) * 100 : 0;
  const allDone = completedItems.length >= allItems.length && allItems.length > 0;
  const hasAllergies = !!prep.patient.known_allergies;
  const hasChronic = prep.patient.chronic_conditions.length > 0;

  const toggleSection = (key: string) => setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-fcn-dark overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white dark:bg-fcn-dark border-b border-fcn-primary/10 px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-fcn-primary/10">
          <ArrowLeft className="h-5 w-5 text-fcn-text-light dark:text-fcn-text-dark" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-fcn-text-light dark:text-fcn-text-dark">{prep.patient.full_name}</h2>
          <p className="text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            {prep.patient.home_address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" /> {prep.patient.home_address}
              </span>
            )}
          </p>
        </div>
        {prep.patient.home_lat && prep.patient.home_lng && (
          <a
            href={`https://maps.google.com/?q=${prep.patient.home_lat},${prep.patient.home_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-fcn-primary text-white text-xs font-medium hover:bg-fcn-primary/90"
          >
            <ExternalLink className="h-3 w-3" /> Directions
          </a>
        )}
      </div>

      <div className="flex-1 p-4 space-y-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Avatar name={prep.patient.full_name} role="patient" size="md" />
          <div>
            <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              {format(parseISO(prep.appointment.scheduled_at), "MMMM d, h:mm a")} · {prep.appointment.duration_minutes}min
            </p>
            <Badge variant="info" size="sm">{prep.appointment.appointment_type}</Badge>
          </div>
        </div>

        {hasAllergies && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-fcn-danger/30 bg-fcn-danger/5 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-fcn-danger shrink-0" />
              <span className="text-sm font-bold text-fcn-danger">ALLERGIES</span>
            </div>
            <p className="text-sm text-fcn-danger/90 font-medium">{prep.patient.known_allergies}</p>
          </motion.div>
        )}

        {hasChronic && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-fcn-warning/30 bg-fcn-warning/5 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-fcn-warning shrink-0" />
              <span className="text-sm font-bold text-fcn-warning">Chronic Conditions</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {prep.patient.chronic_conditions.map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-fcn-warning/10 text-fcn-warning">{c}</span>
              ))}
            </div>
          </motion.div>
        )}

        {!hasAllergies && !hasChronic && (
          <div className="rounded-lg border border-fcn-success/30 bg-fcn-success/5 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-fcn-success" />
              <p className="text-sm font-medium text-fcn-success">No known allergies or chronic conditions</p>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">Visit Checklist</h3>
            <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              {completedItems.length}/{allItems.length} checked
            </span>
          </div>

          <div className="h-2 rounded-full bg-fcn-primary/10 mb-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-fcn-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>

          <div className="space-y-1">
            <AnimatePresence>
              {allItems.map((item, i) => (
                <motion.div
                  key={item}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <motion.button
                    onClick={() => toggleItem(item)}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    className={clsx(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors min-h-[44px]",
                      completedItems.includes(item)
                        ? "bg-fcn-success/5 border border-fcn-success/20"
                        : "bg-fcn-primary/5 border border-fcn-primary/10 hover:bg-fcn-primary/10"
                    )}
                  >
                    <div className={clsx(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      completedItems.includes(item)
                        ? "bg-fcn-success border-fcn-success"
                        : "border-fcn-primary/30"
                    )}>
                      {completedItems.includes(item) && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <span className={clsx(
                      "text-sm",
                      completedItems.includes(item)
                        ? "text-fcn-success line-through"
                        : "text-fcn-text-light dark:text-fcn-text-dark"
                    )}>
                      {item}
                    </span>
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {allDone && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="rounded-lg border border-fcn-success/30 bg-fcn-success/5 p-4 text-center"
          >
            <CheckCircle className="h-8 w-8 text-fcn-success mx-auto mb-2" />
            <p className="text-sm font-bold text-fcn-success mb-1">All items completed!</p>
            <Button onClick={() => setConfirmCompleteOpen(true)} className="w-full">
              Complete Visit
            </Button>
          </motion.div>
        )}

        <button
          onClick={() => toggleSection("vitals")}
          className="flex items-center justify-between w-full p-3 rounded-lg bg-fcn-primary/5 hover:bg-fcn-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-fcn-primary" />
            <span className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Patient's Recent Vitals</span>
          </div>
          {collapsedSections.vitals ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        {!collapsedSections.vitals && (
          <div className="space-y-2">
            {prep.vitals_history.length === 0 ? (
              <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 text-center py-4">No vitals recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-fcn-text-light/50 dark:text-fcn-text-dark/50 border-b border-fcn-primary/10">
                      <th className="text-left py-1 pr-2">Date</th>
                      <th className="text-left py-1 pr-2">BP</th>
                      <th className="text-left py-1 pr-2">HR</th>
                      <th className="text-left py-1 pr-2">Temp</th>
                      <th className="text-left py-1 pr-2">SpO2</th>
                      <th className="text-left py-1">Glucose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prep.vitals_history.slice(0, 5).map((v: any) => (
                      <tr key={v.id} className="border-b border-fcn-primary/5">
                        <td className="py-1.5 pr-2 text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                          {format(parseISO(v.recorded_at), "MMM d, h:mm a")}
                        </td>
                        <td className="py-1.5 pr-2">{v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : "-"}</td>
                        <td className="py-1.5 pr-2">{v.heart_rate_bpm ?? "-"}</td>
                        <td className="py-1.5 pr-2">{v.temperature_celsius ? `${v.temperature_celsius}°C` : "-"}</td>
                        <td className="py-1.5 pr-2">{v.spo2_percent ? `${v.spo2_percent}%` : "-"}</td>
                        <td className="py-1.5">{v.blood_glucose_mg_dl ? `${v.blood_glucose_mg_dl}` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <a href={`/health-records/${prep.patient.id}`} className="text-xs text-fcn-primary hover:underline">View full history →</a>
          </div>
        )}

        <button
          onClick={() => toggleSection("prescriptions")}
          className="flex items-center justify-between w-full p-3 rounded-lg bg-fcn-primary/5 hover:bg-fcn-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-fcn-primary" />
            <span className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Current Medications</span>
          </div>
          {collapsedSections.prescriptions ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        {!collapsedSections.prescriptions && (
          <div className="space-y-2">
            {prep.active_prescriptions.length === 0 ? (
              <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 text-center py-4">No active prescriptions</p>
            ) : (
              prep.active_prescriptions.map((rx: any) => (
                <div key={rx.id} className="p-3 rounded-lg border border-fcn-primary/10">
                  <p className="text-xs font-medium text-fcn-text-light dark:text-fcn-text-dark">RX: {rx.rx_reference}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rx.medications?.map((m: any) => (
                      <span key={m.id} className="px-1.5 py-0.5 rounded text-[10px] bg-fcn-primary/5 text-fcn-primary">{m.drug_name} {m.strength}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <button
          onClick={() => toggleSection("instructions")}
          className="flex items-center justify-between w-full p-3 rounded-lg bg-fcn-primary/5 hover:bg-fcn-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-fcn-primary" />
            <span className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">From the booking</span>
          </div>
          {collapsedSections.instructions ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        {!collapsedSections.instructions && (
          <div className="p-3 rounded-lg bg-fcn-primary/5">
            <p className="text-sm text-fcn-text-light dark:text-fcn-text-dark">
              {prep.doctor_instructions ?? "No specific instructions from the doctor."}
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark block mb-1">Visit Notes</label>
          <textarea
            value={visitNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={4}
            placeholder="Write observations during the visit..."
            className="w-full resize-none rounded-lg border border-fcn-primary/20 bg-white p-3 text-sm text-fcn-text-light outline-none focus:border-fcn-primary focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark dark:border-fcn-primary/10"
          />
          <p className="text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40 mt-1">
            Auto-saves as you type
          </p>
        </div>
      </div>

      <Modal isOpen={confirmCompleteOpen} onClose={() => setConfirmCompleteOpen(false)} title="Complete Visit" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">
            All vitals should be recorded before completing. Mark this visit as complete?
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmCompleteOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleCompleteVisit} loading={updateMutation.isPending}>
              Complete Visit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
