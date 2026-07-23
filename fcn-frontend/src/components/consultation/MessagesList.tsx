import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useInView } from "react-intersection-observer";
import { format, isToday, isYesterday } from "date-fns";
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
  return diff < 120000;
}

export function MessagesList({
  messages,
  currentUserId,
  isLoadingMore,
  hasMoreMessages,
  onLoadMore,
  onNewMessageBelow
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

  const handleBannerClick = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessageBanner(false);
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700"
      >
        <div className="py-4">
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
            </div>
          )}

          {hasMoreMessages && !isLoadingMore && (
            <div ref={topSentinelRef} className="h-4" />
          )}

          {!hasMoreMessages && messages.length > 0 && (
            <div className="px-4 pb-2 text-center">
              <p className="text-[10px] text-gray-600">
                Some older messages were removed per FCN&apos;s 30-day retention policy
              </p>
            </div>
          )}

          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : undefined;
            const showDate = shouldShowDateSeparator(message, prevMessage);
            const grouped = shouldGroupMessages(message, prevMessage);
            const isNew = message.id === lastMessageId.current;

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="my-3 flex items-center justify-center">
                    <div className="rounded-full bg-gray-800 px-3 py-1">
                      <span className="text-xs text-gray-400">
                        {getDateLabel(new Date(message.sent_at))}
                      </span>
                    </div>
                  </div>
                )}
                <div className={clsx("py-0.5", grouped && index > 0 ? "my-0" : "mt-2")}>
                  <ChatMessage
                    message={message}
                    isSender={message.sender_user_id === currentUserId}
                    showAvatar={!grouped}
                    isNew={isNew}
                  />
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      <AnimatePresence>
        {showNewMessageBanner && messages.length > 0 && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={handleBannerClick}
            className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-teal-500 px-4 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-teal-400"
          >
            New message below ↓
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
