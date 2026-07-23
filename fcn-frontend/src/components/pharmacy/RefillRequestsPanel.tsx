import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, X, MessageSquare, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { pharmacyService } from "@/services/pharmacy.service";
import { formatDate } from "@/utils/formatters";
import type { RefillRequest } from "@/types";

export const RefillRequestsPanel = () => {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { playSuccess, playNotification } = useSound();
  const { addToast } = useNotifications();
  const [declineNotes, setDeclineNotes] = useState<Record<string, string>>({});
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-refill-requests"],
    queryFn: () => pharmacyService.getDoctorRefillRequests()
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => pharmacyService.respondToRefillRequest(id, "APPROVED"),
    onSuccess: () => {
      playSuccess();
      addToast({ type: "success", title: "Refill request approved" });
      queryClient.invalidateQueries({ queryKey: ["doctor-refill-requests"] });
    },
    onError: (err: any) => {
      addToast({
        type: "danger", title: "Failed to approve",
        message: err?.response?.data?.error?.message ?? "Please try again"
      });
    }
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      pharmacyService.respondToRefillRequest(id, "DECLINED", note),
    onSuccess: () => {
      playNotification();
      addToast({ type: "info", title: "Refill request declined" });
      queryClient.invalidateQueries({ queryKey: ["doctor-refill-requests"] });
      setDecliningId(null);
    },
    onError: (err: any) => {
      addToast({
        type: "danger", title: "Failed to decline",
        message: err?.response?.data?.error?.message ?? "Please try again"
      });
    }
  });

  const requests = data?.data ?? [];
  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-8">
        <Spinner />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
          Pending Refill Requests
        </h2>
        {pendingRequests.length > 0 && (
          <Badge variant="warning">{pendingRequests.length} Pending</Badge>
        )}
      </div>

      {pendingRequests.length === 0 ? (
        <Card className="p-8 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No pending refill requests
        </Card>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <motion.div
                key={request.id}
                layout
                initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
              >
                <Card>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {request.patient?.full_name ?? "Patient"}
                        </p>
                        <p className="font-mono text-xs text-fcn-primary">
                          {request.prescription?.rx_reference}
                        </p>
                        {request.prescription?.medications && (
                          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                            {request.prescription.medications.map((m) => m.drug_name).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                        <Clock className="h-3 w-3" />
                        {formatDate(request.requested_at, "MMM d, h:mm a")}
                      </div>
                    </div>

                    {request.patient_note && (
                      <div className="flex items-start gap-2 rounded-md bg-fcn-primary/5 p-2.5 text-sm">
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-fcn-primary" />
                        <p className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                          {request.patient_note}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        icon={<CheckCircle className="h-4 w-4" />}
                        loading={approveMutation.isPending && approveMutation.variables === request.id}
                        onClick={() => approveMutation.mutate(request.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<X className="h-4 w-4" />}
                        onClick={() => setDecliningId(decliningId === request.id ? null : request.id)}
                      >
                        Decline
                      </Button>
                    </div>

                    {decliningId === request.id && (
                      <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <textarea
                          value={declineNotes[request.id] ?? ""}
                          onChange={(e) =>
                            setDeclineNotes((prev) => ({ ...prev, [request.id]: e.target.value }))
                          }
                          placeholder="Reason for declining (optional)..."
                          className="w-full rounded-lg border border-fcn-primary/20 bg-transparent p-2.5 text-sm focus:border-fcn-accent focus:outline-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="danger"
                            loading={declineMutation.isPending}
                            onClick={() =>
                              declineMutation.mutate({ id: request.id, note: declineNotes[request.id] })
                            }
                          >
                            Decline with Note
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDecliningId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
