import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Home, QrCode, ClipboardList, Download, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/animations/FadeIn";
import { QRScannerPortal } from "@/components/pharmacy/QRScannerPortal";
import { pharmacyService } from "@/services/pharmacy.service";
import { formatDate } from "@/utils/formatters";
import { useAuthStore } from "@/store/auth.store";
import type { DispenseRecord } from "@/types";

type AdminView = "dashboard" | "verify" | "history";

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
  const [view, setView] = useState<AdminView>("dashboard");

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
    { id: "dashboard" as AdminView, label: "Dashboard", icon: Home },
    { id: "verify" as AdminView, label: "Verify Prescription", icon: QrCode },
    { id: "history" as AdminView, label: "Dispense History", icon: ClipboardList }
  ];

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              Pharmacy Admin Portal
            </h1>
            <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              Managing your pharmacy operations
            </p>
          </div>
        </div>

        <div className="flex gap-1 rounded-lg border border-fcn-primary/20 p-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                view === item.id
                  ? "text-white"
                  : "text-fcn-text-light/60 hover:text-fcn-primary dark:text-fcn-text-dark/60"
              }`}
            >
              {view === item.id && (
                <motion.div
                  layoutId="admin-tab"
                  className="absolute inset-0 rounded-md bg-fcn-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </div>

        {view === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.full_name?.split(" ")[0] ?? "Pharmacist"}
              </h2>
              <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                Managing pharmacy operations
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="text-center">
                <p className="text-3xl font-bold text-fcn-primary">{dispensedToday.length}</p>
                <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">Dispensed Today</p>
              </Card>
              <Card className="text-center">
                <p className="text-3xl font-bold text-fcn-success">{dispensedThisWeek.length}</p>
                <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">Dispensed This Week</p>
              </Card>
              <Card className="text-center">
                <p className="text-3xl font-bold text-fcn-accent">{records.length}</p>
                <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">Total All Time</p>
              </Card>
            </div>
          </div>
        )}

        {view === "verify" && <QRScannerPortal />}

        {view === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Dispense History</h2>
              <Button
                variant="ghost"
                size="sm"
                icon={<Download className="h-4 w-4" />}
                onClick={() => exportToCSV(records)}
                disabled={records.length === 0}
              >
                Export CSV
              </Button>
            </div>

            {dispenseHistoryQuery.isLoading ? (
              <Card className="flex items-center justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-fcn-accent border-r-transparent" />
              </Card>
            ) : records.length === 0 ? (
              <Card className="p-8 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                <ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-40" />
                No dispense records yet
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-fcn-primary/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-fcn-primary/5">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Patient Name</th>
                      <th className="px-4 py-3 font-medium">RX Reference</th>
                      <th className="px-4 py-3 font-medium">Medications</th>
                      <th className="px-4 py-3 font-medium">Dispensed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fcn-primary/10">
                    {records.map((record) => (
                      <motion.tr
                        key={record.id}
                        initial={shouldReduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="transition-colors hover:bg-fcn-primary/5"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                          {formatDate(record.dispensed_at)}
                        </td>
                        <td className="px-4 py-3 font-medium">{(record as any).patient_name ?? "Unknown"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-fcn-primary">
                          {(record as any).rx_reference ?? "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {record.medications_dispensed.map((med, i) => (
                              <Badge key={i} variant="info" size="sm">{med}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                          {(record as any).dispensed_by_name ?? "Unknown"}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </FadeIn>
  );
};

export default PharmacyAdminPortalPage;
