import { useEffect, useCallback, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  User,
  Pill,
  FileText,
  LogOut,
  CheckCircle,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  PhoneCall,
  Phone,
  Lock,
  Clock,
  AlertTriangle
} from "lucide-react";
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
import { ConsultationTimer } from "@/components/consultation/ConsultationTimer";
import { ExtensionApprovalModal } from "@/components/consultation/ExtensionApprovalModal";
import { DirectCallModal } from "@/components/consultation/DirectCallModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ConsultationContext, Message } from "@/types";
import { clsx } from "clsx";

type MobileTab = "chat" | "info";

export default function ConsultationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const user = useAuthStore((state) => state.user);
  const isDoctor = user?.role === "doctor";
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
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [extensionRequest, setExtensionRequest] = useState<{ doctorName: string; minutes: number } | null>(null);
  const [isExtending, setIsExtending] = useState(false);
  const [isDirectCallOpen, setIsDirectCallOpen] = useState(false);
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
    if (contextData?.appointment?.duration_minutes) {
      setDurationMinutes(contextData.appointment.duration_minutes);
    }
  }, [contextData?.appointment?.duration_minutes]);

  const startedAt =
    contextData?.appointment?.consultation_started_at ||
    (contextData?.appointment as any)?.actual_start_time;

  const [remainingSecs, setRemainingSecs] = useState<number>(() => {
    if (!startedAt) return durationMinutes * 60;
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    return Math.max(0, durationMinutes * 60 - elapsed);
  });

  useEffect(() => {
    if (!startedAt) {
      setRemainingSecs(durationMinutes * 60);
      return;
    }
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    setRemainingSecs(Math.max(0, durationMinutes * 60 - elapsed));
  }, [startedAt, durationMinutes]);

  useEffect(() => {
    if (isReadOnly) return;
    const interval = setInterval(() => {
      setRemainingSecs((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isReadOnly]);

  const showFiveMinWarning = !isReadOnly && remainingSecs <= 300 && remainingSecs > 0;

  // Initial doctor auto-greeting simulation with typing indicator on mount for instant consultations
  useEffect(() => {
    if (!contextData?.appointment || messages.length > 0 || isDoctor || isReadOnly) return;

    const doctorName = contextData.appointment.doctor?.full_name ?? "Doctor";
    const timer1 = setTimeout(() => {
      setTyping({ userId: contextData.appointment.doctor_id, userName: `Dr. ${doctorName}` });
    }, 1200);

    const timer2 = setTimeout(() => {
      setTyping(null);
      const greetingMessage: Message = {
        id: `greeting-${Date.now()}`,
        conversation_id: appointmentId!,
        appointment_id: appointmentId!,
        sender_user_id: contextData.appointment.doctor_id,
        recipient_user_id: user?.id ?? "",
        sender_name: `Dr. ${doctorName}`,
        message_text: `Hello! I'm Dr. ${doctorName}. I have reviewed your file and chief complaint. How are you feeling right now?`,
        message_type: "text",
        is_system_message: false,
        sent_at: new Date().toISOString()
      };
      addMessage(greetingMessage);
      playNotification();
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [contextData, messages.length, isDoctor, isReadOnly, appointmentId, user?.id, setTyping, addMessage, playNotification]);

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

    const handleExtensionRequested = (data: { doctorName: string; minutes: number }) => {
      if (!isDoctor) {
        setExtensionRequest({ doctorName: data.doctorName, minutes: data.minutes });
        playNotification();
      }
    };

    const handleExtensionGranted = (data: { durationMinutes?: number; duration_minutes?: number; addedMinutes: number; approvedBy?: string }) => {
      const dur = data.durationMinutes ?? data.duration_minutes ?? (durationMinutes + (data.addedMinutes || 10));
      setDurationMinutes(dur);
      setExtensionRequest(null);
      playSuccess();
      toast.success(`Session extended by +${data.addedMinutes} min (${dur}m total)`);
      refetchContext();
    };

    const handleExtensionDeclined = () => {
      setExtensionRequest(null);
      if (isDoctor) {
        toast("Patient preferred not to extend session. Concluding at regular limit.");
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
    socket.on("extension_requested", handleExtensionRequested);
    socket.on("extension_granted", handleExtensionGranted);
    socket.on("extension_declined", handleExtensionDeclined);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("consultation_ended", handleConsultationEnded);
      socket.off("prescription_issued", handlePrescriptionIssued);
      socket.off("error", handleError);
      socket.off("consultation_joined", handleConsultationJoined);
      socket.off("extension_requested", handleExtensionRequested);
      socket.off("extension_granted", handleExtensionGranted);
      socket.off("extension_declined", handleExtensionDeclined);
    };
  }, [
    socket,
    appointmentId,
    user?.id,
    isDoctor,
    addMessage,
    incrementUnread,
    setTyping,
    markMessagesRead,
    setReadOnly,
    playNotification,
    playSuccess,
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
    async (file: File, options?: { messageText?: string; isLabResult?: boolean }) => {
      if (appointmentId) {
        try {
          await sendFile(appointmentId, file, options);
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
    if (window.confirm("Are you sure you want to conclude and lock this consultation session?")) {
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

  const handleRequestExtension = useCallback(
    async (minutes = 10) => {
      if (!appointmentId || isExtending) return;
      setIsExtending(true);
      try {
        await consultationService.requestExtension(appointmentId, minutes);
        toast.success(`Extension request for +${minutes}m sent to patient`);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to request session extension");
      } finally {
        setIsExtending(false);
      }
    },
    [appointmentId, isExtending]
  );

  const handleRespondExtension = useCallback(
    async (approved: boolean, minutes = 10) => {
      if (!appointmentId) return;
      try {
        await consultationService.respondExtension(appointmentId, approved, minutes);
        setExtensionRequest(null);
        if (approved) {
          toast.success(`Session extended by +${minutes} minutes`);
        } else {
          toast("Extension declined. Session will conclude at current time limit.");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to respond to extension");
      }
    },
    [appointmentId]
  );

  const otherPartyName = isDoctor
    ? contextData?.appointment?.patient?.full_name
    : contextData?.appointment?.doctor?.full_name;
  const otherPartySpecialty = contextData?.appointment?.doctor?.specialty;

  if (!appointmentId) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-fcn-surface-light dark:bg-fcn-dark p-6 text-center">
        <div className="max-w-md rounded-2xl border border-fcn-primary/15 bg-white dark:bg-fcn-surface-dark p-8 shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-fcn-primary/10 text-fcn-primary">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            No Active Consultation Selected
          </h2>
          <p className="mt-2 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            Consultation sessions are tied to confirmed appointments. Select an appointment from your schedule to enter the secure room.
          </p>
          <div className="mt-6">
            <Link
              to={user?.role === "doctor" ? "/doctor/schedule" : "/appointments"}
              className="inline-flex items-center gap-2 rounded-xl bg-fcn-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-fcn-primary/90 transition-all"
            >
              {user?.role === "doctor" ? "View My Schedule" : "View My Appointments"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-[calc(100vh-4rem)] overflow-hidden bg-fcn-surface-light dark:bg-fcn-dark"
    >
      {/* Desktop Split View: 65% Chat Stream, 35% Health Passport */}
      <div className="hidden flex-1 lg:flex">
        <div className="flex w-[65%] flex-col border-r border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark">
          <TopBar
            otherPartyName={otherPartyName ?? "Connecting..."}
            otherPartySpecialty={isDoctor ? undefined : otherPartySpecialty ?? undefined}
            isDoctor={isDoctor}
            isReadOnly={isReadOnly}
            startedAt={startedAt}
            durationMinutes={durationMinutes}
            onPrescribe={() => setPrescribeOpen(true)}
            onEndConsultation={handleEndConsultation}
            onAddNote={() => setShowNoteInput(!showNoteInput)}
            showNoteInput={showNoteInput}
            onRequestExtension={handleRequestExtension}
            isExtending={isExtending}
            onDirectCall={() => setIsDirectCallOpen(true)}
          />

          {isReadOnly && (
            <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <Lock className="h-3.5 w-3.5" />
              <span>Consultation session completed and locked. Conversation is archived for clinical reference.</span>
            </div>
          )}

          {/* 5-Minute Warning Banner */}
          {showFiveMinWarning && (
            <div className="flex items-center justify-between gap-3 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200 font-semibold animate-pulse">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Session ending in {Math.ceil(remainingSecs / 60)} min.</strong>{" "}
                  {isDoctor
                    ? "Please finalize clinical advice or request an extension if required."
                    : "Doctor may request an extension if additional clinical review is needed."}
                </span>
              </div>
              {isDoctor && (
                <button
                  type="button"
                  onClick={() => handleRequestExtension(10)}
                  disabled={isExtending}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shrink-0 shadow-sm transition-all disabled:opacity-50"
                >
                  {isExtending ? "Requesting..." : "+10m Extension"}
                </button>
              )}
            </div>
          )}

          {showNoteInput && isDoctor && (
            <div className="border-b border-fcn-primary/10 bg-fcn-surface-light dark:bg-fcn-dark px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={summaryNote}
                  onChange={(e) => setSummaryNote(e.target.value)}
                  placeholder="Write a clinical summary note for this patient's medical record..."
                  rows={2}
                  maxLength={2000}
                  className="flex-1 resize-none rounded-xl border border-fcn-primary/20 bg-white dark:bg-fcn-surface-dark px-3 py-2 text-sm text-fcn-text-light placeholder:text-fcn-text-light/40 outline-none focus:border-fcn-primary dark:text-fcn-text-dark"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveNote}
                  disabled={!summaryNote.trim()}
                  className="h-10 shrink-0"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Save Note
                </Button>
              </div>
              <p className="mt-1 text-right text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                {summaryNote.length}/2000
              </p>
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
            <div className="border-t border-fcn-primary/5 px-4 py-2 bg-white/50 dark:bg-fcn-dark/50">
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

        {/* Right side: Patient Passport / Clinical Info */}
        <div className="relative w-[35%] overflow-y-auto bg-fcn-surface-light/50 dark:bg-fcn-dark/50">
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

      {/* Mobile Experience: Tabbed Switcher (Chat vs Info) */}
      <div className="flex flex-1 flex-col lg:hidden">
        {/* Mobile Tab Header */}
        <div className="flex border-b border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark">
          <button
            onClick={() => { setMobileTab("chat"); resetUnread(); }}
            className={clsx(
              "relative flex flex-1 items-center justify-center gap-2 py-3 text-xs sm:text-sm font-semibold transition-colors",
              mobileTab === "chat" ? "text-fcn-primary dark:text-fcn-accent" : "text-fcn-text-light/50 dark:text-fcn-text-dark/50"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            Consultation Chat
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
            {mobileTab === "chat" && (
              <motion.div
                layoutId="mobileConsultTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-fcn-primary"
              />
            )}
          </button>
          <button
            onClick={() => setMobileTab("info")}
            className={clsx(
              "relative flex flex-1 items-center justify-center gap-2 py-3 text-xs sm:text-sm font-semibold transition-colors",
              mobileTab === "info" ? "text-fcn-primary dark:text-fcn-accent" : "text-fcn-text-light/50 dark:text-fcn-text-dark/50"
            )}
          >
            <User className="h-4 w-4" />
            {isDoctor ? "Patient Passport" : "Doctor Profile"}
            {mobileTab === "info" && (
              <motion.div
                layoutId="mobileConsultTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-fcn-primary"
              />
            )}
          </button>
        </div>

        {mobileTab === "chat" ? (
          <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-fcn-surface-dark">
            <TopBar
              otherPartyName={otherPartyName ?? "Connecting..."}
              otherPartySpecialty={isDoctor ? undefined : otherPartySpecialty ?? undefined}
              isDoctor={isDoctor}
              isReadOnly={isReadOnly}
              startedAt={startedAt}
              durationMinutes={durationMinutes}
              onPrescribe={() => setPrescribeOpen(true)}
              onEndConsultation={handleEndConsultation}
              onAddNote={() => setShowNoteInput(!showNoteInput)}
              showNoteInput={showNoteInput}
              onRequestExtension={handleRequestExtension}
              isExtending={isExtending}
              onDirectCall={() => setIsDirectCallOpen(true)}
            />

            {isReadOnly && (
              <div className="flex items-center justify-center gap-1.5 bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                <Lock className="h-3 w-3" />
                <span>Session completed & locked</span>
              </div>
            )}

            {/* Mobile 5-Minute Warning Banner */}
            {showFiveMinWarning && (
              <div className="flex items-center justify-between gap-2 bg-amber-500/10 border-b border-amber-500/20 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200 font-semibold animate-pulse">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>Ending in {Math.ceil(remainingSecs / 60)}m.</strong>{" "}
                    {isDoctor ? "Wrap up or extend." : "Doctor may extend."}
                  </span>
                </div>
                {isDoctor && (
                  <button
                    type="button"
                    onClick={() => handleRequestExtension(10)}
                    disabled={isExtending}
                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500 text-white shrink-0"
                  >
                    +10m
                  </button>
                )}
              </div>
            )}

            {showNoteInput && isDoctor && (
              <div className="border-b border-fcn-primary/10 bg-fcn-surface-light dark:bg-fcn-dark px-3 py-2">
                <div className="flex items-end gap-2">
                  <textarea
                    value={summaryNote}
                    onChange={(e) => setSummaryNote(e.target.value)}
                    placeholder="Write a summary note..."
                    rows={2}
                    maxLength={2000}
                    className="flex-1 resize-none rounded-lg border border-fcn-primary/20 bg-white dark:bg-fcn-surface-dark px-3 py-1.5 text-xs text-fcn-text-light placeholder:text-fcn-text-light/40 outline-none focus:border-fcn-primary dark:text-fcn-text-dark"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSaveNote}
                    disabled={!summaryNote.trim()}
                    className="h-8 text-xs shrink-0"
                  >
                    Save
                  </Button>
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
              <div className="border-t border-fcn-primary/5 px-4 py-1.5 bg-white/50 dark:bg-fcn-dark/50">
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
          <div className="flex-1 overflow-y-auto bg-fcn-surface-light/50 dark:bg-fcn-dark/50 pb-20">
            <PatientHealthPassport
              context={contextData ?? null}
              isLoading={contextLoading}
            />
          </div>
        )}

        <PrescribePanel
          appointmentId={appointmentId ?? ""}
          patientName={contextData?.appointment?.patient?.full_name ?? "Patient"}
          isOpen={isDoctor && prescribeOpen}
          onClose={() => setPrescribeOpen(false)}
          onPrescriptionIssued={handlePrescriptionIssued}
        />
      </div>

      {/* Patient Extension Approval Modal */}
      <ExtensionApprovalModal
        isOpen={!!extensionRequest && !isDoctor}
        doctorName={extensionRequest?.doctorName ?? "Doctor"}
        requestedMinutes={extensionRequest?.minutes ?? 10}
        onApprove={(mins) => handleRespondExtension(true, mins)}
        onDecline={() => handleRespondExtension(false, extensionRequest?.minutes ?? 10)}
      />

      {/* Direct Cellular Call Modal (2G / Phone) */}
      <DirectCallModal
        isOpen={isDirectCallOpen}
        onClose={() => setIsDirectCallOpen(false)}
        doctorName={otherPartyName ?? "Doctor"}
        doctorSpecialty={otherPartySpecialty}
        doctorPhone={contextData?.appointment?.doctor?.phone ?? null}
      />
    </motion.div>
  );
}

function TopBar({
  otherPartyName,
  otherPartySpecialty,
  isDoctor,
  isReadOnly,
  startedAt,
  durationMinutes = 15,
  onPrescribe,
  onEndConsultation,
  onAddNote,
  showNoteInput,
  onRequestExtension,
  isExtending,
  onDirectCall
}: {
  otherPartyName: string;
  otherPartySpecialty?: string;
  isDoctor: boolean;
  isReadOnly: boolean;
  startedAt?: string | null;
  durationMinutes?: number;
  onPrescribe: () => void;
  onEndConsultation: () => void;
  onAddNote: () => void;
  showNoteInput: boolean;
  onRequestExtension?: (minutes: number) => void;
  isExtending?: boolean;
  onDirectCall?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-fcn-primary/10 bg-white/80 dark:bg-fcn-surface-dark/80 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fcn-primary to-fcn-accent text-sm font-bold text-white shadow-sm">
            {otherPartyName?.charAt(0) ?? "?"}
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-fcn-surface-dark bg-emerald-500" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-fcn-text-light dark:text-fcn-text-dark">
            {otherPartyName}
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              {otherPartySpecialty ? otherPartySpecialty : isDoctor ? "Verified Patient" : "Consulting Physician"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isDoctor && !isReadOnly && onDirectCall && (
          <button
            type="button"
            onClick={onDirectCall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 active:scale-95 text-xs font-bold transition-all shadow-xs shrink-0"
            title="Make direct cellular call to doctor (works on 2G)"
          >
            <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="hidden xs:inline">Direct Call (2G)</span>
          </button>
        )}

        <ConsultationTimer
          startedAt={startedAt}
          durationMinutes={durationMinutes}
          isReadOnly={isReadOnly}
          isDoctor={isDoctor}
          onRequestExtension={onRequestExtension}
          isExtending={isExtending}
        />

        {isDoctor && !isReadOnly && (
          <>
            <Button
              variant={showNoteInput ? "primary" : "secondary"}
              size="sm"
              onClick={onAddNote}
              className="h-8 text-xs"
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Note
            </Button>
            <Button
              variant="action"
              size="sm"
              onClick={onPrescribe}
              className="h-8 text-xs"
            >
              <Pill className="h-3.5 w-3.5 mr-1" />
              Prescribe
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onEndConsultation}
              className="h-8 text-xs"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              End
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ userName }: { userName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 3 }}
      className="flex items-center gap-2"
    >
      <span className="text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
        {userName} is typing
      </span>
      <span className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-fcn-primary"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </motion.div>
  );
}
