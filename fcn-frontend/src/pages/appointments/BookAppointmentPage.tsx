import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { clsx } from "clsx";
import {
  Search, Stethoscope, MapPin, Clock, ChevronRight,
  ChevronLeft, Check, Video, User, FileText, AlertCircle
} from "lucide-react";
import { format, addDays, parseISO } from "date-fns";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { BookingSummaryCard } from "@/components/appointments/BookingSummaryCard";
import { ConfirmationModal } from "@/components/appointments/ConfirmationModal";
import { PageTransition } from "@/components/animations/PageTransition";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotifications } from "@/hooks/useNotifications";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { doctorsService } from "@/services/doctors.service";
import { appointmentsService } from "@/services/appointments.service";
import type { DoctorWithProfile, TimeSlot } from "@/types";

type Step = "doctor" | "datetime" | "confirm";

const typeOptions = [
  { value: "remote", label: "Video Call", icon: Video, desc: "Consult from home" },
  { value: "in_person", label: "In Person", icon: MapPin, desc: "Visit the hospital" },
  { value: "nurse_visit", label: "Nurse Visit", icon: User, desc: "Nurse comes to you" }
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
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithProfile | null>(null);
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
        limit: 50
      });
      return res.data ?? [];
    },
    staleTime: 30_000
  });

  const { data: timeSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ["time-slots", selectedDoctor?.id, selectedDate],
    queryFn: async () => {
      if (!selectedDate || !selectedDoctor?.id) return [];
      const res = await doctorsService.getDoctorAvailability(selectedDoctor.id, selectedDate);
      return res.data ?? [];
    },
    enabled: !!selectedDoctor && !!selectedDate,
    staleTime: 15_000
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
        chief_complaint: chiefComplaint || undefined
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
    }
  });

  const doctors = useMemo(() => {
    const d = doctorsData ?? [];
    if (Array.isArray(d)) return d as DoctorWithProfile[];
    if ((d as any)?.data) return (d as any).data as DoctorWithProfile[];
    return [];
  }, [doctorsData]);

  const availableSlots = useMemo(() => {
    return (timeSlots ?? []).filter((s) => s.available);
  }, [timeSlots]);

  const minDate = format(new Date(), "yyyy-MM-dd");
  const maxDate = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const canProceedToDateTime = !!selectedDoctor;
  const canProceedToConfirm = !!selectedDoctor && !!selectedDate && !!selectedTime;
  const totalFee = selectedDoctor?.doctor_profile?.consultation_fee_etb ?? 0;
  const platformFee = Math.round(totalFee * 0.1);
  const grandTotal = totalFee + platformFee;

  const handleDoctorSelect = useCallback((doctor: DoctorWithProfile) => {
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
    if (step === "datetime") { setStep("doctor"); return; }
    if (step === "confirm") { setStep("datetime"); return; }
  }, [step]);

  const handleConfirmBooking = useCallback(() => {
    createMutation.mutate();
  }, [createMutation]);

  const renderStepIndicator = () => (
    <div className="mb-6 md:mb-8 flex items-center justify-center gap-1 md:gap-2">
      {(["doctor", "datetime", "confirm"] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center gap-1 md:gap-2">
          <div className={clsx(
            "flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
            step === s
              ? "bg-fcn-primary text-white"
              : ["doctor", "datetime"].includes(step) && ["doctor", "datetime"].includes(s)
                ? "bg-fcn-primary/20 text-fcn-primary"
                : "bg-fcn-primary/10 text-fcn-primary/40"
          )}>
            {["doctor", "datetime"].includes(step) && s !== step && s !== "confirm" ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          <span className={clsx(
            "hidden text-xs font-medium sm:inline",
            step === s ? "text-fcn-primary" : "text-fcn-text-light/40 dark:text-fcn-text-dark/40"
          )}>
            {s === "doctor" ? "Doctor" : s === "datetime" ? "Date & Time" : "Confirm"}
          </span>
          {i < 2 && <div className="h-px w-6 md:w-8 bg-fcn-primary/20" />}
        </div>
      ))}
    </div>
  );

  const renderSpecialtyIcon = (specialty: string) => {
    const icons: Record<string, string> = {
      "General Medicine": "🩺",
      "Surgery": "🔪",
      "Pediatrics": "👶",
      "Obstetrics": "🤰",
      "Emergency": "🚑"
    };
    return icons[specialty] ?? "🩺";
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl pb-24 md:pb-0">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            Book an Appointment
          </h1>
          <p className="mt-1 text-xs md:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            Find and book a consultation with a healthcare provider.
          </p>
        </div>

        {renderStepIndicator()}

        {/* Step 1: Select Doctor */}
        {step === "doctor" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-text-light/40 dark:text-fcn-text-dark/40" />
              <input
                type="text"
                placeholder="Search doctors by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-fcn-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-fcn-text-light outline-none focus:border-fcn-primary focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark"
              />
            </div>

            {doctorsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : doctors.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <AlertCircle className="h-8 w-8 text-fcn-text-light/40 dark:text-fcn-text-dark/40" />
                <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                  No available doctors found. Try adjusting your search.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {doctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    hoverable
                    glow={selectedDoctor?.id === doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className={clsx(
                      "cursor-pointer transition-all",
                      selectedDoctor?.id === doctor.id && "ring-2 ring-fcn-primary"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-fcn-primary/10 text-lg">
                        {renderSpecialtyIcon(doctor.doctor_profile?.specialty ?? "")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                          Dr. {doctor.full_name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                          <Stethoscope className="h-3 w-3" />
                          {doctor.doctor_profile?.specialty}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant={
                            doctor.doctor_profile?.availability_status === "available" ? "success" : "warning"
                          } size="sm">
                            {doctor.doctor_profile?.availability_status === "available" ? "Available" : "Busy"}
                          </Badge>
                          <span className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                            ETB {doctor.doctor_profile?.consultation_fee_etb?.toFixed(0) ?? "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date, Time & Type */}
        {step === "datetime" && (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                Consultation Type
              </h3>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {typeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedType === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedType(option.value)}
                      className={clsx(
                        "flex flex-col items-center gap-1 md:gap-1.5 rounded-lg border p-2 md:p-3 text-center text-[10px] md:text-xs transition-all",
                        isSelected
                          ? "border-fcn-primary bg-fcn-primary/10 text-fcn-primary"
                          : "border-fcn-primary/10 text-fcn-text-light/60 hover:border-fcn-primary/30 dark:text-fcn-text-dark/60"
                      )}
                    >
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="font-medium">{option.label}</span>
                      <span className="text-[9px] md:text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                        {option.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                Select Date
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
                className="w-full rounded-lg border border-fcn-primary/20 bg-white px-4 py-2.5 text-sm text-fcn-text-light outline-none focus:border-fcn-primary focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark"
              />
            </div>

            {selectedDate && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  Available Time Slots
                </h3>
                {slotsLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Clock className="h-6 w-6 text-fcn-text-light/40 dark:text-fcn-text-dark/40" />
                    <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                      No available slots for this date. Please select another date.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => {
                          setSelectedTime(slot.time);
                          setSelectedTimeLabel(slot.label);
                        }}
                        className={clsx(
                          "rounded-lg border px-2 md:px-3 py-2 text-xs font-medium transition-all",
                          selectedTime === slot.time
                            ? "border-fcn-primary bg-fcn-primary text-white"
                            : "border-fcn-primary/20 text-fcn-text-light hover:border-fcn-primary/40 dark:text-fcn-text-dark"
                        )}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && selectedDoctor && (
          <div className="grid gap-4 md:gap-6 md:grid-cols-5">
            <div className="space-y-4 md:col-span-3">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  Reason for Visit (Optional)
                </h3>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Briefly describe your symptoms or reason for the appointment..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-fcn-primary/20 bg-white p-3 text-sm text-fcn-text-light outline-none focus:border-fcn-primary focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark"
                />
              </div>
            </div>

            <div className="hidden md:block md:col-span-2">
              <BookingSummaryCard
                doctorName={selectedDoctor.full_name}
                specialty={selectedDoctor.doctor_profile?.specialty ?? ""}
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

        {/* Navigation Buttons */}
        <div className="mt-6 md:mt-8 flex items-center justify-between">
          <div>
            {step !== "doctor" && (
              <Button variant="ghost" onClick={handleBack} icon={<ChevronLeft className="h-4 w-4" />}>
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
          </div>
          <div>
            {step === "doctor" && (
              <Button
                disabled={!canProceedToDateTime}
                onClick={() => setStep("datetime")}
                icon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            )}
            {step === "datetime" && (
              <Button
                disabled={!canProceedToConfirm}
                onClick={() => setStep("confirm")}
                icon={<ChevronRight className="h-4 w-4" />}
              >
                Review Booking
              </Button>
            )}
            {step === "confirm" && (
              <Button
                onClick={handleConfirmBooking}
                loading={createMutation.isPending}
                disabled={createMutation.isPending}
                className="hidden md:flex"
              >
                {createMutation.isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile sticky bottom bar for confirm step */}
        {step === "confirm" && (
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-fcn-primary/10 bg-white px-4 py-3 dark:bg-fcn-dark md:hidden">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">Total: </span>
                <span className="font-bold text-fcn-primary">ETB {grandTotal.toFixed(0)}</span>
              </div>
              <Button
                onClick={handleConfirmBooking}
                loading={createMutation.isPending}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )}

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
