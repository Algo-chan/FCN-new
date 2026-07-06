import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  Stethoscope,
  ClipboardList,
  UserCheck,
  Home,
  CalendarPlus,
  Save
} from "lucide-react";
import { clsx } from "clsx";
import gsap from "gsap";
import { useSound } from "@/hooks/useSound";
import type { ParsedAssessment } from "@/types";
import { Button } from "@/components/ui/Button";

interface FinalAssessmentCardProps {
  assessment: ParsedAssessment;
  onBookConsultation?: () => void;
  onSaveAndReturn?: () => void;
  onStartNew?: () => void;
}

function SectionAccordion({
  icon,
  title,
  children,
  defaultOpen = false,
  danger = false
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={clsx("overflow-hidden rounded-lg border", danger ? "border-fcn-danger/20" : "border-fcn-primary/10")}>
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "flex w-full items-center justify-between px-4 py-3 text-left transition-colors",
          danger ? "hover:bg-fcn-danger/5" : "hover:bg-fcn-primary/5"
        )}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">{title}</span>
        </div>
        <ChevronDown
          className={clsx(
            "h-4 w-4 transition-transform text-fcn-text-light/50",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={clsx(
              "border-t px-4 py-3",
              danger ? "border-fcn-danger/10 bg-fcn-danger/5" : "border-fcn-primary/10"
            )}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3 }
  })
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.6, duration: 0.3 }
  }
};

export const FinalAssessmentCard = ({
  assessment,
  onBookConsultation,
  onSaveAndReturn,
  onStartNew
}: FinalAssessmentCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  const bannerRef = useRef<HTMLDivElement>(null);
  const { playTransition } = useSound();

  const isCritical = assessment.risk_level === "CRITICAL";
  const isHigh = assessment.risk_level === "HIGH";
  const isMedium = assessment.risk_level === "MEDIUM";

  useEffect(() => {
    if ((isCritical || isHigh) && bannerRef.current && !shouldReduceMotion) {
      gsap.fromTo(
        bannerRef.current,
        { x: -5 },
        { x: 5, duration: 0.05, repeat: 5, yoyo: true, ease: "power1.inOut", onComplete: () => gsap.set(bannerRef.current, { x: 0 }) }
      );
    }
  }, [isCritical, isHigh, shouldReduceMotion]);

  const riskConfig = (() => {
    switch (assessment.risk_level) {
      case "LOW":
        return {
          gradient: "from-fcn-success to-emerald-500",
          icon: Shield,
          label: "Low Risk",
          prefix: "✅"
        };
      case "MEDIUM":
        return {
          gradient: "from-fcn-warning to-amber-500",
          icon: AlertTriangle,
          label: "Moderate Risk",
          prefix: "⚠️"
        };
      case "HIGH":
        return {
          gradient: "from-orange-500 to-orange-600",
          icon: AlertCircle,
          label: "High Risk — Consult Today",
          prefix: "🔴"
        };
      case "CRITICAL":
        return {
          gradient: "from-fcn-danger to-red-600",
          icon: AlertCircle,
          label: "Critical — Seek Emergency Care Now",
          prefix: "🚨"
        };
    }
  })();

  const RiskIcon = riskConfig.icon;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-2xl space-y-4"
    >
      <motion.div
        ref={bannerRef}
        initial={shouldReduceMotion ? false : { scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={clsx(
          "relative overflow-hidden rounded-xl bg-gradient-to-r p-5 text-white",
          riskConfig.gradient,
          isCritical && "animate-pulse-glow"
        )}
      >
        {isCritical && (
          <div className="absolute inset-0 rounded-xl border-2 border-fcn-danger/50" style={{ animation: "pulse-red-border 1.5s ease-in-out infinite" }} />
        )}
        <div className="relative flex items-center gap-3">
          <RiskIcon className="h-8 w-8 shrink-0" />
          <div>
            <h3 className="text-lg font-bold">{riskConfig.prefix} {riskConfig.label}</h3>
            {assessment.risk_explanation && (
              <p className="mt-1 text-sm text-white/80">{assessment.risk_explanation}</p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <SectionAccordion
          icon={<Stethoscope className="h-4 w-4 text-fcn-primary" />}
          title="Likely Causes"
          defaultOpen={true}
        >
          <ol className="ml-4 list-decimal space-y-1">
            {assessment.likely_causes.map((cause, i) => (
              <li key={i} className="pl-1 text-sm text-fcn-text-light dark:text-fcn-text-dark">
                {cause}
              </li>
            ))}
          </ol>
        </SectionAccordion>
      </motion.div>

      <motion.div
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <SectionAccordion
          icon={<ClipboardList className="h-4 w-4 text-fcn-primary" />}
          title="Recommended Actions"
          defaultOpen={true}
        >
          <ul className="space-y-2">
            {assessment.recommended_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-fcn-text-light dark:text-fcn-text-dark">
                <span className="mt-0.5 text-fcn-success">✓</span>
                {action}
              </li>
            ))}
          </ul>
        </SectionAccordion>
      </motion.div>

      <motion.div
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <SectionAccordion
          icon={<UserCheck className="h-4 w-4 text-fcn-primary" />}
          title="Recommended Specialist"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-fcn-primary/10 px-4 py-2 text-sm font-medium text-fcn-primary">
              {assessment.recommended_specialty}
            </span>
            <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              Consult a {assessment.recommended_specialty} specialist
            </span>
          </div>
        </SectionAccordion>
      </motion.div>

      <motion.div
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <SectionAccordion
          icon={<AlertTriangle className="h-4 w-4 text-fcn-warning" />}
          title="Warning Signs"
          danger
        >
          <ul className="space-y-2">
            {assessment.warning_signs.map((sign, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-fcn-text-light dark:text-fcn-text-dark">
                <span>⚠️</span>
                {sign}
              </li>
            ))}
          </ul>
        </SectionAccordion>
      </motion.div>

      <motion.div
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <SectionAccordion
          icon={<Home className="h-4 w-4 text-fcn-primary" />}
          title="Home Care Tips"
        >
          <ul className="ml-4 list-disc space-y-1">
            {assessment.home_care_tips.map((tip, i) => (
              <li key={i} className="text-sm text-fcn-text-light dark:text-fcn-text-dark">
                {tip}
              </li>
            ))}
          </ul>
        </SectionAccordion>
      </motion.div>

      <motion.div
        custom={5}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-fcn-warning/30 bg-fcn-warning/5 p-4"
      >
        <p className="text-xs leading-relaxed text-fcn-text-light/70 dark:text-fcn-text-dark/70">
          {assessment.disclaimer}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          <img src="/logo/fcn-logo-full.png" alt="FCN" className="h-5 w-auto" />
          Powered by Claude AI
        </div>
      </motion.div>

      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2 pt-2"
      >
        <Button
          variant="primary"
          size="lg"
          icon={<CalendarPlus className="h-5 w-5" />}
          className="w-full"
          onClick={() => {
            playTransition();
            onBookConsultation?.();
          }}
        >
          Book a Consultation
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={<Save className="h-4 w-4" />}
            className="flex-1"
            onClick={onSaveAndReturn}
          >
            Save &amp; Return to Dashboard
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={onStartNew}
          >
            Start New Assessment
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
