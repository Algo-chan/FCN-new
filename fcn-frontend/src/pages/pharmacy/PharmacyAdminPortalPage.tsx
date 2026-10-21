import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { QrCode, ClipboardList, Download, Pill, CheckCircle2, ShieldCheck, Clock, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/animations/FadeIn";
import { QRScannerPortal } from "@/components/pharmacy/QRScannerPortal";
import { pharmacyService } from "@/services/pharmacy.service";
import { formatDate } from "@/utils/formatters";
import { useAuthStore } from "@/store/auth.store";
import type { DispenseRecord } from "@/types";

type AdminView = "verify" | "history";

const exportToCSV = (records: DispenseRecord[]) => {
  const headers = ["Date", "Patient Name", "RX Reference", "Medications", "Dispensed By", "Notes"];
  const rows = records.map((r) => [
    formatDate(r.dispensed_at),
    (r as any).patient_name ?? "",
    (r as any).rx_reference ?? "",
    r.medications_dispensed.join("; "),
    (r as any).dispensed_by_name ?? "",
    r.notes ?? ""
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dispense-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const PharmacyAdminPortalPage = () => {
  const shouldReduceMotion = useReducedMotion();
  const user = useAuthStore((state) => state.user);
  const [view, setView] = useState<AdminView>("verify");

  const dispenseHistoryQuery = useQuery({
    queryKey: ["dispense-history"],
    queryFn: () => pharmacyService.getDispenseHistory()
  });

  const records = dispenseHistoryQuery.data?.data ?? [];

  const todayStr = new Date().toISOString().slice(0, 10);
  const dispensedToday = records.filter((r) => r.dispensed_at.startsWith(todayStr));
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dispensedThisWeek = records.filter((r) => r.dispensed_at >= weekAgo);

  const navItems = [
    { id: "verify" as AdminView, label: "Scan & Verify Prescription", icon: QrCode },
    { id: "history" as AdminView, label: "Dispense Log & Records", icon: ClipboardList }
  ];

  return (
    <FadeIn>
      <div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                  Pharmacy Verification Portal
                </h1>
                <Badge variant="success" size="sm">Partner Pharmacist</Badge>
              </div>
              <p className="text-xs sm:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                {user?.full_name ?? "Pharmacist"} — Verify e-prescriptions and record dispenses
              </p>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="p-4 sm:p-5 rounded-2xl text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Clock className="h-5 w-5" />
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-black text-fcn-text-light dark:text-fcn-text-dark">
              {dispensedToday.length}
            </p>
            <p className="text-xs font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
              Dispensed Today
            </p>
          </Card>
          <Card className="p-4 sm:p-5 rounded-2xl text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-black text-fcn-text-light dark:text-fcn-text-dark">
              {dispensedThisWeek.length}
            </p>
            <p className="text-xs font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
              Dispensed This Week
            </p>
          </Card>
          <Card className="p-4 sm:p-5 rounded-2xl text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-black text-fcn-text-light dark:text-fcn-text-dark">
              {records.length}
            </p>
            <p className="text-xs font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
              Total Recorded Dispenses
            </p>
          </Card>
        </div>

        {/* View Switcher Tab Pill */}
        <div className="flex rounded-xl bg-fcn-surface-light dark:bg-fcn-surface-dark border border-fcn-primary/10 p-1 max-w-md">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                view === item.id
                  ? "text-white shadow-sm"
                  : "text-fcn-text-light/60 hover:text-fcn-text-light dark:text-fcn-text-dark/60"
              }`}
            >
              {view === item.id && (
                <motion.div
                  layoutId="pharmacy-admin-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-fcn-primary to-fcn-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </div>

        {view === "verify" && (
          <div className="rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark p-4 sm:p-6 shadow-sm">
            <QRScannerPortal />
          </div>
        )}

        {view === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                Dispense Audit History
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportToCSV(records)}
                disabled={records.length === 0}
                className="h-9 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Export CSV
              </Button>
            </div>

            {dispenseHistoryQuery.isLoading ? (
              <Card className="flex items-center justify-center p-12 rounded-2xl">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-fcn-accent border-r-transparent" />
              </Card>
            ) : records.length === 0 ? (
              <Card className="p-12 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50 rounded-2xl">
                <ClipboardList className="mx-auto mb-2 h-10 w-10 text-fcn-primary/30" />
                <p className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">No dispense records yet</p>
                <p className="text-xs text-fcn-text-light/40 mt-1">Dispensed medications will be securely archived here.</p>
              </Card>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-fcn-surface-light dark:bg-fcn-dark border-b border-fcn-primary/10">
                      <tr>
                        <th className="px-4 py-3 font-bold text-fcn-text-light/60 dark:text-fcn-text-dark/60">Date</th>
                        <th className="px-4 py-3 font-bold text-fcn-text-light/60 dark:text-fcn-text-dark/60">Patient Name</th>
                        <th className="px-4 py-3 font-bold text-fcn-text-light/60 dark:text-fcn-text-dark/60">RX Reference</th>
                        <th className="px-4 py-3 font-bold text-fcn-text-light/60 dark:text-fcn-text-dark/60">Medications</th>
                        <th className="px-4 py-3 font-bold text-fcn-text-light/60 dark:text-fcn-text-dark/60">Dispensed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-fcn-primary/5">
                      {records.map((record) => (
                        <motion.tr
                          key={record.id}
                          initial={shouldReduceMotion ? false : { opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="transition-colors hover:bg-fcn-primary/5"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-fcn-text-light/60 dark:text-fcn-text-dark/60 font-medium">
                            {formatDate(record.dispensed_at)}
                          </td>
                          <td className="px-4 py-3 font-bold text-fcn-text-light dark:text-fcn-text-dark">
                            {(record as any).patient_name ?? "Unknown"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-fcn-primary">
                            {(record as any).rx_reference ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {record.medications_dispensed.map((med, i) => (
                                <Badge key={i} variant="info" size="sm">{med}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                            {(record as any).dispensed_by_name ?? "Pharmacist"}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </FadeIn>
  );
};

export default PharmacyAdminPortalPage;
