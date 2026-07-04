import { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Droplets, Thermometer, Wind, Activity, Weight, Download, Plus, X } from "lucide-react";
import { PageTransition } from "@/components/animations/PageTransition";
import { VitalSummaryCard } from "@/components/health-records/VitalSummaryCard";
import { VitalsChart } from "@/components/health-records/VitalsChart";
import { VitalsEntryForm, type VitalsEntryData } from "@/components/health-records/VitalsEntryForm";
import { VitalsHistoryTable } from "@/components/health-records/VitalsHistoryTable";
import { SpO2Alert } from "@/components/health-records/SpO2Alert";
import { Button } from "@/components/ui/Button";
import { healthRecordsService } from "@/services/health-records.service";
import { useAuthStore } from "@/store/auth.store";
import { classifyVital, classifySpo2 } from "@/utils/vitals-classifier";
import { generateVitalsReport, type VitalsPDFData } from "@/utils/pdf-generator";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: string) {
  const dt = new Date(d);
  return `${months[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}

function fmtTimeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const HealthRecordsPage = () => {
  const { patientId: routePatientId } = useParams<{ patientId?: string }>();
  const user = useAuthStore((s) => s.user);
  const patientId = routePatientId ?? user?.id ?? "";

  const [latest, setLatest] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!patientId) return;
    setIsLoadingLatest(true);
    setIsLoadingTrends(true);
    setIsLoadingHistory(true);
    try {
      const [latestRes, trendsRes, historyRes] = await Promise.all([
        healthRecordsService.getLatestVitals(patientId),
        healthRecordsService.getVitalsTrends(patientId),
        healthRecordsService.getVitalsHistory(patientId)
      ]);
      setLatest((latestRes as any).data ?? null);
      setTrends((trendsRes as any).data ?? null);
      setHistory((historyRes as any).data ?? []);
    } catch (err) {
      setError("Failed to load vitals data");
    } finally {
      setIsLoadingLatest(false);
      setIsLoadingTrends(false);
      setIsLoadingHistory(false);
    }
  }, [patientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (data: VitalsEntryData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await healthRecordsService.recordVitals(data);
      setShowForm(false);
      await fetchAll();
    } catch (err) {
      setError("Failed to save vitals. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await healthRecordsService.exportVitalsPDFData(patientId);
      await generateVitalsReport((res as any).data as VitalsPDFData);
    } catch {
      setError("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const latestBp = latest?.bp;
  const latestGlucose = latest?.glucose;
  const latestHeartRate = latest?.heart_rate;
  const latestTemp = latest?.temperature;
  const latestSpo2 = latest?.spo2;
  const latestWeight = latest?.weight;
  const latestBmi = latest?.bmi;

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {routePatientId && (
              <Link
                to="/health-records/nurse"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-fcn-primary/15 text-fcn-text-light/60 hover:bg-fcn-primary/5 dark:text-fcn-text-dark/60"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                {routePatientId ? "Patient Vitals" : "Health Records"}
              </h1>
              <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                {routePatientId ? "Recording vitals for patient" : "Track and manage your vital signs"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              loading={isExporting}
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? (
                <><X className="h-4 w-4" /> Close</>
              ) : (
                <><Plus className="h-4 w-4" /> Record Vitals</>
              )}
            </Button>
          </div>
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

        {/* SpO2 Alert on Summary */}
        {latestSpo2?.value != null && classifySpo2(latestSpo2.value).status === "critical" && (
          <SpO2Alert value={latestSpo2.value} context="summary" />
        )}

        {/* Form Toggle */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-fcn-primary/10 bg-white p-4 dark:bg-fcn-dark">
              <h3 className="mb-4 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                Record New Vitals
              </h3>
              <VitalsEntryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </div>
          </motion.div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <VitalSummaryCard
            label="Blood Pressure"
            value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : "—"}
            unit="mmHg"
            classification={latestBp ? classifyVital("bp", latestBp.systolic, latestBp.diastolic) : null}
            icon={<Heart className="h-4 w-4" />}
            recordedAt={latestBp?.recorded_at ? fmtTimeAgo(latestBp.recorded_at) : null}
            isLoading={isLoadingLatest}
          />
          <VitalSummaryCard
            label="Blood Glucose"
            value={latestGlucose ? `${latestGlucose.value}` : "—"}
            unit="mg/dL"
            classification={latestGlucose ? classifyVital("glucose", latestGlucose.value) : null}
            icon={<Droplets className="h-4 w-4" />}
            recordedAt={latestGlucose?.recorded_at ? fmtTimeAgo(latestGlucose.recorded_at) : null}
            isLoading={isLoadingLatest}
          />
          <VitalSummaryCard
            label="Heart Rate"
            value={latestHeartRate ? `${latestHeartRate.value}` : "—"}
            unit="bpm"
            classification={latestHeartRate ? classifyVital("heart_rate", latestHeartRate.value) : null}
            icon={<Activity className="h-4 w-4" />}
            recordedAt={latestHeartRate?.recorded_at ? fmtTimeAgo(latestHeartRate.recorded_at) : null}
            isLoading={isLoadingLatest}
          />
          <VitalSummaryCard
            label="Temperature"
            value={latestTemp ? `${latestTemp.value}` : "—"}
            unit="°C"
            classification={latestTemp ? classifyVital("temperature", latestTemp.value) : null}
            icon={<Thermometer className="h-4 w-4" />}
            recordedAt={latestTemp?.recorded_at ? fmtTimeAgo(latestTemp.recorded_at) : null}
            isLoading={isLoadingLatest}
          />
          <VitalSummaryCard
            label="Oxygen Saturation"
            value={latestSpo2 ? `${latestSpo2.value}` : "—"}
            unit="%"
            classification={latestSpo2 ? classifyVital("spo2", latestSpo2.value) : null}
            icon={<Wind className="h-4 w-4" />}
            recordedAt={latestSpo2?.recorded_at ? fmtTimeAgo(latestSpo2.recorded_at) : null}
            isLoading={isLoadingLatest}
          />
          <VitalSummaryCard
            label="BMI"
            value={latestBmi?.value != null ? `${latestBmi.value}` : latestWeight?.value != null ? "—" : "—"}
            unit="kg/m²"
            classification={latestBmi?.value != null ? classifyVital("bmi", latestBmi.value) : null}
            icon={<Weight className="h-4 w-4" />}
            recordedAt={latestBmi?.recorded_at ? fmtTimeAgo(latestBmi.recorded_at) : null}
            isLoading={isLoadingLatest}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <VitalsChart
            type="bp"
            data={trends?.bp ?? []}
            title="Blood Pressure (7-Day Trend)"
            unit="mmHg"
            isLoading={isLoadingTrends}
          />
          <VitalsChart
            type="glucose"
            data={trends?.glucose ?? []}
            title="Blood Glucose (7-Day Trend)"
            unit="mg/dL"
            isLoading={isLoadingTrends}
          />
          <VitalsChart
            type="temperature"
            data={trends?.temperature ?? []}
            title="Temperature (7-Day Trend)"
            unit="°C"
            isLoading={isLoadingTrends}
          />
          <VitalsChart
            type="weight"
            data={trends?.weight ?? []}
            title="Weight (7-Day Trend)"
            unit="kg"
            isLoading={isLoadingTrends}
          />
        </div>

        {/* History Table */}
        <VitalsHistoryTable
          records={history}
          isLoading={isLoadingHistory}
        />
      </div>
    </PageTransition>
  );
};

export default HealthRecordsPage;
