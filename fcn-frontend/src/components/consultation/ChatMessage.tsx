import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, ExternalLink, AlertCircle } from "lucide-react";
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

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.img
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        src={src}
        alt="Full size"
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
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

  const bubbleVariants = {
    sender: "bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl rounded-br-sm",
    receiver: "bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm"
  };

  return (
    <motion.div
      initial={isNew ? { scale: 0.8, opacity: 0 } : undefined}
      animate={isNew ? { scale: 1, opacity: 1 } : undefined}
      transition={{ duration: 0.15 }}
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

      <div className={clsx("flex max-w-[75%] flex-col", isSender ? "items-end" : "items-start")}>
        {message.error && (
          <div className="mb-1 flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            Failed to send. Tap to retry.
          </div>
        )}

        <div
          className={clsx(
            "px-3 py-2",
            isSender ? bubbleVariants.sender : bubbleVariants.receiver,
            message.error && "ring-1 ring-red-400",
            isImage && "p-1"
          )}
        >
          {isImage && (
            <div className="relative">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                </div>
              )}
              <img
                src={message.file_url!}
                alt={message.file_name ?? "Image"}
                className={clsx(
                  "max-w-[240px] cursor-pointer rounded-lg object-cover",
                  !imageLoaded && "blur-md"
                )}
                style={{ aspectRatio: "auto" }}
                onLoad={() => setImageLoaded(true)}
                onClick={() => setLightboxOpen(true)}
              />
              {message.file_name && (
                <p className="mt-1 px-1 text-xs text-gray-400">{message.file_name}</p>
              )}
            </div>
          )}

          {isPdf && (
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 shrink-0 text-red-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{message.file_name ?? "Document"}</p>
                {message.file_size_bytes && (
                  <p className="text-xs text-gray-400">{formatFileSize(message.file_size_bytes)}</p>
                )}
              </div>
              <a
                href={message.file_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex shrink-0 items-center gap-1 rounded-md bg-teal-500/20 px-2 py-1 text-xs font-medium text-teal-400 hover:bg-teal-500/30"
              >
                Open PDF
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {message.message_type === "text" && message.message_text && (
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
          <Lightbox src={message.file_url!} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
