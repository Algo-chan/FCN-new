import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, ArrowUp, X } from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";

interface ChatInputProps {
  appointmentId: string;
  isReadOnly: boolean;
  endedAt?: string | null;
  onSendMessage: (text: string) => void;
  onSendFile: (file: File) => void;
  onTyping: (typing: boolean) => void;
}

const EMOJIS = ["😊", "👍", "❤️", "🙏", "✅", "👋", "😄", "🎉", "💊", "🏥", "📋", "🩺", "👨‍⚕️", "👩‍⚕️", "💉", "🧬", "📊", "🔬", "🫀", "🧠"];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojis(false);
  };

  const hasContent = text.trim().length > 0 || selectedFile !== null;

  return (
    <div className="border-t border-gray-800 bg-gray-900/80 px-4 py-3">
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
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-teal-400"
          title="Attach file"
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

        <div className="relative">
          <button
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
                className="absolute bottom-full left-0 mb-2 grid w-64 grid-cols-5 gap-1 rounded-lg border border-gray-700 bg-gray-900 p-2 shadow-xl"
              >
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
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

        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="max-h-[120px] min-h-[40px] w-full resize-none rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!hasContent || sending}
          className={clsx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            hasContent && !sending
              ? "bg-teal-500 text-white hover:bg-teal-400"
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
    </div>
  );
}
