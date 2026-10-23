import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Calendar, Phone, Stethoscope, ArrowRight, X } from "lucide-react";
import type { ArticleAuthor } from "@/types";
import { getInitials } from "@/utils/formatters";

interface FloatingDoctorDockProps {
  author: ArticleAuthor;
}

export const FloatingDoctorDock = ({ author }: FloatingDoctorDockProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const doctorName = author.user?.full_name || "Doctor";
  const firstName = doctorName.split(" ")[0];
  const fee = author.consultation_fee_etb;

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Authoring physician booking dock"
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 280 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100%-2rem)] sm:w-auto"
      >
        <div className="relative flex items-center justify-between gap-2.5 sm:gap-5 rounded-full border border-teal-500/30 bg-white/95 p-2 sm:p-2.5 shadow-[0_12px_40px_rgba(13,148,136,0.18)] backdrop-blur-md dark:border-teal-500/20 dark:bg-slate-900/95 dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {/* Doctor Avatar with verified badge */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-full border-2 border-teal-500 bg-gradient-to-br from-teal-500 to-sky-600 text-sm font-bold text-white shadow-sm">
                {author.photo_url ? (
                  <img
                    src={author.photo_url}
                    alt={doctorName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getInitials(doctorName)}</span>
                )}
              </div>
              {author.verified && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-white text-emerald-600 shadow dark:bg-slate-900"
                  title="FCN Verified Medical Specialist"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" />
                </div>
              )}
            </div>

            {/* Doctor Info */}
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Dr. {doctorName.replace(/^Dr\.?\s*/i, "")}
                </p>
                <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                  <Stethoscope className="h-2.5 w-2.5" />
                  {author.specialty}
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {author.hospital?.name ? (
                  <span className="hidden md:inline">{author.hospital.name} • </span>
                ) : null}
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {fee} ETB
                </span>{" "}
                / consultation
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {author.user?.phone && (
              <a
                href={`tel:${author.user.phone}`}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 active:scale-95 transition-all dark:bg-emerald-950/50 dark:text-emerald-300"
                title={`Direct 2G Phone Call: ${author.user.phone}`}
              >
                <Phone className="h-4 w-4" />
              </a>
            )}

            <Link
              to={`/appointments/book?doctor=${author.user_id}`}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-700 active:scale-95 transition-all"
            >
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Book Dr. {firstName}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <button
              onClick={() => setIsDismissed(true)}
              className="hidden sm:flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss booking dock"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
