import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { clsx } from "clsx";
import {
  CalendarClock,
  Clock,
  Video,
  MapPin,
  User,
  XCircle,
  ArrowLeftRight,
  Stethoscope,
  FileText,
  CreditCard,
  ExternalLink,
  Pill,
  CalendarPlus,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { PageTransition } from "@/components/animations/PageTransition";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { appointmentsService } from "@/services/appointments.service";
import { FollowUpPrescriptionPanel } from "@/components/doctor-dashboard/FollowUpPrescriptionPanel";
import type { Appointment, AppointmentStatus } from "@/types";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "info" },
  scheduled: { label: "Scheduled", variant: "info" },
  in_session: { label: "In Session", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

const typeIcons: Record<string, typeof Video> = {
  remote: Video,
  in_person: MapPin,
  nurse_visit: User,
};

const typeLabels: Record<string, string> = {
  remote: "Video Consultation",
  in_person: "In-Person Visit",
  nurse_visit: "Nurse Home Visit",
};

const tabs = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const MyAppointmentsPage = () => {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpAppointment, setFollowUpAppointment] = useState<Appointment | null>(null);

  const userRole = useAuthStore((s) => s.user?.role);

  const { data: appointmentsData, isLoading, error } = useQuery({
    queryKey: ["my-appointments", userRole],
    queryFn: async () => {
      const res =
        userRole === "doctor"
          ? await appointmentsService.getDoctorAppointments({ limit: 50 })
          : await appointmentsService.getMyAppointments({ limit: 50 });
      return res.data ?? [];
    },
    staleTime: 15_000,
  });

  const appointments = useMemo(() => {
    const all = appointmentsData ?? [];

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
      await appointmentsService.cancel(selectedAppointment.id, cancelReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      addToast({ type: "success", title: "Appointment cancelled" });
      setCancelModalOpen(false);
      setCancelReason("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || "Failed to cancel appointment";
      addToast({ type: "danger", title: msg });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;
      const d = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
      const offsetMin = d.getTimezoneOffset();
      const sign = offsetMin <= 0 ? "+" : "-";
      const oh = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, "0");
      const om = String(Math.abs(offsetMin) % 60).padStart(2, "0");
      const scheduledAt = `${rescheduleDate}T${rescheduleTime}:00.000${sign}${oh}:${om}`;
      await appointmentsService.reschedule(selectedAppointment.id, scheduledAt, rescheduleReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      addToast({ type: "success", title: "Appointment rescheduled" });
      setRescheduleModalOpen(false);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || "Failed to reschedule appointment";
      addToast({ type: "danger", title: msg });
    },
  });

  const canCancel = (status: AppointmentStatus) => ["pending", "confirmed", "scheduled"].includes(status);
  const canReschedule = (status: AppointmentStatus) => ["pending", "confirmed", "scheduled"].includes(status);
  const canJoin = (status: AppointmentStatus) => ["confirmed", "in_session"].includes(status);

  const canFollowUp = (apt: Appointment) => {
    return (
      userRole === "doctor" &&
      apt.status === "completed" &&
      apt.follow_up_prescription_deadline &&
      new Date(apt.follow_up_prescription_deadline) > new Date()
    );
  };

  const isFollowUpExpiringSoon = (deadline: string) => {
    const msLeft = new Date(deadline).getTime() - Date.now();
    return msLeft > 0 && msLeft < 24 * 60 * 60 * 1000;
  };

  const followUpTimeLeft = (deadline: string) => {
    const msLeft = new Date(deadline).getTime() - Date.now();
    if (msLeft <= 0) return "Expired";
    const hours = Math.floor(msLeft / (1000 * 60 * 60));
    const mins = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    return `${hours}h ${mins}m left`;
  };

  const openCancelModal = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const openRescheduleModal = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setRescheduleDate("");
    setRescheduleTime("");
    setRescheduleReason("");
    setRescheduleModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 pb-20 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {userRole === "doctor" ? "Patient Appointments" : "My Appointments"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Manage your upcoming consultations and review medical records
            </p>
          </div>
          <Button
            variant="action"
            onClick={() => navigate("/appointments/book")}
            className="min-h-[44px] self-start sm:self-auto"
          >
            <CalendarPlus className="w-4 h-4 mr-1.5" />
            <span>Book New Appointment</span>
          </Button>
        </div>

        {/* Filter Tabs (Horizontal Carousel on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  "whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all duration-150 select-none",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isSelected
                    ? "bg-teal-500 text-white shadow-[0_4px_12px_rgba(20,184,166,0.35)]"
                    : "border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                )}
              >
                <span>{tab.label}</span>
                {tab.key !== "all" && (
                  <span className="ml-1.5 opacity-70">
                    (
                    {appointmentsData?.filter((a) => {
                      if (tab.key === "upcoming")
                        return ["pending", "confirmed", "scheduled", "in_session"].includes(a.status);
                      if (tab.key === "completed") return a.status === "completed";
                      if (tab.key === "cancelled") return a.status === "cancelled";
                      return true;
                    }).length ?? 0}
                    )
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] p-8">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-1">
              <CalendarClock className="h-8 w-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              No appointments found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              {activeTab === "all"
                ? "You haven't scheduled any consultations yet. Find a doctor to get started."
                : "No appointments matching this filter."}
            </p>
            {activeTab === "all" && (
              <Button
                variant="action"
                className="mt-3 min-h-[44px]"
                onClick={() => navigate("/appointments/book")}
              >
                Book an Appointment
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            <AnimatePresence mode="popLayout">
              {appointments.map((apt) => {
                const TypeIcon = typeIcons[apt.appointment_type] ?? Video;
                const config = statusConfig[apt.status] ?? statusConfig.pending;
                const scheduledDate = parseISO(apt.scheduled_at);

                return (
                  <motion.div
                    key={apt.id}
                    layout
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  >
                    <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/90 p-4 sm:p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <Stethoscope className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-900 dark:text-white">
                              {userRole === "doctor"
                                ? apt.patient?.full_name ?? "Patient"
                                : `Dr. ${apt.doctor?.full_name ?? "Doctor"}`}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {userRole === "doctor"
                                ? "Patient"
                                : apt.doctor?.doctor_profile?.specialty ?? "General Practitioner"}
                            </p>
                          </div>
                        </div>

                        <Badge variant={config.variant} size="sm">
                          {config.label}
                        </Badge>
                      </div>

                      {/* Detail Chips */}
                      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] p-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                          <CalendarClock className="h-4 w-4 text-teal-500 shrink-0" />
                          <span>{format(scheduledDate, "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                          <Clock className="h-4 w-4 text-teal-500 shrink-0" />
                          <span>{format(scheduledDate, "h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                          <TypeIcon className="h-4 w-4 text-teal-500 shrink-0" />
                          <span>{typeLabels[apt.appointment_type] ?? apt.appointment_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                          <CreditCard className="h-4 w-4 text-teal-500 shrink-0" />
                          <span className="capitalize">{apt.payment_status}</span>
                        </div>
                      </div>

                      {/* Reason */}
                      {apt.chief_complaint && (
                        <div className="flex items-start gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-2.5">
                          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {apt.chief_complaint}
                          </p>
                        </div>
                      )}

                      {/* Payment Notice */}
                      {apt.chapa_checkout_url && apt.payment_status === "unpaid" && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                Payment Required
                              </p>
                            </div>
                            <a
                              href={apt.chapa_checkout_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                            >
                              Pay Now <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons Row */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                        {canJoin(apt.status) && (
                          <Button
                            variant="action"
                            size="sm"
                            onClick={() => navigate(`/consultation/${apt.id}`)}
                            icon={<Video className="h-4 w-4" />}
                            className="min-h-[40px]"
                          >
                            Join Consultation
                          </Button>
                        )}
                        {canReschedule(apt.status) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openRescheduleModal(apt)}
                            icon={<ArrowLeftRight className="h-4 w-4" />}
                            className="min-h-[40px]"
                          >
                            Reschedule
                          </Button>
                        )}
                        {canCancel(apt.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openCancelModal(apt)}
                            icon={<XCircle className="h-4 w-4" />}
                            className="min-h-[40px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          >
                            Cancel
                          </Button>
                        )}
                        {canFollowUp(apt) && apt.follow_up_prescription_deadline && (
                          <Button
                            size="sm"
                            variant={
                              isFollowUpExpiringSoon(apt.follow_up_prescription_deadline)
                                ? "danger"
                                : "secondary"
                            }
                            onClick={() => {
                              setFollowUpAppointment(apt);
                              setFollowUpModalOpen(true);
                            }}
                            icon={<Pill className="h-4 w-4" />}
                            className="min-h-[40px]"
                          >
                            Follow-Up Rx
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Cancel Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancel Appointment"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to cancel this appointment? Cancelled appointments cannot be restored.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Reason (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Why are you cancelling?"
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                className="flex-1 min-h-[44px]"
                onClick={() => setCancelModalOpen(false)}
              >
                Keep Appointment
              </Button>
              <Button
                variant="danger"
                className="flex-1 min-h-[44px]"
                onClick={() => cancelMutation.mutate()}
                loading={cancelMutation.isPending}
              >
                Cancel Appointment
              </Button>
            </div>
          </div>
        </Modal>

        {/* Reschedule Modal */}
        <Modal
          isOpen={rescheduleModalOpen}
          onClose={() => setRescheduleModalOpen(false)}
          title="Reschedule Appointment"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Select a new date and time for your consultation.
            </p>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                New Date
              </label>
              <input
                type="date"
                value={rescheduleDate}
                min={format(new Date(), "yyyy-MM-dd")}
                max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                New Time
              </label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Reason (Optional)
              </label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={2}
                placeholder="Why are you rescheduling?"
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                className="flex-1 min-h-[44px]"
                onClick={() => setRescheduleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="action"
                className="flex-1 min-h-[44px]"
                disabled={!rescheduleDate || !rescheduleTime}
                onClick={() => rescheduleMutation.mutate()}
                loading={rescheduleMutation.isPending}
              >
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </Modal>

        {/* Follow-Up Modal */}
        <Modal
          isOpen={followUpModalOpen}
          onClose={() => {
            setFollowUpModalOpen(false);
            setFollowUpAppointment(null);
          }}
          title="Follow-Up Prescription"
          size="md"
        >
          {followUpAppointment && followUpAppointment.follow_up_prescription_deadline && (
            <FollowUpPrescriptionPanel
              appointmentId={followUpAppointment.id}
              patientName={followUpAppointment.patient?.full_name ?? "Patient"}
              deadline={followUpAppointment.follow_up_prescription_deadline}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
              }}
              onClose={() => {
                setFollowUpModalOpen(false);
                setFollowUpAppointment(null);
              }}
            />
          )}
        </Modal>
      </div>
    </PageTransition>
  );
};

export default MyAppointmentsPage;
