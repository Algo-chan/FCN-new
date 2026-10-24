import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { format, isToday, isYesterday } from "date-fns";
import { ArrowDown, ShieldCheck, Lock, Sparkles, MessageCircle } from "lucide-react";
import type { Message } from "@/types";
import { ChatMessage } from "./ChatMessage";
import { clsx } from "clsx";

interface MessagesListProps {
  messages: Message[];
  currentUserId: string;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMore: () => void;
  onNewMessageBelow?: (message: Message) => void;
  isDoctor?: boolean;
  otherPartySpecialty?: string;
  otherPartyName?: string;
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function shouldShowDateSeparator(current: Message, previous: Message | undefined): boolean {
  if (!previous) return true;
  const curDate = new Date(current.sent_at);
  const prevDate = new Date(previous.sent_at);
  return (
    curDate.getDate() !== prevDate.getDate() ||
    curDate.getMonth() !== prevDate.getMonth() ||
    curDate.getFullYear() !== prevDate.getFullYear()
  );
}

function shouldGroupMessages(current: Message, previous: Message | undefined): boolean {
  if (!previous) return false;
  if (current.sender_user_id !== previous.sender_user_id) return false;
  if (current.is_system_message || previous.is_system_message) return false;
  const diff = Math.abs(
    new Date(current.sent_at).getTime() - new Date(previous.sent_at).getTime()
  );
  return diff < 120000; // 2 minutes
}

export function MessagesList({
  messages,
  currentUserId,
  isLoadingMore,
  hasMoreMessages,
  onLoadMore,
  onNewMessageBelow,
  isDoctor,
  otherPartySpecialty,
  otherPartyName
}: MessagesListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewMessageBanner, setShowNewMessageBanner] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const lastMessageId = useRef<string | null>(null);

  const { ref: topSentinelRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView && hasMoreMessages && !isLoadingMore) {
        onLoadMore();
      }
    }
  });

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
    if (nearBottom) {
      setShowNewMessageBanner(false);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (messages.length === 0) return;

    const isNewMessage = messages.length > prevMessagesLength.current;

    if (isNewMessage) {
      const latestMessage = messages[messages.length - 1];

      if (latestMessage.sender_user_id !== currentUserId && !isNearBottom) {
        setShowNewMessageBanner(true);
        if (onNewMessageBelow) {
          onNewMessageBelow(latestMessage);
        }
      }

      if (isNearBottom) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        });
      }
    }

    prevMessagesLength.current = messages.length;
    lastMessageId.current = messages[messages.length - 1]?.id ?? null;
  }, [messages, currentUserId, isNearBottom, onNewMessageBelow]);

  useEffect(() => {
    if (messages.length > 0 && prevMessagesLength.current === 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessageBanner(false);
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
      >
        <div className="py-4 space-y-1">
          {/* Top Pagination Loading Indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-800/80 px-3.5 py-1 text-xs text-slate-500 shadow-xs">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                <span>Loading previous clinical messages...</span>
              </div>
            </div>
          )}

          {/* Infinite Scroll Trigger Sentinel */}
          {hasMoreMessages && !isLoadingMore && (
            <div ref={topSentinelRef} className="h-4" />
          )}

          {/* Retention Notice */}
          {!hasMoreMessages && messages.length > 0 && (
            <div className="px-4 py-2 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/60 dark:border-white/5 dark:bg-slate-900/60 px-3 py-1 text-[11px] text-slate-400">
                <Lock className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                <span>End-to-end encrypted session • 30-day clinical retention</span>
              </div>
            </div>
          )}

          {/* Empty Conversation Welcome Banner */}
          {messages.length === 0 && !isLoadingMore && (
            <div className="flex flex-col items-center justify-center p-8 text-center my-auto min-h-[300px]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-sm mb-4">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Secure Telehealth Room Ready
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                {isDoctor
                  ? `You are connected with ${otherPartyName || "your patient"}. Review their health passport on the right and begin the clinical consultation.`
                  : `You are connected with Dr. ${otherPartyName || "your physician"}. Send your questions, current symptoms, or attach medical documents.`}
              </p>
            </div>
          )}

          {/* Messages Feed */}
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : undefined;
            const showDate = shouldShowDateSeparator(message, prevMessage);
            const grouped = shouldGroupMessages(message, prevMessage);
            const isNew = message.id === lastMessageId.current;

            return (
              <div key={message.id}>
                {/* Date Separator */}
                {showDate && (
                  <div className="my-4 flex items-center justify-center px-4">
                    <div className="relative flex w-full items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200/80 dark:border-white/10" />
                      </div>
                      <div className="relative rounded-full border border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-900/90 px-3.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 shadow-xs backdrop-blur-xs">
                        {getDateLabel(new Date(message.sent_at))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Bubble Item */}
                <div className={clsx("transition-all", grouped ? "mt-1" : "mt-3")}>
                  <ChatMessage
                    message={message}
                    isSender={message.sender_user_id === currentUserId}
                    showAvatar={!grouped}
                    isNew={isNew}
                    isDoctor={isDoctor}
                    otherPartySpecialty={otherPartySpecialty}
                  />
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* Floating "New message below" pill */}
      <AnimatePresence>
        {showNewMessageBanner && messages.length > 0 && (
          <motion.button
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-teal-900/20 hover:from-teal-500 hover:to-emerald-500 active:scale-95 transition-all"
          >
            <span>New clinical message below</span>
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
