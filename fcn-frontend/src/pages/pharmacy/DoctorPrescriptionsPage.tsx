import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileText, Activity, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { FadeIn } from "@/components/animations/FadeIn";
import { RefillRequestsPanel } from "@/components/pharmacy/RefillRequestsPanel";
import { pharmacyService } from "@/services/pharmacy.service";
import { formatDate } from "@/utils/formatters";
import type { PrescriptionWithMedications } from "@/types";

const DoctorPrescriptionsPage = () => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithMedications | null>(null);

  const prescriptionsQuery = useQuery({
    queryKey: ["doctor-prescriptions"],
    queryFn: () => pharmacyService.getDoctorPrescriptions()
  });

  const refillRequestsQuery = useQuery({
    queryKey: ["doctor-refill-requests"],
    queryFn: () => pharmacyService.getDoctorRefillRequests()
  });

  const prescriptions = prescriptionsQuery.data?.data ?? [];
  const refillRequests = refillRequestsQuery.data?.data ?? [];
  const pendingCount = refillRequests.filter((r) => r.status === "PENDING").length;

  const stats = {
    total: prescriptions.length,
    active: prescriptions.filter((p) => p.status === "active").length,
    refillRequests: pendingCount
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              Prescriptions Issued
            </h1>
            <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              Manage prescriptions and refill requests
            </p>
          </div>
          <Badge variant="warning" size="md">
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            {pendingCount} Pending
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Issued", value: stats.total, icon: ClipboardList, color: "text-fcn-primary" },
            { label: "Active", value: stats.active, icon: Activity, color: "text-fcn-success" },
            { label: "Refill Requests", value: stats.refillRequests, icon: RefreshCw, color: "text-fcn-warning" }
          ].map((stat) => (
            <Card key={stat.label} className="flex items-center gap-4">
              <div className={`rounded-lg bg-fcn-primary/10 p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <RefillRequestsPanel />

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
            All Prescriptions
          </h2>

          {prescriptionsQuery.isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Spinner />
            </div>
          ) : prescriptions.length === 0 ? (
            <Card className="p-8 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
              No prescriptions issued yet
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-fcn-primary/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-fcn-primary/5">
                  <tr>
                    <th className="px-4 py-3 font-medium">Patient</th>
                    <th className="px-4 py-3 font-medium">RX Reference</th>
                    <th className="px-4 py-3 font-medium">Issued</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Medications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fcn-primary/10">
                  {prescriptions.map((p) => (
                    <motion.tr
                      key={p.id}
                      initial={shouldReduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="cursor-pointer transition-colors hover:bg-fcn-primary/5"
                      onClick={() => setSelectedPrescription(p)}
                    >
                      <td className="px-4 py-3">{(p as any).patient?.full_name ?? "Patient"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-fcn-primary">{p.rx_reference}</td>
                      <td className="px-4 py-3 text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                        {formatDate(p.issued_at)}
                      </td>
                      <td className="px-4 py-3 text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                        {formatDate(p.expires_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            p.status === "active" ? "success" :
                            p.status === "refill_due" ? "warning" :
                            p.status === "expired" ? "danger" :
                            p.status === "dispensed" ? "info" : "neutral"
                          }
                          size="sm"
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                        {p.medications?.length ?? 0} items
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </FadeIn>
  );
};

export default DoctorPrescriptionsPage;
