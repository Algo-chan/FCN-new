import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { format, parseISO, isBefore, addMinutes } from "date-fns";
import { Video, MapPin, User, Activity, Stethoscope, AlertTriangle, FileText } from "lucide-react";
import { clsx } from "clsx";
import type { ActivePatient } from "@/services/doctor-dashboard.service";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DoctorNoteModal } from "./DoctorNoteModal";

interface ActivePatientCardProps {
  patient: ActivePatient;
  index?: number;
}

const typeIcons: Record<string, typeof Video> = { remote: Video, in_person: MapPin, nurse_visit: User };

export const ActivePatientCard = ({ patient, index = 0 }: ActivePatientCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const isNowOrSoon = isBefore(parseISO(patient.next_appointment.scheduled_at), addMinutes(new Date(), 30));
  const allergies = patient.known_allergies ? patient.known_allergies.split(",").map((a) => a.trim()).filter(Boolean) : [];

  return (
    <>
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.3 }}
        whileHover={shouldReduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
      >
        <Card className="relative overflow-hidden group">
          <button
            onClick={() => setNoteModalOpen(true)}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-fcn-text-light/30 hover:text-fcn-primary hover:bg-fcn-primary/10 transition-colors"
            title="Add private note"
          >
            <FileText className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 mb-3">
            <Avatar name={patient.full_name} role="patient" size="md" imageUrl={patient.photo_url} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark truncate">
                  {patient.full_name}
                </h4>
                {patient.age !== null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-fcn-primary/10 text-fcn-primary font-medium">
                    {patient.age}y
                  </span>
                )}
                {patient.blood_type && (
                  <span className={clsx(
                    "text-[10px] px-1.5 py-0.5 rounded font-bold",
                    patient.blood_type === "O+" ? "bg-green-100 text-green-700" :
                    patient.blood_type === "A+" ? "bg-blue-100 text-blue-700" :
                    "bg-fcn-danger/10 text-fcn-danger"
                  )}>
                    {patient.blood_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(allergies.length > 0 || patient.chronic_conditions.length > 0) && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-1 mb-3"
            >
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {allergies.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-fcn-danger/10 text-fcn-danger">
                      <AlertTriangle className="h-2.5 w-2.5" /> {a}
                    </span>
                  ))}
                </div>
              )}
              {patient.chronic_conditions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {patient.chronic_conditions.map((c, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-fcn-accent/10 text-fcn-accent">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          <div className="flex items-center gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 mb-3 p-2 rounded-lg bg-fcn-primary/5">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {format(parseISO(patient.next_appointment.scheduled_at), "MMM d, h:mm a")}
            </span>
            <Badge variant={patient.next_appointment.status === "confirmed" ? "success" : "info"} size="sm">
              {patient.next_appointment.type}
            </Badge>
          </div>

          {isNowOrSoon && (
            <Button
              size="sm"
              className="w-full mb-2 animate-pulse"
              onClick={() => navigate(`/consultation/${patient.next_appointment.id}`)}
            >
              <Video className="h-3.5 w-3.5" /> Join Now
            </Button>
          )}

          {patient.vitals_summary && (
            <div className="flex items-center gap-3 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 border-t border-fcn-primary/5 pt-2">
              {patient.vitals_summary.bp_systolic && (
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-fcn-primary" />
                  {patient.vitals_summary.bp_systolic}/{patient.vitals_summary.bp_diastolic}
                </span>
              )}
              {patient.vitals_summary.heart_rate_bpm && (
                <span>HR: {patient.vitals_summary.heart_rate_bpm}</span>
              )}
              {patient.vitals_summary.spo2_percent && (
                <span>SpO2: {patient.vitals_summary.spo2_percent}%</span>
              )}
            </div>
          )}

          <div className="mt-2">
            <button
              onClick={() => navigate(`/doctor/patients/${patient.patient_id}`)}
              className="text-xs text-fcn-primary hover:underline"
            >
              View Full Records →
            </button>
          </div>
        </Card>
      </motion.div>

      {noteModalOpen && (
        <DoctorNoteModal
          patientId={patient.patient_id}
          patientName={patient.full_name}
          appointmentId={patient.next_appointment.id}
          onClose={() => setNoteModalOpen(false)}
        />
      )}
    </>
  );
};
