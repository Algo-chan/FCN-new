import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Sparkles, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import gsap from "gsap";
import { useSound } from "@/hooks/useSound";
import type { ConversationMessage, SupportedLanguage, ParsedAssessment } from "@/types";

const LANGUAGE_CONFIG_MAP: Record<string, { thinkingText: string; greeting: string; name: string; flag: string }> = {
  en: { thinkingText: "Analyzing your symptoms...", greeting: "Hello! I am FCN's AI Health Assistant.", name: "English", flag: "🇬🇧" },
  am: { thinkingText: "ምልክቶችዎን በመተንተን ላይ...", greeting: "ሰላም! እኔ የ FCN የጤና AI ረዳት ነኝ።", name: "አማርኛ", flag: "🇪🇹" },
  so: { thinkingText: "Calaamadahaaga waa la falanqeynayaa...", greeting: "Salaan! Waxaan ahay Kaaliyaha Caafimaadka AI ee FCN.", name: "Soomaali", flag: "🇸🇴" },
  om: { thinkingText: "Malattoolee keessan xiinxalaa jira...", greeting: "Akkam! Ani gargaaraa fayyaa AI FCN ti.", name: "Afaan Oromoo", flag: "🇪🇹" }
};

function parseMarkdown(text: string): string {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  if (html.includes("<li>")) {
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
  }
  html = "<p>" + html + "</p>";
  return html;
}

function ThinkingBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2 px-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fcn-accent/20">
        <Sparkles className="h-3.5 w-3.5 text-fcn-accent" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-gray-800 px-4 py-3 text-gray-100">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-fcn-accent" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-fcn-accent" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-fcn-accent" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
        <p className="text-xs text-gray-400">{text}</p>
      </div>
    </div>
  );
}

interface ConversationChatProps {
  language: SupportedLanguage;
  conversation: ConversationMessage[];
  currentRound: number;
  isLoading: boolean;
  isComplete: boolean;
  finalAssessment: ParsedAssessment | null;
  onSendMessage: (message: string) => Promise<void>;
  onSkipToAssessment: () => Promise<void>;
  onStartOver: () => void;
  onBookConsultation?: () => void;
}

export const ConversationChat = ({
  language,
  conversation,
  currentRound,
  isLoading,
  isComplete,
  finalAssessment,
  onSendMessage,
  onSkipToAssessment,
  onStartOver,
  onBookConsultation
}: ConversationChatProps) => {
  const [input, setInput] = useState("");
  const [showGreeting, setShowGreeting] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const isAiThinking = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const { playNotification, playSuccess } = useSound();

  const langConfig = LANGUAGE_CONFIG_MAP[language] || LANGUAGE_CONFIG_MAP.en;

  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading && !isAiThinking.current) {
      isAiThinking.current = true;
      setShowThinking(true);
      if (avatarRef.current && !shouldReduceMotion) {
        gsap.to(avatarRef.current, {
          scale: 1.05,
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut"
        });
      }
    } else if (!isLoading) {
      isAiThinking.current = false;
      setShowThinking(false);
      if (avatarRef.current && !shouldReduceMotion) {
        gsap.killTweensOf(avatarRef.current);
        gsap.to(avatarRef.current, { scale: 1, duration: 0.2 });
      }
      if (conversation.length > 0 && !isComplete) {
        playNotification();
      }
      if (isComplete) {
        if (finalAssessment && (finalAssessment.risk_level === "LOW" || finalAssessment.risk_level === "MEDIUM")) {
          playSuccess();
        } else {
          playNotification();
        }
      }
    }
  }, [isLoading, conversation.length, isComplete, finalAssessment, shouldReduceMotion, playNotification, playSuccess]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, showThinking, showGreeting]);

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    await onSendMessage(msg);
  }, [input, isLoading, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const dots = [false, false, false].map((_, i) => i < currentRound);
  const maxRounds = 3;

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-fcn-primary/10 bg-white/80 backdrop-blur dark:bg-fcn-dark/70">
      <div className="flex items-center justify-between border-b border-fcn-primary/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-fcn-accent" />
          <span className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
            FCN AI Health Assistant
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-full bg-fcn-primary/10 px-2 py-0.5 text-xs text-fcn-primary">
            {langConfig.flag} {langConfig.name}
          </span>
          <div className="flex items-center gap-1">
            {dots.map((filled, i) => (
              <motion.div
                key={i}
                animate={filled ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.4 }}
                className={clsx(
                  "h-2 w-2 rounded-full",
                  filled ? "bg-fcn-accent" : "bg-gray-500"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            Round {currentRound} of {maxRounds}
          </span>
          <button
            onClick={onStartOver}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fcn-text-light/50 transition-colors hover:bg-fcn-primary/10 hover:text-fcn-primary dark:text-fcn-text-dark/50"
          >
            <RotateCcw className="h-3 w-3" />
            Start Over
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {showGreeting && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-end gap-2 px-4"
          >
            <div ref={avatarRef} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fcn-accent/20">
              <Sparkles className="h-3.5 w-3.5 text-fcn-accent" />
            </div>
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-gray-800 px-4 py-2 text-sm leading-relaxed text-gray-100">
              {langConfig.greeting}
            </div>
          </motion.div>
        )}

        {conversation.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={idx}
              initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15, originX: isUser ? 1 : 0 }}
              className={clsx(
                "flex items-end gap-2 px-4",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              {isUser ? (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fcn-primary/20 text-xs font-medium text-fcn-primary">
                  U
                </div>
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fcn-accent/20">
                  <Sparkles className="h-3.5 w-3.5 text-fcn-accent" />
                </div>
              )}
              <div
                className={clsx(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                  isUser
                    ? "rounded-br-sm bg-gradient-to-r from-fcn-accent to-fcn-accent/80 text-white"
                    : "rounded-bl-sm bg-gray-800 text-gray-100"
                )}
              >
                {msg.role === "assistant" ? (
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
              </div>
            </motion.div>
          );
        })}

        {showThinking && <ThinkingBubble text={langConfig.thinkingText} />}

        {isComplete && finalAssessment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-fcn-accent/30" />
              <span className="text-xs font-medium text-fcn-accent">✅ Assessment Complete</span>
              <div className="h-px flex-1 bg-fcn-accent/30" />
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {!isComplete && (
        <div className="border-t border-fcn-primary/10 p-4">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentRound === 0
                  ? "Describe your symptoms in detail..."
                  : currentRound === 1
                    ? "Answer the questions above..."
                    : "Provide any additional information..."
              }
              disabled={isLoading}
              maxLength={1000}
              rows={2}
              className="w-full resize-none rounded-lg border border-fcn-primary/10 bg-fcn-light/50 px-4 py-3 pr-20 text-sm text-fcn-text-light placeholder-gray-400 outline-none transition-colors focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">{input.length}/1000</span>
              {currentRound < 2 && (
                <button
                  onClick={onSkipToAssessment}
                  disabled={isLoading}
                  className="text-xs text-fcn-primary hover:text-fcn-accent disabled:opacity-50"
                >
                  Skip to Assessment
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-fcn-primary text-white transition-all hover:shadow-[0_0_16px_rgba(10,126,164,0.35)] disabled:opacity-50"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
