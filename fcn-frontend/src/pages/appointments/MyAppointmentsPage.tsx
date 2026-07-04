import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { clsx } from "clsx";
import {
  CalendarClock, Clock, Video, MapPin, User, XCircle, ArrowLeftRight,
  Stethoscope, FileText, CreditCard, ExternalLink
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { PageTransition } from "@/components/animations/PageTransition";
import { useNotifications } from "@/hooks/useNotifications";
import { appointmentsService } from "@/services/appointments.service";
import type { Appointment, AppointmentStatus } from "@/types";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "info" },
  scheduled: { label: "Scheduled", variant: "info" },
  in_session: { label: "In Session", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" }
};

const typeIcons: Record<string, typeof Video> = {
  remote: Video,
  in_person: MapPin,
  nurse_visit: User
};

const typeLabels: Record<string, string> = {
  remote: "Video Consultation",
  in_person: "In-Person Visit",
  nurse_visit: "Nurse Home Visit"
};

const tabs = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" }
] as const;

type TabKey = (typeof tabs)[number]["key"];

const MyAppointmentsPage = () => {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { addToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const { data: appointmentsData, isLoading, error } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: async () => {
      const res = await appointmentsService.getMyAppointments({ limit: 50 });
      return res.data ?? [];
    },
    staleTime: 15_000
  });

  const appointments = useMemo(() => {
    const all = appointmentsData ?? [];
    const now = new Date();

    switch (activeTab) {
      case "upcoming":
        return all.filter((a) =>
          ["pending", "confirmed", "scheduled", "in_session"].includes(a.status)
        );
      case "completed":
        return all.filter((a) => a.status === "completed");
      case "cancelled":
        return all.filter((a) => a.status === "cancelled");
      default:
        return all;
    }
  }, [appointmentsData, activeTab]);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAppointment) return;
      await appointmentsService.cancel(selectedAppointment.id, cancelReason || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      addToast({ type: "success", title: "Appointment cancelled" });
      setCancelModalOpen(false);
      setSelectedAppointment(null);
      setCancelReason("");
    },
    onError: () => {
      addToast({ type: "danger", title: "Failed to cancel appointment" });
    }
  });

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;
      const newScheduledAt = `${rescheduleDate}T${rescheduleTime}:00.000Z`;
      await appointmentsService.reschedule(
        selectedAppointment.id,
        newScheduledAt,
        rescheduleReason || undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      addToast({ type: "success", title: "Appointment rescheduled" });
      setRescheduleModalOpen(false);
      setSelectedAppointment(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
    },
    onError: () => {
      addToast({ type: "danger", title: "Failed to reschedule appointment" });
    }
  });

  const openCancelModal = useCallback((apt: Appointment) => {
    setSelectedAppointment(apt);
    setCancelReason("");
    setCancelModalOpen(true);
  }, []);

  const openRescheduleModal = useCallback((apt: Appointment) => {
    setSelectedAppointment(apt);
    setRescheduleDate("");
    setRescheduleTime("");
    setRescheduleReason("");
    setRescheduleModalOpen(true);
  }, []);

  const canCancel = (status: string) => ["pending", "confirmed", "scheduled"].includes(status);
  const canReschedule = (status: string) => ["pending", "confirmed", "scheduled"].includes(status);
  const canJoin = (status: string) => status === "in_session";

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              My Appointments
            </h1>
            <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              View and manage your appointments.
            </p>
          </div>
          <Button onClick={() => window.location.href = "/appointments/book"}>
            Book New
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border border-fcn-primary/10 bg-white/50 p-1 dark:bg-fcn-dark/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all",
                activeTab === tab.key
                  ? "bg-fcn-primary text-white shadow-sm"
                  : "text-fcn-text-light/60 hover:text-fcn-text-light dark:text-fcn-text-dark/60 dark:hover:text-fcn-text-dark"
              )}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span className="ml-1 opacity-60">
                  ({appointmentsData?.filter((a) => {
                    if (tab.key === "upcoming") return ["pending", "confirmed", "scheduled", "in_session"].includes(a.status);
                    if (tab.key === "completed") return a.status === "completed";
                    if (tab.key === "cancelled") return a.status === "cancelled";
                    return true;
                  }).length ?? 0})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CalendarClock className="h-12 w-12 text-fcn-text-light/30 dark:text-fcn-text-dark/30" />
            <h3 className="text-lg font-medium text-fcn-text-light dark:text-fcn-text-dark">
              No appointments found
            </h3>
            <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              {activeTab === "all" ? "Book your first appointment to get started." : "No appointments in this category."}
            </p>
            {activeTab === "all" && (
              <Button onClick={() => window.location.href = "/appointments/book"}>
                Book an Appointment
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {appointments.map((apt) => {
                const TypeIcon = typeIcons[apt.appointment_type] ?? Video;
                const config = statusConfig[apt.status] ?? statusConfig.pending;
                const scheduledDate = parseISO(apt.scheduled_at);
                const isPast = isBefore(scheduledDate, new Date());

                return (
                  <motion.div
                    key={apt.id}
                    layout
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  >
                    <Card className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fcn-primary/10">
                            <Stethoscope className="h-5 w-5 text-fcn-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                              Dr. {apt.doctor?.full_name ?? "Unknown"}
                            </p>
                            <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                              {apt.doctor?.doctor_profile?.specialty ?? "General"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={config.variant} size="sm">
                          {config.label}
                        </Badge>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                          <CalendarClock className="h-4 w-4 shrink-0" />
                          <span>{format(scheduledDate, "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>{format(scheduledDate, "h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                          <TypeIcon className="h-4 w-4 shrink-0" />
                          <span>{typeLabels[apt.appointment_type] ?? apt.appointment_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                          <CreditCard className="h-4 w-4 shrink-0" />
                          <span>{apt.payment_status === "paid" ? "Paid" : apt.payment_status === "unpaid" ? "Unpaid" : apt.payment_status}</span>
                        </div>
                      </div>

                      {apt.chief_complaint && (
                        <div className="flex items-start gap-2 rounded-md bg-fcn-primary/5 p-2">
                          <FileText className="mt-0.5 h-3 w-3 shrink-0 text-fcn-primary" />
                          <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                            {apt.chief_complaint}
                          </p>
                        </div>
                      )}

                      {apt.chapa_checkout_url && apt.payment_status === "unpaid" && (
                        <div className="rounded-md border border-fcn-warning/20 bg-fcn-warning/5 p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="h-3.5 w-3.5 text-fcn-warning" />
                              <p className="text-xs font-medium text-fcn-warning">Payment Required</p>
                            </div>
                            <a
                              href={apt.chapa_checkout_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-medium text-fcn-primary hover:underline"
                            >
                              Pay Now <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {canJoin(apt.status) && (
                          <Button
                            size="sm"
                            onClick={() => window.location.href = `/consultation/${apt.id}`}
                            icon={<Video className="h-3.5 w-3.5" />}
                          >
                            Join
                          </Button>
                        )}
                        {canReschedule(apt.status) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openRescheduleModal(apt)}
                            icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
                          >
                            Reschedule
                          </Button>
                        )}
                        {canCancel(apt.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openCancelModal(apt)}
                            icon={<XCircle className="h-3.5 w-3.5" />}
                            className="text-fcn-danger hover:bg-fcn-danger/10"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Cancel Modal */}
        <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Appointment" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">
              Are you sure you want to cancel this appointment? Cancelled appointments cannot be restored.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                Reason (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Why are you cancelling?"
                className="w-full resize-none rounded-lg border border-fcn-primary/20 bg-white p-2.5 text-sm text-fcn-text-light outline-none focus:border-fcn-primary focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setCancelModalOpen(false)}>
                Keep Appointment
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => cancelMutation.mutate()}
                loading={cancelMutation.isPending}
              >
                Cancel Appointment
              </Button>
            </div>
          </div>
        </Modal>

        {/* Reschedule Modal */}
        <Modal isOpen={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} title="Reschedule Appointment" size="md">
          <div className="space-y-4">
            <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">
              Select a new date and time for your appointment.
            </p>

            <div>
              <label className="mb-1 block text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                New Date
              </label>
              <input
                type="date"
                value={rescheduleDate}
                min={format(new Date(), "yyyy-MM-dd")}
                max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full rounded-lg border border-fcn-primary/20 bg-white px-4 py-2.5 text-sm text-fcn-text-light outline-none focus:border-fcn-primary focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                New Time
              </label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full rounded-lg border border-fcn-primary/20 bg-white px-4 py-2.5 text-sm text-fcn-text-light outline-none focus:border-fcn-primary focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                Reason (Optional)
              </label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={2}
                placeholder="Why are you rescheduling?"
                className="w-full resize-none rounded-lg border border-fcn-primary/20 bg-white p-2.5 text-sm text-fcn-text-light outline-none focus:border-fcn-primary focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setRescheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={!rescheduleDate || !rescheduleTime}
                onClick={() => rescheduleMutation.mutate()}
                loading={rescheduleMutation.isPending}
              >
                Reschedule
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default MyAppointmentsPage;
