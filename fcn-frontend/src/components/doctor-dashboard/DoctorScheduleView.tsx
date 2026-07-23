import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isToday, parseISO, isBefore, addMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Video, MapPin, User, Clock } from "lucide-react";
import { clsx } from "clsx";
import { getDoctorSchedule, type ScheduleAppointment } from "@/services/doctor-dashboard.service";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";

interface DoctorScheduleViewProps {
  doctorId: string;
}

const appointmentColors: Record<string, string> = {
  remote: "border-l-fcn-accent bg-fcn-accent/5",
  in_person: "border-l-fcn-primary bg-fcn-primary/5",
  nurse_visit: "border-l-fcn-warning bg-fcn-warning/5",
};

const typeIcons: Record<string, typeof Video> = {
  remote: Video,
  in_person: MapPin,
  nurse_visit: User,
};

const statusVariant: Record<string, "success" | "warning" | "info" | "danger" | "neutral"> = {
  pending: "warning",
  confirmed: "info",
  scheduled: "info",
  in_session: "success",
  completed: "success",
  cancelled: "danger",
};

export const DoctorScheduleView = ({ doctorId }: DoctorScheduleViewProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [view, setView] = useState<"day" | "week">("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) setView("day");
  }, [isMobile]);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ["doctor-schedule", doctorId, dateStr, view],
    queryFn: () => getDoctorSchedule(dateStr, view),
  });

  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 0 }), [selectedDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const navigatePrev = () => {
    if (view === "day") setSelectedDate((d) => addDays(d, -1));
    else setSelectedDate((d) => subWeeks(d, 1));
  };

  const navigateNext = () => {
    if (view === "day") setSelectedDate((d) => addDays(d, 1));
    else setSelectedDate((d) => addWeeks(d, 1));
  };

  const goToday = () => setSelectedDate(new Date());

  const currentLabel = useMemo(() => {
    if (view === "day") return format(selectedDate, "MMMM d, yyyy");
    return `${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`;
  }, [view, selectedDate, weekDays]);

  const timeSlots = useMemo(
    () => Array.from({ length: 21 }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`),
    []
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-fcn-primary/5" />
        ))}
      </div>
    );
  }

  const renderAppointmentCard = (apt: ScheduleAppointment, compact = true) => {
    const Icon = typeIcons[apt.appointment_type] ?? Video;
    const aptTime = format(parseISO(apt.scheduled_at), "h:mm a");
    const heightPx = Math.max(32, (apt.duration_minutes / 30) * 32);

    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={clsx(
          "border-l-4 rounded-r-lg p-2 cursor-pointer hover:shadow-md transition-shadow",
          appointmentColors[apt.appointment_type] ?? "border-l-fcn-primary bg-fcn-primary/5"
        )}
        style={compact ? { height: `${heightPx}px` } : undefined}
      >
        {compact ? (
          <div className="flex items-center gap-1.5 h-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-fcn-text-light dark:text-fcn-text-dark truncate">
                {apt.patient.full_name}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                <Clock className="h-2.5 w-2.5" />
                <span>{aptTime}</span>
              </div>
            </div>
            <span className={clsx("h-1.5 w-1.5 rounded-full shrink-0", {
              "bg-fcn-success": apt.status === "confirmed" || apt.status === "in_session",
              "bg-fcn-warning": apt.status === "pending",
              "bg-fcn-primary": apt.status === "scheduled",
              "bg-fcn-text-light/40": apt.status === "completed",
            })} />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Avatar name={apt.patient.full_name} role="patient" size="sm" />
                <div>
                  <p className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    {apt.patient.full_name}
                  </p>
                  <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">{aptTime}</p>
                </div>
              </div>
              <Badge variant={statusVariant[apt.status] ?? "neutral"} size="sm">{apt.status}</Badge>
            </div>
            {apt.chief_complaint && (
              <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 line-clamp-2">
                {apt.chief_complaint}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              <Icon className="h-3 w-3" />
              <span>{apt.appointment_type}</span>
              <Clock className="h-3 w-3 ml-1" />
              <span>{apt.duration_minutes}min</span>
            </div>
            <div className="flex gap-1.5 pt-1">
              {(apt.status === "confirmed" || apt.status === "in_session") &&
                isBefore(new Date(apt.scheduled_at), addMinutes(new Date(), 30)) && (
                <Button size="sm" onClick={() => window.location.href = `/consultation/${apt.id}`}>
                  Start Consultation
                </Button>
              )}
              {apt.status === "pending" && (
                <>
                  <Button size="sm" variant="secondary">Confirm</Button>
                  <Button size="sm" variant="ghost" className="text-fcn-danger">Decline</Button>
                </>
              )}
              {apt.status === "completed" && (
                <Button size="sm" variant="secondary">View Summary</Button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, idx) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const today = isToday(day);
        const dayAppointments = (scheduleData as any)?.days?.[idx]?.appointments ?? [];

        return (
          <div key={dayStr} className="space-y-1">
            <div className={clsx("text-center py-2 rounded-lg", today && "bg-fcn-accent/10")}>
              <p className={clsx("text-xs font-semibold", today ? "text-fcn-accent" : "text-fcn-text-light/60 dark:text-fcn-text-dark/60")}>
                {format(day, "EEE")}
              </p>
              <p className={clsx("text-lg font-bold", today ? "text-fcn-accent" : "text-fcn-text-light dark:text-fcn-text-dark")}>
                {format(day, "d")}
              </p>
            </div>
            <div className="space-y-1 min-h-[200px]">
              {dayAppointments.length === 0 ? (
                <div className="border border-dashed border-fcn-primary/10 rounded-lg h-20 flex items-center justify-center">
                  <p className="text-[10px] text-fcn-text-light/30 dark:text-fcn-text-dark/30">No appointments</p>
                </div>
              ) : (
                dayAppointments.map((apt: ScheduleAppointment) => (
                  <div key={apt.id}>{renderAppointmentCard(apt, true)}</div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDayView = () => {
    const appointments = (scheduleData as any)?.appointments ?? [];
    const appointmentMap = new Map<string, ScheduleAppointment[]>();
    for (const apt of appointments) {
      const hour = format(parseISO(apt.scheduled_at), "HH:00");
      if (!appointmentMap.has(hour)) appointmentMap.set(hour, []);
      appointmentMap.get(hour)!.push(apt);
    }

    return (
      <div className="space-y-1">
        {timeSlots.map((slot) => {
          const slotAppts = appointmentMap.get(slot.substring(0, 5) + ":00") ?? [];
          return (
            <div key={slot} className="flex gap-3">
              <div className="w-16 shrink-0 pt-1 text-right">
                <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 font-mono">
                  {slot}
                </span>
              </div>
              <div className="flex-1 border-t border-fcn-primary/5 min-h-[40px] py-1">
                {slotAppts.length > 0 ? (
                  <div className="space-y-1">
                    {slotAppts.map((apt) => renderAppointmentCard(apt, false))}
                  </div>
                ) : (
                  <div className="h-8 rounded border border-dashed border-fcn-primary/5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const dayPills = weekDays.map((day) => ({
    label: format(day, "EEE"),
    date: day,
    isSelected: format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"),
    isToday: isToday(day)
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentLabel}
              initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark min-w-[180px] text-center"
            >
              {currentLabel}
            </motion.p>
          </AnimatePresence>
          <Button variant="ghost" size="sm" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToday} className="ml-2">
            Today
          </Button>
        </div>
        <div className={clsx("relative flex rounded-full border border-fcn-primary/10 bg-fcn-primary/5 p-0.5", isMobile && "hidden")}>
          {(["week", "day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                "relative z-10 px-4 py-1.5 text-xs font-medium rounded-full transition-colors",
                view === v ? "text-white" : "text-fcn-text-light/60 dark:text-fcn-text-dark/60"
              )}
            >
              {v === "week" ? "Week" : "Day"}
              {view === v && !shouldReduceMotion && (
                <motion.span
                  layoutId="scheduleView"
                  className="absolute inset-0 rounded-full bg-fcn-primary -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {isMobile && (
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {dayPills.map((pill) => (
            <button
              key={format(pill.date, "yyyy-MM-dd")}
              onClick={() => setSelectedDate(pill.date)}
              className={clsx(
                "flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                pill.isSelected
                  ? "bg-fcn-primary text-white"
                  : pill.isToday
                    ? "bg-fcn-accent/10 text-fcn-accent"
                    : "text-fcn-text-light/60 hover:bg-fcn-primary/10 dark:text-fcn-text-dark/60"
              )}
            >
              <span>{pill.label}</span>
              <span className="font-bold">{format(pill.date, "d")}</span>
            </button>
          ))}
        </div>
      )}

      {view === "week" ? renderWeekView() : renderDayView()}
    </div>
  );
};
