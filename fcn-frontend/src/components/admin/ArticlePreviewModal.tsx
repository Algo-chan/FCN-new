import { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Send,
  Clock,
  Stethoscope,
  Building2,
  Award,
  Calendar,
  Eye,
  FileText
} from "lucide-react";
import type { Article } from "@/types";
import { getInitials } from "@/utils/formatters";

interface ArticlePreviewModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (articleId: string) => Promise<void>;
  onReject: (articleId: string, reason: string) => Promise<void>;
  isProcessing: boolean;
}

export const ArticlePreviewModal = ({
  article,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isProcessing
}: ArticlePreviewModalProps) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!isOpen || !article) return null;

  const author = article.author;
  const authorName = author?.user?.full_name || "Doctor";

  const handleApprove = async () => {
    await onApprove(article.id);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 3) {
      alert("Please enter the specific clinical revision request or feedback for the doctor.");
      return;
    }
    await onReject(article.id, rejectionReason.trim());
    setRejectMode(false);
    setRejectionReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        data-lenis-prevent
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Clinical Moderation Inspector
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate max-w-xl">
              {article.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          data-lenis-prevent
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 overscroll-contain"
        >
          {/* Author Doctor Verification Card */}
          <div className="rounded-2xl border border-teal-500/20 bg-teal-50/50 p-4 sm:p-5 dark:border-teal-500/10 dark:bg-teal-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-sm font-bold text-white shadow overflow-hidden border-2 border-teal-500 shrink-0">
                  {author?.photo_url ? (
                    <img
                      src={author.photo_url}
                      alt={authorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(authorName)}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Dr. {authorName.replace(/^Dr\.?\s*/i, "")}
                    </p>
                    {author?.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3 fill-emerald-600 text-white" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {author?.specialty}
                    {author?.hospital?.name ? ` • ${author.hospital.name}` : ""}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap sm:flex-col items-start sm:items-end gap-1">
                {author?.license_number && (
                  <span className="font-mono">License: {author.license_number}</span>
                )}
                <span>Submitted: {new Date(article.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Article Excerpt */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Clinical Summary / Excerpt
            </span>
            <p className="mt-1 border-l-4 border-teal-500 pl-4 text-base italic text-slate-700 dark:text-slate-300">
              {article.excerpt}
            </p>
          </div>

          {/* Cover image if present */}
          {article.cover_image_url && (
            <div className="overflow-hidden rounded-2xl aspect-[16/9] max-h-72 bg-slate-100 dark:bg-slate-800">
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Rendered Content */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Article Body Content
            </span>
            <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-6 dark:border-white/5 dark:bg-slate-800/40 text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-sans">
              {article.content}
            </div>
          </div>

          {/* Rejection / Revision Request Form */}
          {rejectMode && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900/30 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4" />
                <span>Specify Revisions Requested</span>
              </div>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Explain to the doctor what needs improvement (e.g. 'Please adjust pediatric dosages to align with Ethiopian MOH guidelines', 'Add guidance regarding injera preparation')..."
                className="w-full rounded-xl border border-rose-300 bg-white p-3 text-xs sm:text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-rose-500 focus:outline-none dark:border-rose-800 dark:bg-slate-900 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-rose-700 disabled:opacity-50"
                >
                  {isProcessing ? "Submitting..." : "Send Feedback & Request Changes"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-white/10 px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Current Status: <strong className="capitalize">{article.status.replace("_", " ")}</strong>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!rejectMode && (
              <button
                type="button"
                onClick={() => setRejectMode(true)}
                disabled={isProcessing}
                className="rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-400"
              >
                Request Revisions
              </button>
            )}

            <button
              type="button"
              onClick={handleApprove}
              disabled={isProcessing}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 active:scale-95 transition-all"
            >
              {isProcessing ? "Publishing..." : "Approve & Publish Live"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
