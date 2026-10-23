import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ExternalLink, AlertCircle, FlaskConical, ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";
import { format } from "date-fns";
import type { Message } from "@/types";
import { clsx } from "clsx";
import { createPortal } from "react-dom";

interface ChatMessageProps {
  message: Message;
  isSender: boolean;
  showAvatar: boolean;
  isNew?: boolean;
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4"
      onClick={onClose}
    >
      {/* Top Inspection Bar with Zoom controls */}
      <div
        className="absolute top-4 inset-x-4 flex items-center justify-between z-10 max-w-4xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-bold text-white shadow-lg">
          <FlaskConical className="h-4 w-4 text-emerald-400" />
          <span className="truncate max-w-[200px] sm:max-w-[320px]">
            {title || "Clinical Lab Result"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-700 shadow-lg">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-emerald-400 px-2 select-none min-w-[44px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Open Original Image in New Tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1 border-l border-slate-700"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Inspection Viewport */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-auto p-4 select-none"
        onClick={onClose}
      >
        <motion.img
          initial={{ scale: 0.8 }}
          animate={{ scale: zoom }}
          exit={{ scale: 0.8 }}
          transition={{ duration: 0.15 }}
          src={src}
          alt={title || "Full size"}
          className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl cursor-zoom-in"
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

export function ChatMessage({ message, isSender, showAvatar, isNew }: ChatMessageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (message.is_system_message) {
    const prescriptionMatch = message.message_text.match(/PRESCRIPTION_ISSUED:(.+)/);
    const doctorName = message.sender_name ?? "Doctor";
    const prescriptionId = prescriptionMatch?.[1];

    return (
      <motion.div
        initial={isNew ? { scale: 0.9, opacity: 0 } : undefined}
        animate={isNew ? { scale: [0.9, 1.05, 1], opacity: 1 } : undefined}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-2 py-3"
      >
        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-teal-500/30" />
          <span className="text-xs font-medium text-teal-400">Prescription Issued</span>
          <div className="h-px flex-1 bg-teal-500/30" />
        </div>
        <div className="rounded-lg bg-teal-500/10 px-4 py-2 text-center">
          <p className="text-sm text-gray-300">
            Dr. {doctorName} issued a prescription
          </p>
          <a
            href={prescriptionId ? `/pharmacy?prescription=${prescriptionId}` : "/pharmacy"}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300"
          >
            View in Pharmacy →
          </a>
        </div>
      </motion.div>
    );
  }

  const timeStr = format(new Date(message.sent_at), "hh:mm a");
  const isImage = message.file_type === "image" && message.file_url;
  const isPdf = message.file_type === "pdf" && message.file_url;

  // Check if this file is explicitly tagged as a Lab Result
  const isLabResult = message.file_name?.includes("[Lab Result]");
  const cleanFileName = isLabResult
    ? message.file_name?.replace("[Lab Result]", "").trim()
    : message.file_name;

  const bubbleVariants = {
    sender: "bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl rounded-br-sm",
    receiver: "bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm"
  };

  return (
    <motion.div
      initial={isNew ? { scale: 0.8, opacity: 0 } : undefined}
      animate={isNew ? { scale: 1, opacity: 1 } : undefined}
      transition={{ duration: 0.15, originX: isSender ? 1 : 0 }}
      className={clsx(
        "flex items-end gap-2 px-4",
        isSender ? "flex-row-reverse" : "flex-row"
      )}
    >
      {showAvatar && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-medium text-teal-400">
          {message.sender_name?.charAt(0) ?? "?"}
        </div>
      )}
      {!showAvatar && <div className="w-7 shrink-0" />}

      <div className={clsx("flex max-w-[80%] sm:max-w-[75%] flex-col", isSender ? "items-end" : "items-start")}>
        {message.error && (
          <div className="mb-1 flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            Failed to send. Tap to retry.
          </div>
        )}

        <div
          className={clsx(
            "px-3 py-2",
            isLabResult
              ? "bg-slate-900 border border-emerald-500/40 text-gray-100 rounded-2xl shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
              : isSender
              ? bubbleVariants.sender
              : bubbleVariants.receiver,
            message.error && "ring-1 ring-red-400",
            isImage && "p-2"
          )}
        >
          {/* Distinct Lab Result Header Badge */}
          {isLabResult && (
            <div className="flex items-center justify-between gap-2 px-1 pb-2 mb-2 border-b border-emerald-500/20">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <FlaskConical className="h-3 w-3" />
                </span>
                <span className="text-[11px] font-black tracking-wider text-emerald-400 uppercase">
                  Lab Result
                </span>
              </div>
              <span className="text-[10px] text-emerald-400/80 font-medium">
                Tap to inspect
              </span>
            </div>
          )}

          {/* Patient's Note / Context for Lab Result */}
          {message.message_text && isLabResult && (
            <div className="mb-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border-l-2 border-emerald-400 text-xs text-emerald-100 font-medium">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                Patient Notes:
              </span>
              <p className="whitespace-pre-wrap leading-relaxed">{message.message_text}</p>
            </div>
          )}

          {/* Lab Image View */}
          {isImage && (
            <div className="relative group">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 rounded-lg">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                </div>
              )}
              <img
                src={message.file_url!}
                alt={cleanFileName ?? "Lab Result"}
                className={clsx(
                  "max-w-[260px] sm:max-w-[300px] cursor-pointer rounded-xl object-cover transition-transform group-hover:scale-[1.01]",
                  !imageLoaded && "blur-md"
                )}
                style={{ aspectRatio: "auto" }}
                onLoad={() => setImageLoaded(true)}
                onClick={() => setLightboxOpen(true)}
              />
              <div
                onClick={() => setLightboxOpen(true)}
                className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <span className="px-2.5 py-1.5 rounded-lg bg-black/70 text-xs font-bold text-white border border-white/20 flex items-center gap-1.5">
                  <ZoomIn className="h-3.5 w-3.5 text-emerald-400" />
                  Inspect Lab Values
                </span>
              </div>
              {cleanFileName && (
                <p className="mt-1 px-1 text-[11px] text-gray-400 truncate max-w-[260px]">
                  {cleanFileName}
                </p>
              )}
            </div>
          )}

          {/* PDF View */}
          {isPdf && (
            <div className="flex items-center gap-3 p-1">
              <FileText className="h-8 w-8 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{cleanFileName ?? "Lab Document"}</p>
                {message.file_size_bytes && (
                  <p className="text-xs text-gray-400">{formatFileSize(message.file_size_bytes)}</p>
                )}
              </div>
              <a
                href={message.file_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30"
              >
                Open PDF
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Standard Text Message (when not a file) */}
          {message.message_type === "text" && message.message_text && !isLabResult && (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.message_text}
            </p>
          )}
        </div>

        <div className={clsx("mt-0.5 flex items-center gap-1 px-1", isSender && "flex-row-reverse")}>
          <span className="text-[10px] text-gray-500">{timeStr}</span>
          {isSender && (
            <motion.span
              initial={false}
              animate={message.read_at ? { opacity: 1 } : { opacity: 0.5 }}
              className={clsx(
                "text-[10px]",
                message.read_at ? "text-teal-400" : "text-gray-500"
              )}
            >
              {message.read_at ? "✓✓" : "✓"}
            </motion.span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            src={message.file_url!}
            title={cleanFileName ?? "Lab Result"}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
