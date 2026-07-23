import { useEffect, useCallback, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { MessageCircle, User, Pill, FileText, LogOut, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";
import { useConsultationStore } from "@/store/consultation.store";
import { useSocket } from "@/hooks/useSocket";
import { useSound } from "@/hooks/useSound";
import { consultationService } from "@/services/consultation.service";
import { MessagesList } from "@/components/consultation/MessagesList";
import { ChatInput } from "@/components/consultation/ChatInput";
import { PatientHealthPassport } from "@/components/consultation/PatientHealthPassport";
import { PrescribePanel } from "@/components/consultation/PrescribePanel";
import type { ConsultationContext, Message } from "@/types";
import { clsx } from "clsx";

type MobileTab = "chat" | "info";

export default function ConsultationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const user = useAuthStore((state) => state.user);
  const {
    messages,
    setMessages,
    addMessage,
    isTyping,
    setTyping,
    isReadOnly,
    endedAt,
    setReadOnly,
    markMessagesRead,
    unreadCount,
    resetUnread,
    incrementUnread,
    reset: resetStore
  } = useConsultationStore();

  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [summaryNote, setSummaryNote] = useState("");
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const queryClient = useQueryClient();
  const pageFocusedRef = useRef(true);

  const { socket, joinConsultation, sendMessage, sendFile, startTyping, stopTyping, endConsultation } =
    useSocket();
  const { playNotification, playSuccess } = useSound();

  const {
    data: contextData,
    isLoading: contextLoading,
    refetch: refetchContext
  } = useQuery<ConsultationContext>({
    queryKey: ["consultation-context", appointmentId],
    queryFn: async () => {
      const result = await consultationService.getConsultationContext(appointmentId!);
      return result.data as ConsultationContext;
    },
    enabled: !!appointmentId
  });

  const loadMessages = useCallback(
    async (p: number) => {
      if (!appointmentId) return;
      try {
        const result = await consultationService.getMessages(appointmentId, p);
        const msgs = result.data as Message[];
        const meta = result.meta as { totalPages?: number };
        if (p === 1) {
          setMessages(msgs);
        } else {
          const storeMessages = useConsultationStore.getState().messages;
          setMessages([...msgs, ...storeMessages]);
        }
        setHasMoreMessages(meta ? p < meta.totalPages! : false);
      } catch {
        toast.error("Failed to load messages");
      }
    },
    [appointmentId, setMessages]
  );

  useEffect(() => {
    if (appointmentId && initialLoad) {
      joinConsultation(appointmentId);
      loadMessages(1);
      setInitialLoad(false);
    }
  }, [appointmentId, joinConsultation, loadMessages, initialLoad]);

  useEffect(() => {
    if (contextData?.isReadOnly) {
      setReadOnly(true, contextData.appointment.consultation_ended_at ?? undefined);
    }
  }, [contextData, setReadOnly]);

  useEffect(() => {
    if (!socket || !appointmentId) return;

    const handleNewMessage = (message: Message) => {
      addMessage(message);
      if (message.sender_user_id !== user?.id) {
        incrementUnread();
        if (!pageFocusedRef.current) {
          playNotification();
        }
      }
    };

    const handleUserTyping = (data: { userId: string; userName: string }) => {
      if (data.userId !== user?.id) {
        setTyping({ userId: data.userId, userName: data.userName });
      }
    };

    const handleUserStoppedTyping = () => {
      setTyping(null);
    };

    const handleMessagesRead = (data: { messageIds: string[] }) => {
      markMessagesRead(data.messageIds);
    };

    const handleConsultationEnded = (data: { ended_at: string; ended_by: string }) => {
      setReadOnly(true, data.ended_at);
      playNotification();
      toast(`Dr. ${data.ended_by} has ended the consultation`, { icon: "🔒" });
      refetchContext();
    };

    const handlePrescriptionIssued = () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    };

    const handleError = (error: { message: string }) => {
      toast.error(error.message);
    };

    const handleConsultationJoined = (data: { recentMessages?: Message[] }) => {
      if (data.recentMessages && data.recentMessages.length > 0) {
        setMessages(data.recentMessages);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("consultation_ended", handleConsultationEnded);
    socket.on("prescription_issued", handlePrescriptionIssued);
    socket.on("error", handleError);
    socket.on("consultation_joined", handleConsultationJoined);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("consultation_ended", handleConsultationEnded);
      socket.off("prescription_issued", handlePrescriptionIssued);
      socket.off("error", handleError);
      socket.off("consultation_joined", handleConsultationJoined);
    };
  }, [
    socket,
    appointmentId,
    user?.id,
    addMessage,
    incrementUnread,
    setTyping,
    markMessagesRead,
    setReadOnly,
    playNotification,
    refetchContext
  ]);

  useEffect(() => {
    const handleFocus = () => { pageFocusedRef.current = true; };
    const handleBlur = () => { pageFocusedRef.current = false; };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [resetStore]);

  const handleSendMessage = useCallback(
    (text: string) => {
      if (appointmentId) {
        sendMessage(appointmentId, text);
      }
    },
    [appointmentId, sendMessage]
  );

  const handleSendFile = useCallback(
    async (file: File) => {
      if (appointmentId) {
        try {
          await sendFile(appointmentId, file);
          playSuccess();
        } catch {
          toast.error("Failed to send file");
        }
      }
    },
    [appointmentId, sendFile, playSuccess]
  );

  const handleTyping = useCallback(
    (typing: boolean) => {
      if (!appointmentId) return;
      if (typing) {
        startTyping(appointmentId);
      } else {
        stopTyping(appointmentId);
      }
    },
    [appointmentId, startTyping, stopTyping]
  );

  const handleEndConsultation = useCallback(() => {
    if (!appointmentId) return;
    if (window.confirm("Are you sure you want to end this consultation?")) {
      endConsultation(appointmentId);
    }
  }, [appointmentId, endConsultation]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMessages(nextPage);
  }, [page, loadMessages]);

  const handleSaveNote = useCallback(async () => {
    if (!appointmentId || !summaryNote.trim()) return;
    try {
      await consultationService.saveSummaryNote(appointmentId, summaryNote.trim());
      toast.success("Summary note saved");
      setShowNoteInput(false);
      setSummaryNote("");
      playSuccess();
    } catch {
      toast.error("Failed to save note");
    }
  }, [appointmentId, summaryNote, playSuccess]);

  const handlePrescriptionIssued = useCallback(() => {
    playSuccess();
    refetchContext();
  }, [playSuccess, refetchContext]);

  const isDoctor = user?.role === "doctor";
  const otherPartyName = isDoctor
    ? contextData?.appointment?.patient?.full_name
    : contextData?.appointment?.doctor?.full_name;
  const otherPartySpecialty = contextData?.appointment?.doctor?.specialty;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-950">
      <div className="hidden flex-1 lg:flex">
        <div className="flex w-[65%] flex-col border-r border-gray-800">
          <TopBar
            otherPartyName={otherPartyName ?? "Loading..."}
            otherPartySpecialty={isDoctor ? undefined : otherPartySpecialty ?? undefined}
            isDoctor={isDoctor}
            isReadOnly={isReadOnly}
            onPrescribe={() => setPrescribeOpen(true)}
            onEndConsultation={handleEndConsultation}
            onAddNote={() => setShowNoteInput(!showNoteInput)}
            showNoteInput={showNoteInput}
          />

          {showNoteInput && isDoctor && (
            <div className="border-b border-gray-800 bg-gray-900/80 px-4 py-2">
              <div className="flex items-end gap-2">
                <textarea
                  value={summaryNote}
                  onChange={(e) => setSummaryNote(e.target.value)}
                  placeholder="Write a summary note for this consultation..."
                  rows={2}
                  maxLength={2000}
                  className="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-teal-500/50"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={!summaryNote.trim()}
                  className="flex h-9 items-center gap-1 rounded-lg bg-teal-500 px-3 text-xs font-medium text-white hover:bg-teal-400 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Save
                </button>
              </div>
              <p className="mt-1 text-right text-[10px] text-gray-600">{summaryNote.length}/2000</p>
            </div>
          )}

          <MessagesList
            messages={messages}
            currentUserId={user?.id ?? ""}
            isLoadingMore={false}
            hasMoreMessages={hasMoreMessages}
            onLoadMore={handleLoadMore}
          />

          {isTyping && (
            <div className="border-t border-gray-800 px-4 py-1.5">
              <TypingIndicator userName={isTyping.userName} />
            </div>
          )}

          <ChatInput
            appointmentId={appointmentId ?? ""}
            isReadOnly={isReadOnly}
            endedAt={endedAt}
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
            onTyping={handleTyping}
          />
        </div>

        <div className="relative w-[35%] overflow-y-auto">
          <PatientHealthPassport
            context={contextData ?? null}
            isLoading={contextLoading}
          />

          <PrescribePanel
            appointmentId={appointmentId ?? ""}
            patientName={contextData?.appointment?.patient?.full_name ?? "Patient"}
            isOpen={isDoctor && prescribeOpen}
            onClose={() => setPrescribeOpen(false)}
            onPrescriptionIssued={handlePrescriptionIssued}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:hidden">
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => { setMobileTab("chat"); resetUnread(); }}
            className={clsx(
              "relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              mobileTab === "chat" ? "text-teal-400" : "text-gray-500"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
            {mobileTab === "chat" && (
              <motion.div
                layoutId="mobileTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
              />
            )}
          </button>
          <button
            onClick={() => setMobileTab("info")}
            className={clsx(
              "relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              mobileTab === "info" ? "text-teal-400" : "text-gray-500"
            )}
          >
            <User className="h-4 w-4" />
            Patient Info
            {mobileTab === "info" && (
              <motion.div
                layoutId="mobileTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
              />
            )}
          </button>
        </div>

        {mobileTab === "chat" ? (
          <div className="flex flex-1 flex-col">
            <TopBar
              otherPartyName={otherPartyName ?? "Loading..."}
              otherPartySpecialty={isDoctor ? undefined : otherPartySpecialty ?? undefined}
              isDoctor={isDoctor}
              isReadOnly={isReadOnly}
              onPrescribe={() => setPrescribeOpen(true)}
              onEndConsultation={handleEndConsultation}
              onAddNote={() => setShowNoteInput(!showNoteInput)}
              showNoteInput={showNoteInput}
            />

            {showNoteInput && isDoctor && (
              <div className="border-b border-gray-800 bg-gray-900/80 px-4 py-2">
                <div className="flex items-end gap-2">
                  <textarea
                    value={summaryNote}
                    onChange={(e) => setSummaryNote(e.target.value)}
                    placeholder="Write a summary note..."
                    rows={2}
                    maxLength={2000}
                    className="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-teal-500/50"
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={!summaryNote.trim()}
                    className="flex h-9 items-center gap-1 rounded-lg bg-teal-500 px-3 text-xs font-medium text-white hover:bg-teal-400 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <MessagesList
              messages={messages}
              currentUserId={user?.id ?? ""}
              isLoadingMore={false}
              hasMoreMessages={hasMoreMessages}
              onLoadMore={handleLoadMore}
            />

            {isTyping && (
              <div className="border-t border-gray-800 px-4 py-1.5">
                <TypingIndicator userName={isTyping.userName} />
              </div>
            )}

            <ChatInput
              appointmentId={appointmentId ?? ""}
              isReadOnly={isReadOnly}
              endedAt={endedAt}
              onSendMessage={handleSendMessage}
              onSendFile={handleSendFile}
              onTyping={handleTyping}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <PatientHealthPassport
              context={contextData ?? null}
              isLoading={contextLoading}
            />
          </div>
        )}

        <PrescribePanel
          appointmentId={appointmentId ?? ""}
          patientName={contextData?.appointment.patient.full_name ?? "Patient"}
          isOpen={isDoctor && prescribeOpen}
          onClose={() => setPrescribeOpen(false)}
          onPrescriptionIssued={handlePrescriptionIssued}
        />
      </div>
    </div>
  );
}

function TopBar({
  otherPartyName,
  otherPartySpecialty,
  isDoctor,
  isReadOnly,
  onPrescribe,
  onEndConsultation,
  onAddNote,
  showNoteInput
}: {
  otherPartyName: string;
  otherPartySpecialty?: string;
  isDoctor: boolean;
  isReadOnly: boolean;
  onPrescribe: () => void;
  onEndConsultation: () => void;
  onAddNote: () => void;
  showNoteInput: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/20 text-sm font-bold text-teal-400">
          {otherPartyName?.charAt(0) ?? "?"}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-100">{otherPartyName}</h2>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-gray-500">
              {otherPartySpecialty ? `${otherPartySpecialty}` : isDoctor ? "Patient" : "Doctor"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isDoctor && !isReadOnly && (
          <>
            <button
              onClick={onAddNote}
              className={clsx(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                showNoteInput
                  ? "bg-teal-500/20 text-teal-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Note
            </button>
            <button
              onClick={onPrescribe}
              className="flex items-center gap-1 rounded-lg bg-teal-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-400"
            >
              <Pill className="h-3.5 w-3.5" />
              Prescribe
            </button>
            <button
              onClick={onEndConsultation}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              End
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ userName }: { userName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-1.5"
    >
      <span className="text-xs text-gray-500">{userName} is typing</span>
      <span className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </motion.div>
  );
}
