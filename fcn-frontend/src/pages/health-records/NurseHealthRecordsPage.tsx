import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Search, Stethoscope, Activity, Users } from "lucide-react";
import { PageTransition } from "@/components/animations/PageTransition";
import { NursePatientCard } from "@/components/health-records/NursePatientCard";
import { healthRecordsService } from "@/services/health-records.service";

interface NursePatient {
  patient_id: string;
  full_name: string;
  phone: string;
  latest_vitals: {
    bp_systolic: number | null;
    bp_diastolic: number | null;
    spo2_percent: number | null;
    heart_rate_bpm: number | null;
    temperature_celsius: number | null;
    recorded_at: string | null;
  } | null;
  appointment_date: string;
}

const NurseHealthRecordsPage = () => {
  const [patients, setPatients] = useState<NursePatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await healthRecordsService.getNursePatients();
      setPatients((res as any).data ?? []);
    } catch {
      setError("Failed to load patients. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const criticalCount = patients.filter(
    (p) => p.latest_vitals?.spo2_percent != null && p.latest_vitals.spo2_percent < 95
  ).length;

  const withVitalsCount = patients.filter((p) => p.latest_vitals != null).length;

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            Patient Vitals
          </h1>
          <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            View and record vitals for your assigned patients
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/20"
          >
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-medium underline">Dismiss</button>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-fcn-primary/10 bg-white p-4 dark:bg-fcn-dark">
            <div className="flex items-center gap-2 text-fcn-accent">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Total Patients</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {isLoading ? "—" : patients.length}
            </p>
          </div>
          <div className="rounded-xl border border-fcn-primary/10 bg-white p-4 dark:bg-fcn-dark">
            <div className="flex items-center gap-2 text-emerald-500">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">With Vitals</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {isLoading ? "—" : withVitalsCount}
            </p>
          </div>
          <div className="rounded-xl border border-red-200 bg-white p-4 dark:border-red-800 dark:bg-fcn-dark">
            <div className="flex items-center gap-2 text-red-500">
              <Stethoscope className="h-4 w-4" />
              <span className="text-xs font-medium">Critical</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-red-500">
              {isLoading ? "—" : criticalCount}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-text-light/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients by name or phone..."
            className="h-11 w-full rounded-xl border border-fcn-primary/15 bg-white pl-10 pr-4 text-sm text-fcn-text-light outline-none transition placeholder:text-fcn-text-light/40 focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/25 dark:bg-fcn-dark dark:text-fcn-text-dark"
          />
        </div>

        {/* Patient Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-fcn-primary/10 bg-white p-4 dark:bg-fcn-dark">
                <div className="mb-3 h-4 w-32 rounded bg-fcn-primary/10" />
                <div className="mb-2 h-3 w-24 rounded bg-fcn-primary/10" />
                <div className="h-3 w-20 rounded bg-fcn-primary/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-fcn-primary/10 bg-white p-8 text-center dark:bg-fcn-dark">
            <Users className="mx-auto mb-3 h-10 w-10 text-fcn-text-light/20 dark:text-fcn-text-dark/20" />
            <p className="text-sm font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              {search ? "No patients match your search" : "No patients assigned yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((patient) => (
              <NursePatientCard
                key={patient.patient_id}
                patientId={patient.patient_id}
                fullName={patient.full_name}
                phone={patient.phone}
                latestVitals={patient.latest_vitals}
                appointmentDate={patient.appointment_date}
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default NurseHealthRecordsPage;
