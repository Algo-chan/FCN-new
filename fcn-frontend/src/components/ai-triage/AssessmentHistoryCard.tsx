import { motion, useReducedMotion } from "motion/react";
import { clsx } from "clsx";
import { format } from "date-fns";
import { Eye, ArrowRight } from "lucide-react";
import type { SupportedLanguage } from "@/types";
import { Badge } from "@/components/ui/Badge";

const languageLabels: Record<string, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
  am: { name: "አማርኛ", flag: "🇪🇹" },
  so: { name: "Soomaali", flag: "🇸🇴" },
  om: { name: "Afaan Oromoo", flag: "🇪🇹" }
};

const riskVariant = (level: string | null): "success" | "warning" | "danger" | "info" | "neutral" => {
  switch (level) {
    case "LOW": return "success";
    case "MEDIUM": return "warning";
    case "HIGH": return "danger";
    case "CRITICAL": return "danger";
    default: return "neutral";
  }
};

interface AssessmentHistoryCardProps {
  id: string;
  created_at: string;
  initial_symptoms: string;
  risk_level: string | null;
  is_complete: boolean;
  recommended_specialty: string | null;
  language: string;
  round_count: number;
  onView: (id: string) => void;
  onResume: (id: string) => void;
}

export const AssessmentHistoryCard = ({
  id,
  created_at,
  initial_symptoms,
  risk_level,
  is_complete,
  recommended_specialty,
  language,
  round_count,
  onView,
  onResume
}: AssessmentHistoryCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  const langInfo = languageLabels[language] || languageLabels.en;

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -3, boxShadow: "0 18px 40px rgba(10,126,164,0.18)" }}
      transition={{ duration: 0.18 }}
      className="rounded-lg border border-fcn-primary/10 bg-white/80 p-4 backdrop-blur transition-all duration-180 hover:border-fcn-primary/20 dark:bg-fcn-dark/70"
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            {format(new Date(created_at), "MMM d, yyyy · h:mm a")}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm">{langInfo.flag} {langInfo.name}</span>
            {risk_level && (
              <Badge variant={riskVariant(risk_level)} size="sm">
                {risk_level}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <p className="mb-2 text-sm text-fcn-text-light dark:text-fcn-text-dark line-clamp-2">
        {initial_symptoms}
      </p>

      <div className="mb-3 flex items-center gap-3 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
        {recommended_specialty && (
          <span className="text-fcn-primary">{recommended_specialty}</span>
        )}
        <span>Completed in {round_count} round{round_count !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onView(id)}
          className="flex items-center gap-1 rounded-md bg-fcn-primary/10 px-3 py-1.5 text-xs font-medium text-fcn-primary transition-colors hover:bg-fcn-primary/20"
        >
          <Eye className="h-3.5 w-3.5" />
          {is_complete ? "View Full Assessment" : "View Details"}
        </button>
        {!is_complete && (
          <button
            onClick={() => onResume(id)}
            className="flex items-center gap-1 rounded-md bg-fcn-warning/10 px-3 py-1.5 text-xs font-medium text-fcn-warning transition-colors hover:bg-fcn-warning/20"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Resume Assessment
          </button>
        )}
      </div>
    </motion.div>
  );
};
