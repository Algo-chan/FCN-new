import { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Droplets,
  Thermometer,
  Wind,
  Activity,
  Weight,
  Download,
  Plus,
  X,
  Sparkles,
  TrendingUp,
  FileText
} from "lucide-react";
import { PageTransition } from "@/components/animations/PageTransition";
import { VitalSummaryCard } from "@/components/health-records/VitalSummaryCard";
import { VitalsChart } from "@/components/health-records/VitalsChart";
import { VitalsEntryForm, type VitalsEntryData } from "@/components/health-records/VitalsEntryForm";
import { VitalsHistoryTable } from "@/components/health-records/VitalsHistoryTable";
import { SpO2Alert } from "@/components/health-records/SpO2Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { healthRecordsService } from "@/services/health-records.service";
import { useAuthStore } from "@/store/auth.store";
import { classifyVital, classifySpo2 } from "@/utils/vitals-classifier";
import { generateVitalsReport, type VitalsPDFData } from "@/utils/pdf-generator";
import { fmtDate, fmtTimeAgo } from "@/utils/formatters";

const HAS_VITALS_KEY = "fcn_has_vitals";

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
  const [hasVitals, setHasVitals] = useState(() => localStorage.getItem(HAS_VITALS_KEY) === "true");

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
      const latestData = (latestRes as any).data ?? null;
      const trendsData = (trendsRes as any).data ?? null;
      const historyData = (historyRes as any).data ?? [];
      setLatest(latestData);
      setTrends(trendsData);
      setHistory(historyData);
      const exists = historyData.length > 0;
      setHasVitals(exists);
      localStorage.setItem(HAS_VITALS_KEY, String(exists));
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
      setHasVitals(true);
      localStorage.setItem(HAS_VITALS_KEY, "true");
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
      <div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {routePatientId && (
              <Link
                to="/health-records/nurse"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-fcn-primary/15 text-fcn-text-light/60 hover:bg-fcn-primary/5 dark:text-fcn-text-dark/60 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                  {routePatientId ? "Patient Vitals" : "Health Records & Vitals"}
                </h1>
                <Badge variant="success" size="sm">Live Trends</Badge>
              </div>
              <p className="text-xs sm:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                {routePatientId ? "Clinical monitoring and historical charts" : "Track blood pressure, glucose, SpO2, and vital signs"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {hasVitals && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                loading={isExporting}
                className="h-10 text-xs sm:text-sm"
              >
                <Download className="h-4 w-4 mr-1.5" />
                <span>Export PDF</span>
              </Button>
            )}
            <Button
              size="sm"
              variant={showForm ? "secondary" : "primary"}
              onClick={() => setShowForm(!showForm)}
              className="h-10 text-xs sm:text-sm"
            >
              {showForm ? (
                <>
                  <X className="h-4 w-4 mr-1.5" />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span>Record Vitals</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs font-bold underline ml-2">
              Dismiss
            </button>
          </motion.div>
        )}

        {/* SpO2 Alert on Summary */}
        {latestSpo2?.value != null && classifySpo2(latestSpo2.value).status === "critical" && (
          <SpO2Alert value={latestSpo2.value} context="summary" />
        )}

        {/* Form Modal/Expandable Drawer */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-fcn-primary/20 bg-white p-5 sm:p-6 shadow-md dark:bg-fcn-dark space-y-4">
                <div className="flex items-center justify-between border-b border-fcn-primary/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" />
                    <h3 className="text-base font-bold text-fcn-text-light dark:text-fcn-text-dark">
                      Record New Vital Signs
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-lg p-1 text-fcn-text-light/50 hover:bg-fcn-primary/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <VitalsEntryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!isLoadingLatest && !hasVitals && (
          <Card className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400"
            >
              <Heart className="h-10 w-10 fill-emerald-500/30" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                Start Tracking Your Health
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60 max-w-md mx-auto">
                Record your blood pressure, glucose, temperature, and pulse to unlock personalized trend charts and doctor-ready reports.
              </p>
            </div>
            <Button
              size="lg"
              variant="primary"
              onClick={() => setShowForm(true)}
              className="shadow-lg shadow-fcn-primary/25 h-12 px-6"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Record Your First Vitals
            </Button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-fcn-primary/10 text-left text-xs text-fcn-text-light/70 dark:text-fcn-text-dark/70">
              <div className="flex items-start gap-2">
                <span>💡</span>
                <span>Check BP at the same time daily for consistency</span>
              </div>
              <div className="flex items-start gap-2">
                <span>💡</span>
                <span>Record glucose fasting or 2 hours post meals</span>
              </div>
              <div className="flex items-start gap-2">
                <span>💡</span>
                <span>Your doctor can review these during consultations</span>
              </div>
            </div>
          </Card>
        )}

        {/* Summary Cards Grid */}
        {hasVitals && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/60 dark:text-fcn-text-dark/60 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-fcn-primary" />
                  Latest Vital Readings
                </h2>
                <span className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                  Updated in real time
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                <VitalSummaryCard
                  label="Blood Pressure"
                  value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : "—"}
                  unit="mmHg"
                  classification={latestBp ? classifyVital("bp", latestBp.systolic, latestBp.diastolic) : null}
                  icon={<Heart className="h-4 w-4" />}
                  recordedAt={latestBp?.recorded_at ? fmtTimeAgo(latestBp.recorded_at) : null}
                  isLoading={isLoadingLatest}
                  shareData={latestBp ? {
                    vitalName: "Blood Pressure",
                    value: `${latestBp.systolic}/${latestBp.diastolic}`,
                    unit: "mmHg",
                    status: classifyVital("bp", latestBp.systolic, latestBp.diastolic)?.label || "",
                    timeAgo: fmtTimeAgo(latestBp.recorded_at)
                  } : null}
                />
                <VitalSummaryCard
                  label="Blood Glucose"
                  value={latestGlucose ? `${latestGlucose.value}` : "—"}
                  unit="mg/dL"
                  classification={latestGlucose ? classifyVital("glucose", latestGlucose.value) : null}
                  icon={<Droplets className="h-4 w-4" />}
                  recordedAt={latestGlucose?.recorded_at ? fmtTimeAgo(latestGlucose.recorded_at) : null}
                  isLoading={isLoadingLatest}
                  shareData={latestGlucose ? {
                    vitalName: "Blood Glucose",
                    value: `${latestGlucose.value}`,
                    unit: "mg/dL",
                    status: classifyVital("glucose", latestGlucose.value)?.label || "",
                    timeAgo: fmtTimeAgo(latestGlucose.recorded_at)
                  } : null}
                />
                <VitalSummaryCard
                  label="Heart Rate"
                  value={latestHeartRate ? `${latestHeartRate.value}` : "—"}
                  unit="bpm"
                  classification={latestHeartRate ? classifyVital("heart_rate", latestHeartRate.value) : null}
                  icon={<Activity className="h-4 w-4" />}
                  recordedAt={latestHeartRate?.recorded_at ? fmtTimeAgo(latestHeartRate.recorded_at) : null}
                  isLoading={isLoadingLatest}
                  shareData={latestHeartRate ? {
                    vitalName: "Heart Rate",
                    value: `${latestHeartRate.value}`,
                    unit: "bpm",
                    status: classifyVital("heart_rate", latestHeartRate.value)?.label || "",
                    timeAgo: fmtTimeAgo(latestHeartRate.recorded_at)
                  } : null}
                />
                <VitalSummaryCard
                  label="Temperature"
                  value={latestTemp ? `${latestTemp.value}` : "—"}
                  unit="°C"
                  classification={latestTemp ? classifyVital("temperature", latestTemp.value) : null}
                  icon={<Thermometer className="h-4 w-4" />}
                  recordedAt={latestTemp?.recorded_at ? fmtTimeAgo(latestTemp.recorded_at) : null}
                  isLoading={isLoadingLatest}
                  shareData={latestTemp ? {
                    vitalName: "Temperature",
                    value: `${latestTemp.value}`,
                    unit: "°C",
                    status: classifyVital("temperature", latestTemp.value)?.label || "",
                    timeAgo: fmtTimeAgo(latestTemp.recorded_at)
                  } : null}
                />
                <VitalSummaryCard
                  label="Oxygen Saturation"
                  value={latestSpo2 ? `${latestSpo2.value}` : "—"}
                  unit="%"
                  classification={latestSpo2 ? classifyVital("spo2", latestSpo2.value) : null}
                  icon={<Wind className="h-4 w-4" />}
                  recordedAt={latestSpo2?.recorded_at ? fmtTimeAgo(latestSpo2.recorded_at) : null}
                  isLoading={isLoadingLatest}
                  shareData={latestSpo2 ? {
                    vitalName: "Oxygen Saturation",
                    value: `${latestSpo2.value}`,
                    unit: "%",
                    status: classifyVital("spo2", latestSpo2.value)?.label || "",
                    timeAgo: fmtTimeAgo(latestSpo2.recorded_at)
                  } : null}
                />
                <VitalSummaryCard
                  label="BMI"
                  value={latestBmi?.value != null ? `${latestBmi.value}` : latestWeight?.value != null ? "—" : "—"}
                  unit="kg/m²"
                  classification={latestBmi?.value != null ? classifyVital("bmi", latestBmi.value) : null}
                  icon={<Weight className="h-4 w-4" />}
                  recordedAt={latestBmi?.recorded_at ? fmtTimeAgo(latestBmi.recorded_at) : null}
                  isLoading={isLoadingLatest}
                  shareData={latestBmi?.value != null ? {
                    vitalName: "BMI",
                    value: `${latestBmi.value}`,
                    unit: "kg/m²",
                    status: classifyVital("bmi", latestBmi.value)?.label || "",
                    timeAgo: fmtTimeAgo(latestBmi.recorded_at)
                  } : null}
                />
              </div>
            </div>

            {/* Charts Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/60 dark:text-fcn-text-dark/60 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-fcn-accent" />
                  7-Day Trend Visualizer
                </h2>
              </div>
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
            </div>

            {/* History Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/60 dark:text-fcn-text-dark/60 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-fcn-primary" />
                  Historical Log
                </h2>
              </div>
              <VitalsHistoryTable
                records={history}
                isLoading={isLoadingHistory}
              />
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default HealthRecordsPage;
