import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { clsx } from "clsx";
import {
  Search,
  Stethoscope,
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  Video,
  User,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { format, addDays, parseISO } from "date-fns";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { StickyActionButton } from "@/components/ui/StickyActionButton";
import { BookingSummaryCard } from "@/components/appointments/BookingSummaryCard";
import { ConfirmationModal } from "@/components/appointments/ConfirmationModal";
import { PageTransition } from "@/components/animations/PageTransition";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotifications } from "@/hooks/useNotifications";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { doctorsService } from "@/services/doctors.service";
import { appointmentsService } from "@/services/appointments.service";
import type { PublicDoctorCard } from "@/types";

type Step = "doctor" | "datetime" | "confirm";

const typeOptions = [
  { value: "remote", label: "Video Call", icon: Video, desc: "Consult from home" },
  { value: "in_person", label: "In Person", icon: MapPin, desc: "Visit the hospital" },
  { value: "nurse_visit", label: "Nurse Visit", icon: User, desc: "Nurse comes to you" },
] as const;

const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const { addToast } = useNotifications();
  const { isPaymentEnabled, isFreePeriod, isLoading: settingsLoading } = useSystemSettings();

  const preselectedDoctorId = searchParams.get("doctor_id");

  const [step, setStep] = useState<Step>("doctor");
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<PublicDoctorCard | null>(null);
  const [selectedType, setSelectedType] = useState<string>("remote");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedTimeLabel, setSelectedTimeLabel] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState<"created" | "cancelled" | "rescheduled">("created");

  const debouncedSearch = useDebounce(search, 300);

  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: ["bookable-doctors", debouncedSearch],
    queryFn: async () => {
      const res = await doctorsService.getAllDoctors({
        search: debouncedSearch || undefined,
        available_now: true,
        limit: 50,
      });
      return res.data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: timeSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ["time-slots", selectedDoctor?.id, selectedDate],
    queryFn: async () => {
      if (!selectedDate || !selectedDoctor?.id) return [];
      const res = await doctorsService.getDoctorAvailability(selectedDoctor.id, selectedDate);
      return res.data ?? [];
    },
    enabled: !!selectedDoctor && !!selectedDate,
    staleTime: 15_000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDoctor || !selectedDate || !selectedTime) throw new Error("Missing booking details");
      const d = new Date(`${selectedDate}T${selectedTime}:00`);
      const offsetMin = d.getTimezoneOffset();
      const sign = offsetMin <= 0 ? "+" : "-";
      const oh = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, "0");
      const om = String(Math.abs(offsetMin) % 60).padStart(2, "0");
      const scheduledAt = `${selectedDate}T${selectedTime}:00.000${sign}${oh}:${om}`;
      const res = await appointmentsService.create({
        doctor_id: selectedDoctor.id,
        appointment_type: selectedType as "remote" | "in_person" | "nurse_visit",
        scheduled_at: scheduledAt,
        chief_complaint: chiefComplaint || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setConfirmationType("created");
      setShowConfirmation(true);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || error?.message || "Failed to create appointment";
      addToast({ type: "danger", title: msg });
    },
  });

  const doctors = useMemo(() => {
    const d = doctorsData ?? [];
    if (Array.isArray(d)) return d as PublicDoctorCard[];
    if ((d as any)?.data) return (d as any).data as PublicDoctorCard[];
    return [];
  }, [doctorsData]);

  const availableSlots = useMemo(() => {
    return (timeSlots ?? []).filter((s) => s.available);
  }, [timeSlots]);

  const minDate = format(new Date(), "yyyy-MM-dd");
  const maxDate = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const canProceedToDateTime = !!selectedDoctor;
  const canProceedToConfirm = !!selectedDoctor && !!selectedDate && !!selectedTime;
  const totalFee = selectedDoctor?.consultation_fee_etb ?? 0;
  const platformFee = Math.round(totalFee * 0.1);
  const grandTotal = totalFee + platformFee;

  const handleDoctorSelect = useCallback((doctor: PublicDoctorCard) => {
    setSelectedDoctor(doctor);
    setSelectedDate("");
    setSelectedTime("");
    setSelectedTimeLabel("");
    setStep("datetime");
  }, []);

  useEffect(() => {
    if (preselectedDoctorId && doctors.length > 0 && !selectedDoctor) {
      const doctor = doctors.find((d) => d.id === preselectedDoctorId);
      if (doctor) {
        handleDoctorSelect(doctor);
      }
    }
  }, [preselectedDoctorId, doctors, selectedDoctor, handleDoctorSelect]);

  const handleBack = useCallback(() => {
    if (step === "datetime") {
      setStep("doctor");
      return;
    }
    if (step === "confirm") {
      setStep("datetime");
      return;
    }
  }, [step]);

  const handleConfirmBooking = useCallback(() => {
    createMutation.mutate();
  }, [createMutation]);

  const stepIndex = step === "doctor" ? 1 : step === "datetime" ? 2 : 3;

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl pb-24 md:pb-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Book an Appointment
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Find and book a consultation with a verified healthcare specialist
          </p>
        </div>

        {/* Multi-step progress bar (Pattern #4) */}
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/90 p-4 shadow-sm">
          <StepIndicator
            currentStep={stepIndex}
            totalSteps={3}
            stepTitles={["Select Doctor", "Date & Consultation", "Confirm & Book"]}
          />
        </div>

        {/* Step 1: Select Doctor */}
        {step === "doctor" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {doctorsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : doctors.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6">
                <AlertCircle className="h-8 w-8 text-slate-400" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  No available doctors found. Try adjusting your search.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {doctors.map((doctor) => {
                  const isSelected = selectedDoctor?.id === doctor.id;
                  return (
                    <div
                      key={doctor.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleDoctorSelect(doctor)}
                      className={clsx(
                        "group p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer select-none text-left",
                        "hover:scale-[1.01] active:scale-[0.99]",
                        isSelected
                          ? "border-teal-500 bg-teal-500/10 dark:bg-teal-400/20 shadow-[0_4px_16px_rgba(20,184,166,0.25)]"
                          : "border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900 hover:border-teal-500/40"
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xl font-bold">
                          🩺
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            Dr. {doctor.full_name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Stethoscope className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
                            <span className="truncate">{doctor.specialty}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Available
                            </span>
                            <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                              ETB {doctor.consultation_fee_etb?.toFixed(0) ?? "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date, Time & Consultation Type */}
        {step === "datetime" && (
          <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/90 p-5 sm:p-7 shadow-sm">
            {/* Consultation Type Selector */}
            <div>
              <h3 className="mb-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Consultation Type
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                {typeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedType(option.value)}
                      className={clsx(
                        "flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all duration-150 select-none",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isSelected
                          ? "border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300 shadow-[0_4px_16px_rgba(20,184,166,0.25)]"
                          : "border-slate-200/80 bg-slate-50/50 text-slate-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-bold">{option.label}</span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {option.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Date */}
            <div>
              <h3 className="mb-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Appointment Date
              </h3>
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime("");
                  setSelectedTimeLabel("");
                }}
                className="h-12 w-full rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            {/* Available Time Slots */}
            {selectedDate && (
              <div>
                <h3 className="mb-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Available Time Slots
                </h3>
                {slotsLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-4">
                    <Clock className="h-6 w-6 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-500">
                      No available slots for this date. Please select another date.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => {
                            setSelectedTime(slot.time);
                            setSelectedTimeLabel(slot.label);
                          }}
                          className={clsx(
                            "h-11 rounded-xl text-xs font-bold transition-all duration-150 select-none",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            isSelected
                              ? "bg-teal-500 text-white shadow-[0_4px_12px_rgba(20,184,166,0.35)]"
                              : "border border-slate-200/80 bg-slate-50/50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 hover:border-slate-300"
                          )}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm Details & Reason */}
        {step === "confirm" && selectedDoctor && (
          <div className="grid gap-4 md:gap-6 md:grid-cols-5">
            <div className="space-y-4 md:col-span-3">
              <div className="rounded-3xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm">
                <h3 className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Reason for Visit (Optional)
                </h3>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Briefly describe your symptoms or what you'd like to consult the doctor about..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <BookingSummaryCard
                doctorName={selectedDoctor.full_name}
                specialty={selectedDoctor.specialty ?? ""}
                appointmentType={selectedType}
                date={selectedDate ? parseISO(selectedDate) : new Date()}
                time={selectedTimeLabel}
                chiefComplaint={chiefComplaint || undefined}
                fee={grandTotal}
                isFreePeriod={isFreePeriod}
                isPaymentEnabled={isPaymentEnabled}
              />
            </div>
          </div>
        )}

        {/* Bottom Navigation Buttons (Desktop & Tablet) */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {step !== "doctor" && (
              <Button
                variant="secondary"
                onClick={handleBack}
                icon={<ChevronLeft className="h-4 w-4" />}
                className="min-h-[48px]"
              >
                <span>Back</span>
              </Button>
            )}
          </div>
          <div className="hidden sm:block">
            {step === "doctor" && (
              <Button
                variant="action"
                disabled={!canProceedToDateTime}
                onClick={() => setStep("datetime")}
                icon={<ChevronRight className="h-4 w-4" />}
                className="min-h-[48px]"
              >
                Continue to Date & Time
              </Button>
            )}
            {step === "datetime" && (
              <Button
                variant="action"
                disabled={!canProceedToConfirm}
                onClick={() => setStep("confirm")}
                icon={<ChevronRight className="h-4 w-4" />}
                className="min-h-[48px]"
              >
                Review Booking Details
              </Button>
            )}
            {step === "confirm" && (
              <Button
                variant="action"
                onClick={handleConfirmBooking}
                loading={createMutation.isPending}
                disabled={createMutation.isPending}
                className="min-h-[48px]"
              >
                {createMutation.isPending ? "Confirming..." : "Confirm & Book Appointment"}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Sticky Action Button (Pattern #3: 52px tall, gradient fill, press animation) */}
        <div className="sm:hidden">
          {step === "doctor" && (
            <StickyActionButton
              label="Continue to Date & Time"
              onClick={() => setStep("datetime")}
              disabled={!canProceedToDateTime}
            />
          )}
          {step === "datetime" && (
            <StickyActionButton
              label="Review Booking Details"
              onClick={() => setStep("confirm")}
              disabled={!canProceedToConfirm}
            />
          )}
          {step === "confirm" && (
            <StickyActionButton
              label={`Confirm & Book (ETB ${grandTotal.toFixed(0)})`}
              onClick={handleConfirmBooking}
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
            />
          )}
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            navigate("/appointments");
          }}
          type={confirmationType}
        />
      </div>
    </PageTransition>
  );
};

export default BookAppointmentPage;
