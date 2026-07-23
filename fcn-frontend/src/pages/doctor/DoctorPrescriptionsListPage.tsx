import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { FileText, Pill, Clock, CheckCircle2, XCircle, AlertCircle, Search } from "lucide-react";
import { clsx } from "clsx";
import { pharmacyService } from "@/services/pharmacy.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useNotifications } from "@/hooks/useNotifications";

const tabs = [
  { key: "prescriptions", label: "Prescriptions", icon: FileText },
  { key: "refill-requests", label: "Refill Requests", icon: Pill },
] as const;

type Tab = (typeof tabs)[number]["key"];

const statusVariant: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  active: "success",
  refill_due: "warning",
  expired: "danger",
  cancelled: "danger",
  dispensed: "info",
  PENDING: "warning",
  APPROVED: "success",
  DECLINED: "danger",
};

const PrescriptionCard = ({ rx }: { rx: any }) => (
  <Card hoverable className="space-y-3">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={rx.patient?.full_name ?? "Patient"} role="patient" size="sm" />
        <div>
          <p className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">{rx.patient?.full_name ?? "Patient"}</p>
          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">{rx.rx_reference}</p>
        </div>
      </div>
      <Badge variant={statusVariant[rx.status] ?? "neutral"} size="sm">{rx.status.replace("_", " ")}</Badge>
    </div>

    {rx.medications?.length > 0 && (
      <div className="space-y-1">
        {rx.medications.map((med: any) => (
          <div key={med.id} className="flex items-center gap-2 text-xs">
            <Pill className="h-3 w-3 text-fcn-primary shrink-0" />
            <span className="text-fcn-text-light dark:text-fcn-text-dark font-medium">{med.drug_name}</span>
            <span className="text-fcn-text-light/40 dark:text-fcn-text-dark/40">{med.strength}</span>
          </div>
        ))}
      </div>
    )}

    <div className="flex items-center gap-4 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
      <div className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" />
        <span>Issued {format(parseISO(rx.issued_at), "MMM d, yyyy")}</span>
      </div>
      <span>Expires {format(parseISO(rx.expires_at), "MMM d, yyyy")}</span>
    </div>

    {rx.notes && (
      <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 line-clamp-2 italic">{rx.notes}</p>
    )}
  </Card>
);

const RefillRequestRow = ({ request }: { request: any }) => {
  const queryClient = useQueryClient();
  const { addToast } = useNotifications();

  const respondMutation = useMutation({
    mutationFn: ({ status, note }: { status: "APPROVED" | "DECLINED"; note?: string }) =>
      pharmacyService.respondToRefillRequest(request.id, status, note),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-refill-requests"] });
      addToast({ type: "success", title: vars.status === "APPROVED" ? "Refill approved" : "Refill declined" });
    },
    onError: () => {
      addToast({ type: "danger", title: "Failed to respond to refill request" });
    },
  });

  return (
    <Card hoverable className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={request.patient?.full_name ?? "Patient"} role="patient" size="sm" />
          <div>
            <p className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">{request.patient?.full_name ?? "Patient"}</p>
            <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              Rx: {request.prescription?.rx_reference ?? "N/A"}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant[request.status] ?? "neutral"} size="sm">
          {request.status.toLowerCase()}
        </Badge>
      </div>

      {request.prescription?.medications?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {request.prescription.medications.map((med: any, i: number) => (
            <span key={i} className="rounded-full bg-fcn-primary/10 px-2 py-0.5 text-xs text-fcn-primary">{med.drug_name}</span>
          ))}
        </div>
      )}

      {request.patient_note && (
        <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 italic">"{request.patient_note}"</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
          {format(parseISO(request.requested_at), "MMM d, yyyy 'at' h:mm a")}
        </p>
        {request.status === "PENDING" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              loading={respondMutation.isPending && respondMutation.variables?.status === "APPROVED"}
              onClick={() => respondMutation.mutate({ status: "APPROVED" })}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={respondMutation.isPending && respondMutation.variables?.status === "DECLINED"}
              onClick={() => respondMutation.mutate({ status: "DECLINED" })}
            >
              <XCircle className="h-3.5 w-3.5" />
              Decline
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

const DoctorPrescriptionsListPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("prescriptions");
  const [search, setSearch] = useState("");

  const { data: prescriptionsData, isLoading: loadingPrescriptions } = useQuery({
    queryKey: ["doctor-prescriptions"],
    queryFn: () => pharmacyService.getDoctorPrescriptions(),
  });

  const { data: refillData, isLoading: loadingRefills } = useQuery({
    queryKey: ["doctor-refill-requests"],
    queryFn: () => pharmacyService.getDoctorRefillRequests(),
  });

  const prescriptions = (prescriptionsData as any)?.data ?? [];
  const refillRequests = (refillData as any)?.data ?? [];

  const filteredPrescriptions = prescriptions.filter((rx: any) =>
    rx.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    rx.rx_reference?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRefills = refillRequests.filter((r: any) =>
    r.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.prescription?.rx_reference?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = refillRequests.filter((r: any) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Prescriptions Issued</h1>
        <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          {prescriptions.length} prescriptions issued • {pendingCount} pending refill{pendingCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-full border border-fcn-primary/10 bg-fcn-primary/5 p-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  "relative z-10 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.key ? "text-white" : "text-fcn-text-light/60 dark:text-fcn-text-dark/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.key === "refill-requests" && pendingCount > 0 && (
                  <span className="ml-1 rounded-full bg-fcn-danger px-1.5 py-0.5 text-[10px] font-bold text-white">{pendingCount}</span>
                )}
                {activeTab === tab.key && (
                  <motion.span
                    layoutId="rxTab"
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
            placeholder="Search by patient or Rx reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-fcn-primary/10 bg-white/80 py-2 pl-9 pr-3 text-sm text-fcn-text-light placeholder:text-fcn-text-light/30 focus:border-fcn-primary focus:outline-none focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark/70 dark:text-fcn-text-dark dark:placeholder:text-fcn-text-dark/30 sm:w-72"
          />
        </div>
      </div>

      {activeTab === "prescriptions" && (
        <>
          {loadingPrescriptions ? (
            <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
          ) : filteredPrescriptions.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-fcn-text-light/20 dark:text-fcn-text-dark/20 mb-4" />
              <p className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">No prescriptions issued</p>
              <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">Prescriptions you write during consultations will appear here</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrescriptions.map((rx: any) => (
                <PrescriptionCard key={rx.id} rx={rx} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "refill-requests" && (
        <>
          {loadingRefills ? (
            <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
          ) : filteredRefills.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-fcn-text-light/20 dark:text-fcn-text-dark/20 mb-4" />
              <p className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">No refill requests</p>
              <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">When patients request refills, they will appear here</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRefills.map((r: any) => (
                <RefillRequestRow key={r.id} request={r} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorPrescriptionsListPage;
