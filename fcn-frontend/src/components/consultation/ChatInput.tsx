import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, ArrowUp, X, FlaskConical, Sparkles, FileText, Check } from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";

interface ChatInputProps {
  appointmentId: string;
  isReadOnly: boolean;
  endedAt?: string | null;
  onSendMessage: (text: string) => void;
  onSendFile: (file: File, options?: { messageText?: string; isLabResult?: boolean }) => Promise<void> | void;
  onTyping: (typing: boolean) => void;
}

const EMOJIS = ["😊", "👍", "❤️", "🙏", "✅", "👋", "😄", "🎉", "💊", "🏥", "📋", "🩺", "👨‍⚕️", "👩‍⚕️", "💉", "🧬", "📊", "🔬", "🫀", "🧠"];

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
  onTyping
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

  if (isReadOnly) {
    return (
      <div className="border-t border-gray-800 bg-gray-900/50 px-4 py-3 text-center">
        <p className="text-sm text-gray-500">
          🔒 This consultation has ended
          {endedAt ? ` on ${format(new Date(endedAt), "MMM d, yyyy 'at' hh:mm a")}` : ""}.
          Chat is read-only.
        </p>
      </div>
    );
  }

  const handleSend = useCallback(async () => {
    if (selectedFile) {
      setSending(true);
      await onSendFile(selectedFile);
      setSelectedFile(null);
      setSending(false);
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setText("");
    onTyping(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
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
    onTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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
  };

  const hasContent = text.trim().length > 0 || selectedFile !== null;

  return (
    <div className="border-t border-gray-800 bg-gray-900/80 px-4 py-3">
      {/* Standard selected file preview banner */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="mb-2 flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2"
          >
            {selectedFile.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <span className="text-sm text-gray-300">{selectedFile.name}</span>
            )}
            <span className="text-xs text-gray-500">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
            <button
              onClick={() => setSelectedFile(null)}
              className="ml-auto rounded-full p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {/* Dedicated "Lab Result" Button */}
        <button
          type="button"
          onClick={() => labFileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/25 active:scale-95 text-xs font-bold transition-all shadow-xs shrink-0"
          title="Photograph or upload paper lab result for doctor"
        >
          <FlaskConical className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="hidden xs:inline">Lab Result</span>
        </button>

        {/* Hidden Lab Result File / Camera Input */}
        <input
          ref={labFileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleLabFileSelect}
        />

        {/* Standard attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-teal-400"
          title="Attach other file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Emoji picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-teal-400"
            title="Emoji"
          >
            <span className="text-lg">😊</span>
          </button>
          <AnimatePresence>
            {showEmojis && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 grid w-64 grid-cols-5 gap-1 rounded-lg border border-gray-700 bg-gray-900 p-2 shadow-xl z-30"
              >
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="rounded p-1 text-lg hover:bg-gray-800"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat text input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or share a question..."
            rows={1}
            className="max-h-[120px] min-h-[40px] w-full resize-none rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
          />
        </div>

        {/* Send message button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!hasContent || sending}
          className={clsx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            hasContent && !sending
              ? "bg-teal-500 text-white hover:bg-teal-400 shadow-md shadow-teal-500/20"
              : "bg-gray-800 text-gray-600"
          )}
        >
          {sending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
          ) : (
            <ArrowUp className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* ── Lab Result Review & Add Thoughts Modal ───────────────────────── */}
      <AnimatePresence>
        {isLabModalOpen && labFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
              data-lenis-prevent
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Share Paper Lab Result
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Doctor will review these values immediately
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseLabModal}
                  disabled={sendingLab}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Visual Preview */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                  {labFile.type.startsWith("image/") ? (
                    <div className="relative group">
                      <img
                        src={URL.createObjectURL(labFile)}
                        alt="Lab Result Preview"
                        className="max-h-56 w-auto mx-auto rounded-xl object-contain shadow-md"
                      />
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                        High Res Preview
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <FileText className="h-12 w-12 text-emerald-400 mb-2" />
                      <p className="text-sm font-bold text-white">{labFile.name}</p>
                      <p className="text-xs text-slate-500">PDF Document</p>
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-slate-400">
                    <span className="truncate max-w-[200px] font-medium">{labFile.name}</span>
                    <span className="font-semibold text-emerald-400">
                      {(labFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                {/* Quick Test Tags */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Quick Tag (Click to Add):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {LAB_TAG_SUGGESTIONS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTagToLabNote(tag)}
                        className={clsx(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border",
                          labNote.includes(tag)
                            ? "bg-emerald-500/25 border-emerald-500 text-emerald-300"
                            : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-emerald-500/50 hover:text-white"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Thoughts / Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Your notes or context for the doctor:
                  </label>
                  <textarea
                    value={labNote}
                    onChange={(e) => setLabNote(e.target.value)}
                    placeholder="e.g. Taken this morning at Tikur Anbessa Hospital after 12 hours fasting. Doctor wanted to check my glucose levels..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 resize-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Sharing test date, hospital name, or specific symptoms helps the doctor interpret your result accurately.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCloseLabModal}
                  disabled={sendingLab}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSendLabResult}
                  disabled={sendingLab}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs sm:text-sm hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {sendingLab ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Sending to Doctor...</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical className="h-4 w-4" />
                      <span>Send Lab Result to Doctor</span>
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
