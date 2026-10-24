import { useEffect, useCallback, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  AlertTriangle,
  Star,
  X,
  MoreVertical
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
import { PrescribePanel, type PrescribePanelPrefill } from "@/components/consultation/PrescribePanel";
import { DoctorAICopilotTab } from "@/components/consultation/DoctorAICopilotTab";
import { ConsultationTimer } from "@/components/consultation/ConsultationTimer";
import { ExtensionApprovalModal } from "@/components/consultation/ExtensionApprovalModal";
import { DirectCallModal } from "@/components/consultation/DirectCallModal";
import { RateDoctorModal } from "@/components/consultation/RateDoctorModal";
import { ConsultationWaitingRoom } from "@/components/consultation/ConsultationWaitingRoom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { ConsultationContext, Message } from "@/types";
import { clsx } from "clsx";

type MobileTab = "chat" | "info" | "ai";
type DoctorWorkspaceTab = "passport" | "ai";

export default function ConsultationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
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
  const [doctorTab, setDoctorTab] = useState<DoctorWorkspaceTab>("passport");
  const [prefillMedication, setPrefillMedication] = useState<PrescribePanelPrefill | null>(null);
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
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const pageFocusedRef = useRef(true);

  const { socket, joinConsultation, sendMessage, sendFile, startTyping, stopTyping, markRead, endConsultation } =
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

        // Immediately mark any unread messages from the other user as read
        if (user?.id) {
          const unreadIds = msgs
            .filter((m) => m.sender_user_id !== user.id && !m.read_at && !m.is_system_message)
            .map((m) => m.id);
          if (unreadIds.length > 0) {
            markRead(appointmentId, unreadIds);
            markMessagesRead(unreadIds);
          }
        }
      } catch {
        toast.error("Failed to load messages");
      }
    },
    [appointmentId, setMessages, user?.id, markRead, markMessagesRead]
  );

  useEffect(() => {
    const isLockedForPatient = contextData?.timeLock?.isLocked && !isDoctor;
    if (appointmentId && initialLoad && !isLockedForPatient && contextData) {
      joinConsultation(appointmentId);
      loadMessages(1);
      setInitialLoad(false);
    }
  }, [appointmentId, joinConsultation, loadMessages, initialLoad, contextData, isDoctor]);

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

  // typingExpiryRef: automatically clear typing state if sender disconnects or event drops
  const typingExpiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket || !appointmentId) return;

    const handleNewMessage = (message: Message) => {
      addMessage(message);
      if (message.sender_user_id !== user?.id) {
        if (typingExpiryRef.current) {
          clearTimeout(typingExpiryRef.current);
          typingExpiryRef.current = null;
        }
        setTyping(null);

        // Active tab view: instantly mark as read so sender gets double checkmark
        if (pageFocusedRef.current && appointmentId) {
          markRead(appointmentId, [message.id]);
          markMessagesRead([message.id]);
        } else {
          incrementUnread();
        }

        if (!pageFocusedRef.current) {
          playNotification();
        }
      }
    };

    const handleUserTyping = (data: { userId: string; userName: string }) => {
      if (data.userId !== user?.id) {
        setTyping({ userId: data.userId, userName: data.userName });
        if (typingExpiryRef.current) {
          clearTimeout(typingExpiryRef.current);
        }
        typingExpiryRef.current = setTimeout(() => {
          setTyping(null);
          typingExpiryRef.current = null;
        }, 4000);
      }
    };

    const handleUserStoppedTyping = () => {
      if (typingExpiryRef.current) {
        clearTimeout(typingExpiryRef.current);
        typingExpiryRef.current = null;
      }
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
        if (user?.id && appointmentId) {
          const unreadIds = data.recentMessages
            .filter((m) => m.sender_user_id !== user.id && !m.read_at && !m.is_system_message)
            .map((m) => m.id);
          if (unreadIds.length > 0) {
            markRead(appointmentId, unreadIds);
            markMessagesRead(unreadIds);
          }
        }
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
      if (typingExpiryRef.current) {
        clearTimeout(typingExpiryRef.current);
      }
    };
  }, [
    socket,
    appointmentId,
    user?.id,
    isDoctor,
    addMessage,
    incrementUnread,
    setTyping,
    markRead,
    markMessagesRead,
    setReadOnly,
    playNotification,
    playSuccess,
    refetchContext
  ]);

  useEffect(() => {
    const markUnreadNow = () => {
      pageFocusedRef.current = true;
      resetUnread();
      if (appointmentId && user?.id) {
        const currentMessages = useConsultationStore.getState().messages;
        const unreadIds = currentMessages
          .filter((m) => m.sender_user_id !== user.id && !m.read_at && !m.is_system_message)
          .map((m) => m.id);
        if (unreadIds.length > 0) {
          markRead(appointmentId, unreadIds);
          markMessagesRead(unreadIds);
        }
      }
    };

    const handleFocus = () => markUnreadNow();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markUnreadNow();
      } else {
        pageFocusedRef.current = false;
      }
    };
    const handleBlur = () => { pageFocusedRef.current = false; };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [appointmentId, user?.id, markRead, markMessagesRead, resetUnread]);

  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [resetStore]);

  const handleSendMessage = useCallback(
    (text: string) => {
      if (appointmentId) {
        stopTyping(appointmentId);
        sendMessage(appointmentId, text);
      }
    },
    [appointmentId, sendMessage, stopTyping]
  );

  const handleSendFile = useCallback(
    async (file: File, options?: { messageText?: string; isLabResult?: boolean }) => {
      if (appointmentId) {
        stopTyping(appointmentId);
        try {
          await sendFile(appointmentId, file, options);
          playSuccess();
        } catch {
          toast.error("Failed to send file");
        }
      }
    },
    [appointmentId, sendFile, stopTyping, playSuccess]
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
    setPrefillMedication(null);
  }, [playSuccess, refetchContext]);

  const handlePreFillPrescription = useCallback((med: PrescribePanelPrefill) => {
    setPrefillMedication(med);
    setPrescribeOpen(true);
    toast.success(`Pre-filled ${med.drug_name} into prescription panel`);
  }, []);

  const handleInsertNoteFromAi = useCallback((text: string) => {
    setShowNoteInput(true);
    setSummaryNote((prev) => (prev.trim() ? `${prev}\n\n${text}` : text));
  }, []);

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
      <div className="flex h-full items-center justify-center bg-fcn-surface-light dark:bg-fcn-dark p-6 text-center">
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

  if (contextLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (contextData?.timeLock?.isLocked && !isDoctor) {
    if (contextData.timeLock.reason === "too_early") {
      return (
        <ConsultationWaitingRoom
          appointment={contextData.appointment}
          timeLock={contextData.timeLock}
          onOpen={() => refetchContext()}
        />
      );
    }

    if (contextData.timeLock.reason === "expired") {
      return (
        <div className="h-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900 p-8 shadow-xl text-center space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Clock className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Consultation Window Closed
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              The time window for this appointment has passed. If you missed this session, please contact your doctor or schedule a new appointment.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="action"
                onClick={() => navigate("/appointments/book")}
                className="w-full"
              >
                Book New Appointment
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/appointments")}
                className="w-full"
              >
                View My Appointments
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  const timerOverlay = (
    <ConsultationTimer
      startedAt={startedAt}
      durationMinutes={durationMinutes}
      isReadOnly={isReadOnly}
      isDoctor={isDoctor}
      onRequestExtension={handleRequestExtension}
      isExtending={isExtending}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-full w-full max-h-full overflow-hidden bg-slate-100/90 dark:bg-[#070b10] p-1.5 sm:p-2 lg:p-2.5 gap-2 lg:gap-3"
    >
      {/* Desktop Split View: 65% Chat Stream, 35% Health Passport */}
      <div className="hidden flex-1 lg:flex gap-3 lg:gap-4">
        {/* Floating Enclosed Chat Card (65%) */}
        <div className="flex w-[65%] flex-col rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5 dark:shadow-black/60 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5">
          <TopBar
            otherPartyName={otherPartyName ?? "Connecting..."}
            isDoctor={isDoctor}
            isReadOnly={isReadOnly}
            backUrl={isDoctor ? "/doctor/schedule" : "/appointments"}
            onPrescribe={() => setPrescribeOpen(true)}
            onEndConsultation={handleEndConsultation}
            onAddNote={() => setShowNoteInput(!showNoteInput)}
            showNoteInput={showNoteInput}
            onRequestExtension={handleRequestExtension}
            isExtending={isExtending}
            onDirectCall={() => setIsDirectCallOpen(true)}
          />

          {isReadOnly && (
            <div className="flex items-center justify-between gap-3 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Consultation session completed and locked. Conversation is safely archived for clinical reference.</span>
              </div>
              {!isDoctor && (
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all active:scale-95 shrink-0"
                >
                  <Star className="h-3.5 w-3.5 fill-white" />
                  <span>Rate Doctor</span>
                </button>
              )}
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
                  className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shrink-0 shadow-sm transition-all disabled:opacity-50"
                >
                  {isExtending ? "Requesting..." : "+10m Extension"}
                </button>
              )}
            </div>
          )}

          {/* Clinical Note Drawer */}
          <AnimatePresence>
            {showNoteInput && isDoctor && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-teal-500/20 bg-teal-500/5 dark:bg-teal-500/10 px-4 py-3"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-teal-500/15">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300">
                    <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span>Clinical Consultation Summary Note</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                      {summaryNote.length} / 2000 characters
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNoteInput(false)}
                      className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Close"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={summaryNote}
                  onChange={(e) => setSummaryNote(e.target.value)}
                  placeholder="Document clinical diagnosis, patient response, care recommendations, and required follow-ups for the medical record..."
                  rows={3}
                  maxLength={2000}
                  className="w-full resize-none rounded-xl border border-teal-500/25 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Notes are permanently attached to this appointment record.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNoteInput(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleSaveNote}
                      disabled={!summaryNote.trim()}
                      className="h-8 text-xs font-bold"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Save to Medical Record
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <MessagesList
            messages={messages}
            currentUserId={user?.id ?? ""}
            isLoadingMore={false}
            hasMoreMessages={hasMoreMessages}
            onLoadMore={handleLoadMore}
            isDoctor={isDoctor}
            otherPartySpecialty={isDoctor ? undefined : otherPartySpecialty ?? undefined}
            otherPartyName={otherPartyName ?? (isDoctor ? "Patient" : "Doctor")}
            headerOverlay={timerOverlay}
          />

          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-slate-200/40 dark:border-white/5 px-4 py-2 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs overflow-hidden"
              >
                <TypingIndicator userName={isTyping.userName} />
              </motion.div>
            )}
          </AnimatePresence>

          <ChatInput
            appointmentId={appointmentId ?? ""}
            isReadOnly={isReadOnly}
            endedAt={endedAt}
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
            onTyping={handleTyping}
            isDoctor={isDoctor}
            placeholder={
              isDoctor
                ? "Message patient, advise on care, or request clarifying info..."
                : `Ask Dr. ${otherPartyName || "a question"}, describe symptoms, or attach documents...`
            }
          />
        </div>

        {/* Right side: Patient Passport / Clinical Info & AI Co-Pilot */}
        <div className="relative flex w-[35%] flex-col rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 shadow-md shadow-slate-900/5 dark:shadow-black/40 overflow-hidden backdrop-blur-sm">
          {isDoctor && (
            <div className="flex border-b border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/60 p-1.5 shrink-0 gap-1.5 select-none">
              <button
                type="button"
                onClick={() => setDoctorTab("passport")}
                className={clsx(
                  "relative flex flex-1 items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all",
                  doctorTab === "passport"
                    ? "bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                )}
              >
                <User className="h-3.5 w-3.5" />
                <span>Patient Passport</span>
              </button>
              <button
                type="button"
                onClick={() => setDoctorTab("ai")}
                className={clsx(
                  "relative flex flex-1 items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all",
                  doctorTab === "ai"
                    ? "bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                )}
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                <span>AI Co-Pilot</span>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {(!isDoctor || doctorTab === "passport") && (
              <PatientHealthPassport
                context={contextData ?? null}
                isLoading={contextLoading}
              />
            )}

            {isDoctor && doctorTab === "ai" && (
              <DoctorAICopilotTab
                appointmentId={appointmentId ?? ""}
                patientName={contextData?.appointment?.patient?.full_name ?? "Patient"}
                onPreFillPrescription={handlePreFillPrescription}
                onInsertNote={handleInsertNoteFromAi}
              />
            )}
          </div>

          <PrescribePanel
            appointmentId={appointmentId ?? ""}
            patientName={contextData?.appointment?.patient?.full_name ?? "Patient"}
            isOpen={isDoctor && prescribeOpen}
            onClose={() => setPrescribeOpen(false)}
            onPrescriptionIssued={handlePrescriptionIssued}
            prefillMedication={prefillMedication}
          />
        </div>
      </div>

      {/* Mobile Experience: Tabbed Switcher (Chat vs Info) */}
      <div className="flex flex-1 flex-col rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden lg:hidden">
        {/* Mobile Tab Header (Icon-only on mobile/small screens to prevent overflow) */}
        <div className="flex border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <button
            type="button"
            onClick={() => { setMobileTab("chat"); resetUnread(); }}
            title="Consultation Chat"
            aria-label="Consultation Chat"
            className={clsx(
              "relative flex flex-1 items-center justify-center py-3 min-h-[44px] transition-colors active:scale-95",
              mobileTab === "chat" ? "text-fcn-primary dark:text-fcn-accent" : "text-fcn-text-light/50 dark:text-fcn-text-dark/50"
            )}
          >
            <div className="relative flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </div>
            {mobileTab === "chat" && (
              <motion.div
                layoutId="mobileConsultTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-fcn-primary"
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("info")}
            title={isDoctor ? "Patient Passport" : "Doctor Profile"}
            aria-label={isDoctor ? "Patient Passport" : "Doctor Profile"}
            className={clsx(
              "relative flex flex-1 items-center justify-center py-3 min-h-[44px] transition-colors active:scale-95",
              mobileTab === "info" ? "text-fcn-primary dark:text-fcn-accent" : "text-fcn-text-light/50 dark:text-fcn-text-dark/50"
            )}
          >
            <User className="h-5 w-5" />
            {mobileTab === "info" && (
              <motion.div
                layoutId="mobileConsultTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-fcn-primary"
              />
            )}
          </button>
          {isDoctor && (
            <button
              type="button"
              onClick={() => setMobileTab("ai")}
              title="AI Co-Pilot"
              aria-label="AI Co-Pilot"
              className={clsx(
                "relative flex flex-1 items-center justify-center py-3 min-h-[44px] transition-colors active:scale-95",
                mobileTab === "ai" ? "text-fcn-primary dark:text-fcn-accent" : "text-fcn-text-light/50 dark:text-fcn-text-dark/50"
              )}
            >
              <Sparkles className="h-5 w-5" />
              {mobileTab === "ai" && (
                <motion.div
                  layoutId="mobileConsultTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-fcn-primary"
                />
              )}
            </button>
          )}
        </div>

        {mobileTab === "chat" ? (
          <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
            <TopBar
              otherPartyName={otherPartyName ?? "Connecting..."}
              isDoctor={isDoctor}
              isReadOnly={isReadOnly}
              backUrl={isDoctor ? "/doctor/schedule" : "/appointments"}
              onPrescribe={() => setPrescribeOpen(true)}
              onEndConsultation={handleEndConsultation}
              onAddNote={() => setShowNoteInput(!showNoteInput)}
              showNoteInput={showNoteInput}
              onRequestExtension={handleRequestExtension}
              isExtending={isExtending}
              onDirectCall={() => setIsDirectCallOpen(true)}
            />

            {isReadOnly && (
              <div className="flex items-center justify-between gap-2 bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Session completed & locked</span>
                </div>
                {!isDoctor && (
                  <button
                    type="button"
                    onClick={() => setIsRateModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-amber-500 text-white shadow-xs shrink-0"
                  >
                    <Star className="h-3 w-3 fill-white" />
                    <span>Rate Doctor</span>
                  </button>
                )}
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
                    {isExtending ? "..." : "+10m"}
                  </button>
                )}
              </div>
            )}

            {/* Mobile Clinical Note Drawer */}
            <AnimatePresence>
              {showNoteInput && isDoctor && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-teal-500/20 bg-teal-500/5 dark:bg-teal-500/10 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-teal-500/15">
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                      Summary Note ({summaryNote.length}/2000)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNoteInput(false)}
                      className="rounded p-1 text-slate-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={summaryNote}
                    onChange={(e) => setSummaryNote(e.target.value)}
                    placeholder="Write a clinical summary note..."
                    rows={2}
                    maxLength={2000}
                    className="w-full resize-none rounded-xl border border-teal-500/25 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-teal-500"
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNoteInput(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleSaveNote}
                      disabled={!summaryNote.trim()}
                      className="h-7 text-xs font-bold"
                    >
                      Save Note
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <MessagesList
              messages={messages}
              currentUserId={user?.id ?? ""}
              isLoadingMore={false}
              hasMoreMessages={hasMoreMessages}
              onLoadMore={handleLoadMore}
              isDoctor={isDoctor}
              otherPartySpecialty={isDoctor ? undefined : otherPartySpecialty ?? undefined}
              otherPartyName={otherPartyName ?? (isDoctor ? "Patient" : "Doctor")}
              headerOverlay={timerOverlay}
            />

            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-200/40 dark:border-white/5 px-4 py-1.5 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs overflow-hidden"
                >
                  <TypingIndicator userName={isTyping.userName} />
                </motion.div>
              )}
            </AnimatePresence>

            <ChatInput
              appointmentId={appointmentId ?? ""}
              isReadOnly={isReadOnly}
              endedAt={endedAt}
              onSendMessage={handleSendMessage}
              onSendFile={handleSendFile}
              onTyping={handleTyping}
              isDoctor={isDoctor}
              placeholder={
                isDoctor
                  ? "Message patient or request info..."
                  : `Ask Dr. ${otherPartyName || "a question"}...`
              }
            />
          </div>
        ) : mobileTab === "ai" && isDoctor ? (
          <div className="flex-1 overflow-y-auto bg-fcn-surface-light/50 dark:bg-fcn-dark/50 pb-20">
            <DoctorAICopilotTab
              appointmentId={appointmentId ?? ""}
              patientName={contextData?.appointment?.patient?.full_name ?? "Patient"}
              onPreFillPrescription={handlePreFillPrescription}
              onInsertNote={handleInsertNoteFromAi}
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
          prefillMedication={prefillMedication}
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
      {/* Rate Doctor Modal */}
      {appointmentId && !isDoctor && (
        <RateDoctorModal
          isOpen={isRateModalOpen}
          onClose={() => setIsRateModalOpen(false)}
          appointmentId={appointmentId}
          doctorName={contextData?.appointment?.doctor?.full_name ?? otherPartyName ?? "Doctor"}
          doctorSpecialty={contextData?.appointment?.doctor?.specialty ?? otherPartySpecialty}
          doctorPhoto={contextData?.appointment?.doctor?.photo_url}
          onRated={() => {
            refetchContext();
          }}
        />
      )}

    </motion.div>
  );
}

function TopBar({
  otherPartyName,
  isDoctor,
  isReadOnly,
  backUrl,
  onPrescribe,
  onEndConsultation,
  onAddNote,
  showNoteInput,
  onRequestExtension,
  isExtending,
  onDirectCall
}: {
  otherPartyName: string;
  isDoctor: boolean;
  isReadOnly: boolean;
  backUrl?: string;
  onPrescribe: () => void;
  onEndConsultation: () => void;
  onAddNote: () => void;
  showNoteInput: boolean;
  onRequestExtension?: (minutes: number) => void;
  isExtending?: boolean;
  onDirectCall?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 z-10 shrink-0 select-none">
      {/* Left: Back button + Participant Avatar & Details */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {backUrl && (
          <Link
            to={backUrl}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Return to schedule"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}

        <div className="relative shrink-0">
          <div
            className={clsx(
              "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl text-xs sm:text-sm font-bold text-white shadow-sm select-none",
              isDoctor
                ? "bg-gradient-to-br from-teal-500 to-emerald-600"
                : "bg-gradient-to-br from-sky-500 to-indigo-600"
            )}
          >
            {otherPartyName?.charAt(0) ?? "?"}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500 ring-2 ring-emerald-500/20"
            title="Live Telehealth Connection Active"
          />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
            {otherPartyName}
          </h2>

          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Right: Timer & Context Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Desktop Direct Call Button (Patient only, md+) */}
        {!isDoctor && !isReadOnly && onDirectCall && (
          <button
            type="button"
            onClick={onDirectCall}
            className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 text-xs font-bold transition-all shadow-xs shrink-0"
            title="Immediate direct cellular call to doctor (works on 2G)"
          >
            <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>Direct Call (2G)</span>
          </button>
        )}



        {/* Desktop Doctor Clinical Actions (md+) */}
        {isDoctor && !isReadOnly && (
          <div className="hidden md:flex items-center gap-1 sm:gap-1.5 ml-1">
            <button
              type="button"
              onClick={onAddNote}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border",
                showNoteInput
                  ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                  : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title="Add or update clinical consultation summary note"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Note</span>
            </button>

            <button
              type="button"
              onClick={onPrescribe}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              title="Issue prescription for patient"
            >
              <Pill className="h-3.5 w-3.5" />
              <span>Prescribe</span>
            </button>

            <button
              type="button"
              onClick={onEndConsultation}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all active:scale-95"
              title="Conclude and lock consultation session"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>End</span>
            </button>
          </div>
        )}

        {/* Mobile Three-Dots Action Menu (WhatsApp / Telegram style for small screens) */}
        <div className="relative md:hidden">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="More consultation options"
            aria-expanded={menuOpen}
            className={clsx(
              "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition-all active:scale-95",
              menuOpen
                ? "bg-slate-200/90 dark:bg-white/20 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white"
                : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl p-1.5 z-50 ring-1 ring-black/5 dark:ring-white/10"
              >
                {/* Patient Mobile Menu Options */}
                {!isDoctor && (
                  <>
                    {!isReadOnly && onDirectCall && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDirectCall();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-98 transition-colors text-left"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>Direct Call (2G)</span>
                      </button>
                    )}
                    {backUrl && (
                      <Link
                        to={backUrl}
                        onClick={() => setMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-98 transition-colors text-left"
                      >
                        <ArrowLeft className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>Return to Appointments</span>
                      </Link>
                    )}
                  </>
                )}

                {/* Doctor Mobile Menu Options */}
                {isDoctor && (
                  <>
                    {!isReadOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onAddNote();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-98 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span>Clinical Note</span>
                          </div>
                          {showNoteInput && (
                            <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onPrescribe();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-98 transition-colors text-left"
                        >
                          <Pill className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>Issue Prescription</span>
                        </button>

                        {onRequestExtension && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              onRequestExtension(10);
                            }}
                            disabled={isExtending}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 active:scale-98 transition-colors disabled:opacity-50 text-left"
                          >
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>Request Extension (+10m)</span>
                          </button>
                        )}

                        <div className="my-1 border-t border-slate-200/80 dark:border-white/10" />

                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onEndConsultation();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-98 transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
                          <span>End Consultation</span>
                        </button>
                      </>
                    )}

                    {backUrl && (
                      <Link
                        to={backUrl}
                        onClick={() => setMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-98 transition-colors text-left"
                      >
                        <ArrowLeft className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>Return to Schedule</span>
                      </Link>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ userName }: { userName: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400">
        <Sparkles className="h-3 w-3 animate-pulse" />
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        <strong className="text-slate-700 dark:text-slate-200">{userName}</strong> is typing...
      </span>
      <span className="flex items-center gap-1 ml-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
