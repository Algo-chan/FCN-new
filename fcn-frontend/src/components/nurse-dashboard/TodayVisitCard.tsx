import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { MapPin, AlertTriangle, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import type { TodayVisit } from "@/services/nurse-dashboard.service";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VisitPreparationView } from "./VisitPreparationView";

interface TodayVisitCardProps {
  visit: TodayVisit;
  index?: number;
}

const timeColor = (label: string) => {
  if (label.startsWith("In")) return "text-fcn-accent";
  if (label.includes("min ago") && !label.startsWith("In")) return "text-fcn-text-light/40 dark:text-fcn-text-dark/40";
  return "text-fcn-success";
};

export const TodayVisitCard = ({ visit, index = 0 }: TodayVisitCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [prepOpen, setPrepOpen] = useState(false);

  const openMaps = () => {
    if (visit.home_lat && visit.home_lng) {
      window.open(`https://maps.google.com/?q=${visit.home_lat},${visit.home_lng}`, "_blank");
    }
  };

  const isNow = visit.time_label.startsWith("In") && !visit.time_label.includes("h");

  return (
    <>
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.3 }}
      >
        <div className={clsx(
          "flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-fcn-dark transition-all",
          isNow ? "border-fcn-accent/30 shadow-md" : "border-fcn-primary/10"
        )}>
          {isNow && !shouldReduceMotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 rounded-lg border-2 border-fcn-accent/30 pointer-events-none"
              style={{ animation: "pulse-border 2s infinite" }}
            />
          )}

          <div className="flex flex-col items-center w-16 shrink-0">
            <span className={clsx("text-xs font-mono font-bold", timeColor(visit.time_label))}>
              {format(parseISO(visit.scheduled_at), "h:mm")}
            </span>
            <span className="text-[9px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
              {format(parseISO(visit.scheduled_at), "a")}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Avatar name={visit.patient_name} role="patient" size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark truncate">
                  {visit.patient_name}
                </p>
                {visit.home_address && (
                  <p className="text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50 truncate flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    {visit.home_address}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 mt-1.5">
              {visit.known_allergies && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-fcn-danger/10 text-fcn-danger">
                  <AlertTriangle className="h-2.5 w-2.5" /> Allergy
                </span>
              )}
              {visit.chronic_conditions.length > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-fcn-accent/10 text-fcn-accent">
                  <AlertTriangle className="h-2.5 w-2.5" /> Chronic
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant={visit.status === "confirmed" ? "success" : visit.status === "scheduled" ? "info" : "neutral"} size="sm">
              {visit.status}
            </Badge>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={() => setPrepOpen(true)}>
                Prepare
              </Button>
              {(visit.home_lat && visit.home_lng) ? (
                <button onClick={openMaps} className="p-1.5 rounded-lg border border-fcn-primary/10 text-fcn-primary hover:bg-fcn-primary/5" title="Directions">
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>

      {prepOpen && (
        <VisitPreparationView
          appointmentId={visit.id}
          onClose={() => setPrepOpen(false)}
        />
      )}
    </>
  );
};
