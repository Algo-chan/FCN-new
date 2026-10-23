import React, { useState } from "react";
import { Star, X, Check, Stethoscope, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { appointmentsService } from "@/services/appointments.service";
import toast from "react-hot-toast";
import { clsx } from "clsx";

interface RateDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  doctorName: string;
  doctorSpecialty?: string | null;
  doctorPhoto?: string | null;
  existingRating?: {
    rating: number;
    review_text?: string | null;
  } | null;
  onRated?: (data: any) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor experience",
  2: "Could have been better",
  3: "Good consultation",
  4: "Very helpful & thorough",
  5: "Exceptional care! Highly recommend"
};

const QUICK_TAGS = [
  "Clear explanation",
  "Attentive & caring",
  "Punctual & professional",
  "Helpful prescription",
  "Great bedside manner",
  "Felt truly listened to",
  "Reassuring & patient"
];

export const RateDoctorModal: React.FC<RateDoctorModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  doctorName,
  doctorSpecialty = "General Practitioner",
  doctorPhoto,
  existingRating,
  onRated
}) => {
  const [rating, setRating] = useState<number>(existingRating?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>(existingRating?.review_text ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentScore = hoverRating || rating;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
      // Remove from review text if present
      setReviewText((prev) => prev.replace(new RegExp(`\\b${tag}\\.?\\s*`, "i"), "").trim());
    } else {
      setSelectedTags((prev) => [...prev, tag]);
      // Append tag to review text if not already included
      setReviewText((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed}. ${tag}` : tag;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Please select a star rating between 1 and 5");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await appointmentsService.rate(appointmentId, rating, reviewText.trim() || undefined);
      toast.success("Thank you! Your rating and review have been submitted.");
      if (onRated) {
        onRated(res?.data?.rating ?? { rating, review_text: reviewText });
      }
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || "Failed to submit rating. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-slate-900/95 backdrop-blur-xl p-6 sm:p-7 shadow-2xl transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header: Doctor Info */}
        <div className="flex items-center gap-3.5 mb-5">
          {doctorPhoto ? (
            <img
              src={doctorPhoto}
              alt={doctorName}
              className="h-14 w-14 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md font-bold text-lg shrink-0">
              {doctorName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>{doctorSpecialty || "General Practitioner"}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
              {doctorName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              How was your medical consultation?
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating Selector */}
          <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] p-4 text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={clsx(
                      "h-8 w-8 sm:h-9 sm:w-9 transition-colors",
                      star <= currentScore
                        ? "text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]"
                        : "text-slate-300 dark:text-slate-700 hover:text-amber-200"
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Dynamic Label */}
            <p className="mt-2 text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 transition-all h-5 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{RATING_LABELS[currentScore] || "Select your rating"}</span>
            </p>
          </div>

          {/* Quick Highlight Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              What went well? <span className="font-normal text-slate-400">(optional tags)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={clsx(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                      isSelected
                        ? "bg-teal-500 text-white shadow-xs font-semibold"
                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written Feedback Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="review-textarea" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Written Feedback</span>
                <span className="font-normal text-slate-400 text-[11px]">(optional)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {reviewText.length}/1000
              </span>
            </div>
            <textarea
              id="review-textarea"
              rows={3}
              maxLength={1000}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience (e.g., clarity of medical advice, listening, timeliness)..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all resize-none"
            />
          </div>

          {/* Trust Footnote */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
            🛡️ Verified reviews help other patients choose the right care and help dedicated doctors build their clinical reputation on Fast Care Now.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs sm:text-sm font-semibold"
            >
              Skip
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating < 1}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md hover:from-teal-600 hover:to-emerald-700 transition-all active:scale-95"
            >
              {isSubmitting ? "Submitting..." : existingRating ? "Update Review" : "Submit Rating & Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
