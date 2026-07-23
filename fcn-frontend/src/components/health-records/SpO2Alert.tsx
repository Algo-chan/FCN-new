import { motion } from "framer-motion";
import { AlertTriangle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

interface SpO2AlertProps {
  value: number;
  context: "form" | "summary" | "history";
}

export const SpO2Alert = ({ value, context }: SpO2AlertProps) => {
  if (context === "form") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="mt-3 overflow-hidden rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/20"
      >
        <div className="relative p-4">
          <div className="absolute inset-0">
            <div className="h-full w-full animate-pulse-ring rounded-xl border-2 border-red-400/30" />
          </div>
          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-700 dark:text-red-400">
                ⚠️ Critical Oxygen Level: {value}%
              </h4>
              <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
                SpO2 below 95% may indicate a serious condition. Please seek medical attention immediately.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Link to="/appointments/book" className="flex-1">
                <Button className="w-full" size="sm">
                  Book Consultation Now
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => window.open("https://www.who.int/news-room/fact-sheets/detail/hypoxia", "_blank")}
              >
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                Learn More About SpO2
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (context === "summary") {
    return (
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-4 overflow-hidden rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
              SpO2: {value}% — Critical
            </p>
            <Link
              to="/appointments/book"
              className="mt-0.5 inline-block text-[10px] font-medium text-red-600 underline hover:text-red-700 dark:text-red-400"
            >
              Book consultation now →
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
      ⚠️ Critical
    </span>
  );
};
