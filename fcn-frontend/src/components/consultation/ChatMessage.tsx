import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ExternalLink,
  AlertCircle,
  FlaskConical,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Check,
  CheckCheck,
  Pill,
  ShieldCheck,
  Clock,
  Sparkles,
  Stethoscope,
  Lock,
  Download
} from "lucide-react";
import { format } from "date-fns";
import type { Message } from "@/types";
import { clsx } from "clsx";
import { createPortal } from "react-dom";

interface ChatMessageProps {
  message: Message;
  isSender: boolean;
  showAvatar: boolean;
  isNew?: boolean;
  isDoctor?: boolean;
  otherPartySpecialty?: string;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Lightbox({
  src,
  title,
  onClose
}: {
  src: string;
  title?: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 0.35, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.35, 0.6));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 select-none"
      onClick={onClose}
    >
      {/* Top Inspection Bar */}
      <div
        className="absolute top-4 inset-x-4 flex items-center justify-between z-10 max-w-4xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-xs font-bold text-white shadow-xl backdrop-blur-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <FlaskConical className="h-3.5 w-3.5" />
          </div>
          <span className="truncate max-w-[200px] sm:max-w-[320px]">
            {title || "Clinical Diagnostic Report"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-sm">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-emerald-400 px-2 min-w-[48px] text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Open Original in New Tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1 border-l border-slate-700/80"
            title="Close Lightbox (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Inspection Viewport */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-auto p-4"
        onClick={onClose}
      >
        <motion.img
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: zoom, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.2 }}
          src={src}
          alt={title || "Lab Diagnostic Full View"}
          className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl cursor-zoom-in ring-1 ring-white/10"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((prev) => (prev >= 2 ? 1 : prev + 0.5));
          }}
        />
      </div>
    </motion.div>,
    document.body
  );
}

export function ChatMessage({
  message,
  isSender,
  showAvatar,
  isNew,
  isDoctor,
  otherPartySpecialty
}: ChatMessageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // ── 1. System Clinical Event Messages ─────────────────────────────────────
  if (message.is_system_message) {
    const rawText = message.message_text || "";
    const prescriptionMatch = rawText.match(/PRESCRIPTION_ISSUED:(.+)/);
    const doctorName = message.sender_name ?? "Doctor";
    const prescriptionId = prescriptionMatch?.[1];

    if (prescriptionMatch) {
      return (
        <motion.div
          initial={isNew ? { scale: 0.92, opacity: 0 } : undefined}
          animate={isNew ? { scale: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.3 }}
          className="my-4 flex flex-col items-center justify-center px-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-teal-500/25 bg-teal-500/5 dark:bg-teal-500/10 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md shadow-teal-500/20">
                <Pill className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    Official Prescription Issued
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    {format(new Date(message.sent_at), "hh:mm a")}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                  Dr. {doctorName} created a new prescription
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-teal-500/15 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Ready for digital fulfillment & delivery
              </span>
              <a
                href={prescriptionId ? `/pharmacy?prescription=${prescriptionId}` : "/pharmacy"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
              >
                <span>View in Pharmacy</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </motion.div>
      );
    }

    // Generic system notice (Consultation started, extended, concluded)
    return (
      <div className="my-3 flex items-center justify-center px-4">
        <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/80 dark:border-white/10 dark:bg-slate-800/80 px-4 py-1.5 text-xs text-slate-600 dark:text-slate-300 shadow-xs backdrop-blur-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="font-medium text-center">{rawText}</span>
          <span className="text-[10px] text-slate-400 tabular-nums ml-1">
            {format(new Date(message.sent_at), "hh:mm a")}
          </span>
        </div>
      </div>
    );
  }

  // ── 2. Standard Peer Messages (Doctor vs Patient) ─────────────────────────
  const timeStr = format(new Date(message.sent_at), "hh:mm a");
  const isImage = message.file_type === "image" && message.file_url;
  const isPdf = message.file_type === "pdf" && message.file_url;

  // Lab Result explicit tagging
  const isLabResult = message.file_name?.includes("[Lab Result]");
  const cleanFileName = isLabResult
    ? message.file_name?.replace("[Lab Result]", "").trim()
    : message.file_name;

  // Sender name logic
  const isOtherPartyDoctor = !isSender && !isDoctor;
  const senderDisplayName = message.sender_name || (isSender ? "You" : "Participant");

  return (
    <motion.div
      initial={isNew ? { scale: 0.94, opacity: 0 } : undefined}
      animate={isNew ? { scale: 1, opacity: 1 } : undefined}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={clsx(
        "group flex items-end gap-2.5 px-3 sm:px-4",
        isSender ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar column */}
      {showAvatar ? (
        <div className="relative shrink-0 mb-1">
          <div
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-xs select-none",
              isSender
                ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
                : isOtherPartyDoctor
                ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            )}
            title={senderDisplayName}
          >
            {senderDisplayName.charAt(0).toUpperCase()}
          </div>
          {isOtherPartyDoctor && (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-500 text-white border-2 border-white dark:border-slate-900"
              title="Verified Physician"
            >
              <Stethoscope className="h-2 w-2" />
            </span>
          )}
        </div>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      {/* Message Content Container */}
      <div
        className={clsx(
          "flex max-w-[85%] sm:max-w-[75%] md:max-w-[70%] flex-col",
          isSender ? "items-end" : "items-start"
        )}
      >


        {/* Failed to send error chip */}
        {message.error && (
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-rose-500">
            <AlertCircle className="h-3 w-3" />
            Failed to send. Please retry.
          </div>
        )}

        {/* Bubble Surface */}
        <div
          className={clsx(
            "relative text-sm transition-all",
            isLabResult
              ? "rounded-2xl border border-emerald-500/40 bg-slate-900 text-slate-100 shadow-md shadow-emerald-500/10 p-3 ring-1 ring-emerald-500/20"
              : isSender
              ? "rounded-2xl rounded-br-xs bg-gradient-to-br from-teal-600 via-teal-600 to-emerald-600 text-white shadow-sm shadow-teal-900/10 px-4 py-2.5"
              : "rounded-2xl rounded-bl-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 shadow-xs px-4 py-2.5",
            isImage && !isLabResult && "p-1.5",
            message.error && "ring-2 ring-rose-500"
          )}
        >
          {/* Distinct Lab Result Header */}
          {isLabResult && (
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <FlaskConical className="h-3.5 w-3.5" />
                </span>
                <div>
                  <span className="block text-[11px] font-black uppercase tracking-wider text-emerald-400">
                    Clinical Lab Result
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    Verified diagnostic upload
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                <ZoomIn className="h-3 w-3" />
                Inspect Values
              </span>
            </div>
          )}

          {/* Patient Note for Lab Result */}
          {message.message_text && isLabResult && (
            <div className="mb-2.5 px-3 py-2 rounded-xl bg-emerald-500/10 border-l-2 border-emerald-400 text-xs text-emerald-100 font-medium">
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 mb-0.5">
                Clinical Context & Notes:
              </span>
              <p className="whitespace-pre-wrap leading-relaxed">{message.message_text}</p>
            </div>
          )}

          {/* Image View */}
          {isImage && (
            <div className="relative group overflow-hidden rounded-xl">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 rounded-xl min-h-[160px]">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                </div>
              )}
              <img
                src={message.file_url!}
                alt={cleanFileName ?? "Attachment preview"}
                className={clsx(
                  "max-w-[260px] sm:max-w-[320px] max-h-[320px] w-auto cursor-pointer rounded-xl object-cover transition-transform duration-200 group-hover:scale-[1.02]",
                  !imageLoaded && "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onClick={() => setLightboxOpen(true)}
              />
              <div
                onClick={() => setLightboxOpen(true)}
                className="absolute inset-0 rounded-xl bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-xs"
              >
                <span className="px-3 py-1.5 rounded-xl bg-black/80 text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 shadow-lg">
                  <ZoomIn className="h-3.5 w-3.5 text-emerald-400" />
                  Tap to Inspect
                </span>
              </div>
              {cleanFileName && (
                <div className="mt-1.5 px-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[200px]">{cleanFileName}</span>
                  {message.file_size_bytes && (
                    <span className="text-[10px] tabular-nums shrink-0 ml-2">
                      {formatFileSize(message.file_size_bytes)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PDF Document View */}
          {isPdf && (
            <div className="flex items-center gap-3 p-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs sm:text-sm font-bold text-current">
                  {cleanFileName ?? "Clinical Document.pdf"}
                </p>
                {message.file_size_bytes && (
                  <p className="text-[11px] opacity-75 tabular-nums">
                    {formatFileSize(message.file_size_bytes)}
                  </p>
                )}
              </div>
              <a
                href={message.file_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex shrink-0 items-center gap-1 rounded-xl bg-white/20 dark:bg-white/10 hover:bg-white/30 px-3 py-1.5 text-xs font-bold transition-colors"
              >
                <span>Open</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Standard Text Message */}
          {message.message_type === "text" && message.message_text && !isLabResult && (
            <p className="whitespace-pre-wrap break-words leading-relaxed text-sm select-text">
              {message.message_text}
            </p>
          )}
        </div>

        {/* Message Meta Info (Timestamp + Read Receipts) */}
        <div
          className={clsx(
            "mt-1 flex items-center gap-1.5 px-1 select-none",
            isSender ? "justify-end" : "justify-start"
          )}
        >
          <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
            {timeStr}
          </span>
          {isSender && (
            <span
              className={clsx(
                "flex items-center transition-colors",
                message.read_at
                  ? "text-sky-500 dark:text-sky-400"
                  : "text-slate-400 dark:text-slate-500"
              )}
              title={message.read_at ? "Read by recipient" : "Sent"}
            >
              {message.read_at ? (
                <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" />
              ) : (
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Full-screen Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && message.file_url && (
          <Lightbox
            src={message.file_url}
            title={cleanFileName ?? "Clinical Lab Diagnostic"}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
