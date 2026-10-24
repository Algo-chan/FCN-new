import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip,
  ArrowUp,
  X,
  FlaskConical,
  Smile,
  FileText,
  Lock,
  Image as ImageIcon
} from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";

interface ChatInputProps {
  appointmentId: string;
  isReadOnly: boolean;
  endedAt?: string | null;
  onSendMessage: (text: string) => void;
  onSendFile: (file: File, options?: { messageText?: string; isLabResult?: boolean }) => Promise<void> | void;
  onTyping: (typing: boolean) => void;
  placeholder?: string;
  isDoctor?: boolean;
}

const EMOJIS = [
  "😊", "👍", "❤️", "🙏", "✅", "👋", "😄", "🎉",
  "💊", "🏥", "📋", "🩺", "👨‍⚕️", "👩‍⚕️", "💉", "🧬",
  "📊", "🔬", "🫀", "🧠"
];

const LAB_TAG_SUGGESTIONS = [
  "Blood Test",
  "Fasting Blood Sugar",
  "CBC",
  "Urinalysis",
  "Lipid Profile",
  "Liver Function",
  "Kidney Panel",
  "X-Ray / Imaging"
];

export function ChatInput({
  isReadOnly,
  endedAt,
  onSendMessage,
  onSendFile,
  onTyping,
  placeholder = "Type your message or clinical question...",
  isDoctor = false
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [sending, setSending] = useState(false);

  // Dedicated Lab Result flow states
  const [labFile, setLabFile] = useState<File | null>(null);
  const [labNote, setLabNote] = useState("");
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [sendingLab, setSendingLab] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const labFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    };
    if (showEmojis) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojis]);

  // Read-only Concluded State
  if (isReadOnly) {
    return (
      <div className="p-3 sm:p-4 pt-1">
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 px-4 py-3 text-center shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Lock className="h-3 w-3" />
            </div>
            <span>
              This consultation has concluded
              {endedAt ? ` on ${format(new Date(endedAt), "MMM d, yyyy 'at' hh:mm a")}` : ""}.
              Chat is archived and read-only.
            </span>
          </div>
        </div>
      </div>
    );
  }

  const handleSend = useCallback(async () => {
    if (selectedFile) {
      setSending(true);
      try {
        await onSendFile(selectedFile);
        setSelectedFile(null);
      } finally {
        setSending(false);
      }
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setText("");
    onTyping(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  }, [text, selectedFile, onSendMessage, onSendFile, onTyping]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    onTyping(value.trim().length > 0);

    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Lab Result file handler
  const handleLabFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLabFile(file);
      setLabNote("");
      setIsLabModalOpen(true);
    }
    if (labFileInputRef.current) {
      labFileInputRef.current.value = "";
    }
  };

  const handleSendLabResult = async () => {
    if (!labFile) return;
    setSendingLab(true);
    try {
      await onSendFile(labFile, {
        messageText: labNote.trim(),
        isLabResult: true
      });
      setIsLabModalOpen(false);
      setLabFile(null);
      setLabNote("");
    } finally {
      setSendingLab(false);
    }
  };

  const handleCloseLabModal = () => {
    if (sendingLab) return;
    setIsLabModalOpen(false);
    setLabFile(null);
    setLabNote("");
  };

  const handleAddTagToLabNote = (tag: string) => {
    setLabNote((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return trimmed;
      return `${tag} - ${trimmed}`;
    });
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojis(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const hasContent = text.trim().length > 0 || selectedFile !== null;

  return (
    <div className="relative px-3 sm:px-4 pb-3 sm:pb-4 pt-1 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent select-none">
      {/* File attachment preview chip */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="mb-2 flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-md backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {selectedFile.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Attachment preview"
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-black/10 shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <FileText className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-500 tabular-nums">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready to send
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-2"
              title="Remove attachment"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Island Dock Container */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-slate-800/90 p-1.5 sm:p-2 shadow-lg shadow-slate-900/5 dark:shadow-black/40 backdrop-blur-md transition-all focus-within:border-teal-500/60 focus-within:ring-2 focus-within:ring-teal-500/20">
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* 1. Dynamic Auto-Expanding Textarea */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="max-h-[130px] min-h-[40px] h-[40px] w-full resize-none rounded-2xl border-0 bg-transparent px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none leading-5"
            />
          </div>

          {/* 2. Lab Result Quick Trigger Pill (Doctor side only) */}
          {isDoctor && (
            <>
              <button
                type="button"
                onClick={() => labFileInputRef.current?.click()}
                className="flex h-10 items-center gap-1.5 px-2.5 sm:px-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 text-xs font-bold transition-all shadow-xs shrink-0 select-none"
                title="Photograph or upload paper lab result for immediate review"
              >
                <FlaskConical className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden md:inline">Lab Result</span>
              </button>

              {/* Hidden Lab Result File Input */}
              <input
                ref={labFileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleLabFileSelect}
              />
            </>
          )}

          {/* 3. Emoji Selector Popover */}
          <div ref={emojiPickerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 dark:border-white/10 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Insert emoji"
            >
              <Smile className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {showEmojis && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full right-0 mb-3 grid w-64 grid-cols-5 gap-1 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-2 shadow-2xl z-30"
                >
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-base hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. Regular Attachment Button (Paperclip) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 dark:border-white/10 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Attach PDF or image document"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Hidden Standard File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* 5. Send Action Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!hasContent || sending}
            className={clsx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all shadow-md active:scale-95",
              hasContent && !sending
                ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-900/25 hover:from-teal-500 hover:to-emerald-500"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200/60 dark:border-white/5"
            )}
            title="Send message (Enter)"
          >
            {sending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <ArrowUp className="h-5 w-5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>


      {/* ── Lab Result Review & Thoughts Modal ───────────────────────────── */}
      <AnimatePresence>
        {isLabModalOpen && labFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Share Clinical Lab Result
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Physician will review these values immediately
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseLabModal}
                  disabled={sendingLab}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Visual Preview */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 text-center">
                  {labFile.type.startsWith("image/") ? (
                    <div className="relative group">
                      <img
                        src={URL.createObjectURL(labFile)}
                        alt="Lab Result Preview"
                        className="max-h-56 w-auto mx-auto rounded-xl object-contain shadow-md"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/75 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                        High Res Preview
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                      <FileText className="h-10 w-10 text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{labFile.name}</p>
                      <p className="text-xs text-slate-500">PDF Clinical Report</p>
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[200px] font-medium">{labFile.name}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {(labFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                {/* Quick Test Tags */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Quick Clinical Tags (Click to Add):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {LAB_TAG_SUGGESTIONS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTagToLabNote(tag)}
                        className={clsx(
                          "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border",
                          labNote.includes(tag)
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500/40"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Context / Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Your notes or context for the physician:
                  </label>
                  <textarea
                    value={labNote}
                    onChange={(e) => setLabNote(e.target.value)}
                    placeholder="e.g. Taken this morning at Tikur Anbessa Hospital after 12 hours fasting..."
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Sharing test date or specific symptoms helps the doctor interpret your result accurately.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCloseLabModal}
                  disabled={sendingLab}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSendLabResult}
                  disabled={sendingLab}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs sm:text-sm hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 active:scale-95"
                >
                  {sendingLab ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Transmitting Lab Document...</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical className="h-4 w-4" />
                      <span>Transmit Lab Result to Doctor</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
