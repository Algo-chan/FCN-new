import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import { Users, Calendar, Activity, ChevronRight, Search, Stethoscope } from "lucide-react";
import { clsx } from "clsx";
import { getActivePatients, getPreviousPatients, type ActivePatient, type PreviousPatient } from "@/services/doctor-dashboard.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

const tabs = [
  { key: "active", label: "Active Patients", icon: Activity },
  { key: "previous", label: "Previous Patients", icon: Users },
] as const;

type Tab = (typeof tabs)[number]["key"];

const VitalBadge = ({ label, value, unit }: { label: string; value: number | null; unit: string }) => {
  if (value == null) return null;
  const isWarning =
    (label === "BP" && (value < 90 || value > 140)) ||
    (label === "HR" && (value < 60 || value > 100)) ||
    (label === "Temp" && (value < 36.1 || value > 37.5)) ||
    (label === "SpO2" && value < 95);
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">{label}</span>
      <span className={clsx("font-medium", isWarning ? "text-fcn-warning" : "text-fcn-text-light dark:text-fcn-text-dark")}>
        {value}{unit}
      </span>
    </div>
  );
};

const ActivePatientCard = ({ patient, onView }: { patient: ActivePatient; onView: (patientId: string) => void }) => (
  <Card hoverable className="space-y-3">
    <div className="flex items-start gap-3">
      <Avatar name={patient.full_name} imageUrl={patient.photo_url} role="patient" size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-fcn-text-light dark:text-fcn-text-dark truncate">{patient.full_name}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          {patient.age != null && <span>Age {patient.age}</span>}
          {patient.blood_type && (
            <span className="rounded-full bg-fcn-danger/10 px-2 py-0.5 text-fcn-danger font-medium">{patient.blood_type}</span>
          )}
        </div>
      </div>
      <Button size="sm" variant="ghost" icon={<ChevronRight className="h-4 w-4" />} onClick={() => onView(patient.patient_id)}>
        View
      </Button>
    </div>

    {patient.chronic_conditions.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {patient.chronic_conditions.slice(0, 3).map((c) => (
          <span key={c} className="rounded-full bg-fcn-warning/10 px-2 py-0.5 text-xs text-fcn-warning">{c}</span>
        ))}
      </div>
    )}

    {patient.vitals_summary && (
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-fcn-primary/5 p-2">
        <VitalBadge label="BP" value={patient.vitals_summary.bp_systolic} unit={`/${patient.vitals_summary.bp_diastolic ?? ""}`} />
        <VitalBadge label="HR" value={patient.vitals_summary.heart_rate_bpm} unit=" bpm" />
        <VitalBadge label="SpO2" value={patient.vitals_summary.spo2_percent} unit="%" />
        <VitalBadge label="Temp" value={patient.vitals_summary.temperature_celsius} unit="°" />
        <VitalBadge label="Glucose" value={patient.vitals_summary.blood_glucose_mg_dl} unit=" mg/dL" />
      </div>
    )}

    {patient.next_appointment && (
      <div className="flex items-center gap-2 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          Next: {format(parseISO(patient.next_appointment.scheduled_at), "MMM d, h:mm a")} — {patient.next_appointment.status}
        </span>
      </div>
    )}
  </Card>
);

const PreviousPatientRow = ({ patient }: { patient: PreviousPatient }) => (
  <div className="flex items-center gap-4 rounded-lg border border-fcn-primary/5 bg-white/50 px-4 py-3 dark:bg-fcn-dark/50 hover:bg-fcn-primary/5 transition-colors">
    <Avatar name={patient.full_name} role="patient" size="sm" />
    <div className="flex-1 min-w-0">
      <p className="font-medium text-fcn-text-light dark:text-fcn-text-dark truncate">{patient.full_name}</p>
      <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
        {patient.age != null ? `Age ${patient.age}` : "Age unknown"} • {patient.total_consultations} consultation{patient.total_consultations !== 1 ? "s" : ""}
      </p>
    </div>
    <div className="text-right">
      <Badge variant={patient.last_appointment_type === "remote" ? "info" : "success"} size="sm">
        {patient.last_appointment_type.replace("_", " ")}
      </Badge>
      <p className="mt-1 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
        {format(parseISO(patient.last_consultation), "MMM d, yyyy")}
      </p>
    </div>
  </div>
);

const DoctorPatientsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: activeData, isLoading: loadingActive } = useQuery({
    queryKey: ["doctor-active-patients"],
    queryFn: () => getActivePatients(),
  });

  const { data: prevData, isLoading: loadingPrev } = useQuery({
    queryKey: ["doctor-previous-patients", page],
    queryFn: () => getPreviousPatients(page),
  });

  const activePatients = (activeData as any)?.data ?? [];
  const previousPatients = (prevData as any)?.data ?? [];

  const filteredActive = activePatients.filter((p: ActivePatient) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPrevious = previousPatients.filter((p: PreviousPatient) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">My Patients</h1>
        <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          {activePatients.length} active • {previousPatients.length} previous
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-full border border-fcn-primary/10 bg-fcn-primary/5 p-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                className={clsx(
                  "relative z-10 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.key ? "text-white" : "text-fcn-text-light/60 dark:text-fcn-text-dark/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <motion.span
                    layoutId="patientsTab"
                    className="absolute inset-0 rounded-full bg-fcn-primary -z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-text-light/30" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-fcn-primary/10 bg-white/80 py-2 pl-9 pr-3 text-sm text-fcn-text-light placeholder:text-fcn-text-light/30 focus:border-fcn-primary focus:outline-none focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark/70 dark:text-fcn-text-dark dark:placeholder:text-fcn-text-dark/30 sm:w-64"
          />
        </div>
      </div>

      {activeTab === "active" && (
        <>
          {loadingActive ? (
            <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
          ) : filteredActive.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-fcn-text-light/20 dark:text-fcn-text-dark/20 mb-4" />
              <p className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">No active patients</p>
              <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">Patients with upcoming appointments will appear here</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredActive.map((p: ActivePatient) => (
                <ActivePatientCard key={p.patient_id} patient={p} onView={(id) => navigate(`/doctor/patients/${id}`)} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "previous" && (
        <>
          {loadingPrev ? (
            <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
          ) : filteredPrevious.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <Stethoscope className="h-12 w-12 text-fcn-text-light/20 dark:text-fcn-text-dark/20 mb-4" />
              <p className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">No previous patients</p>
              <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">Completed consultations will appear here</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredPrevious.map((p: PreviousPatient) => (
                <PreviousPatientRow key={p.patient_id} patient={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorPatientsPage;
