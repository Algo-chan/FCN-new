import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, Check, X, AlertCircle, Clock, Sparkles } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useSound } from "@/hooks/useSound";
import { instantConsultService } from "@/services/instant-consult.service";
import { Button } from "@/components/ui/Button";

interface IncomingCallData {
  appointmentId: string;
  patient: {
    id: string;
    full_name: string;
    phone?: string;
  };
  chiefComplaint: string;
  allergies?: string | null;
  requestedAt: string;
}

export const DoctorIncomingInstantModal = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { playNotification } = useSound();
  const [callData, setCallData] = useState<IncomingCallData | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  // Listen on socket for instant consult incoming call
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data: IncomingCallData) => {
      setCallData(data);
      setTimeLeft(30);
      playNotification();
    };

    socket.on("instant_consult_incoming", handleIncoming);

    return () => {
      socket.off("instant_consult_incoming", handleIncoming);
    };
  }, [socket, playNotification]);

  // 30s Countdown timer
  useEffect(() => {
    if (!callData) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [callData]);

  const handleAccept = useCallback(async () => {
    if (!callData) return;
    const appointmentId = callData.appointmentId;
    try {
      if (socket) {
        socket.emit("doctor_accept_instant", { appointmentId });
      } else {
        await instantConsultService.acceptInstantConsult(appointmentId);
      }
      setCallData(null);
      navigate(`/consultation/${appointmentId}`);
    } catch {
      setCallData(null);
    }
  }, [callData, socket, navigate]);

  const handleDecline = useCallback(async () => {
    if (!callData) return;
    const appointmentId = callData.appointmentId;
    try {
      if (socket) {
        socket.emit("doctor_decline_instant", { appointmentId });
      } else {
        await instantConsultService.declineInstantConsult(appointmentId);
      }
    } catch {
      // Ignore
    }
    setCallData(null);
  }, [callData, socket]);

  if (!callData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md rounded-3xl bg-slate-900 border border-teal-500/30 p-6 text-white shadow-2xl overflow-hidden relative"
        >
          {/* Top Incoming Call Pulse Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Instant Patient Request
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Patient Details */}
          <div className="my-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 font-black text-xl border border-teal-500/30">
                <PhoneCall className="h-7 w-7 text-teal-300 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{callData.patient.full_name}</h3>
                <p className="text-xs text-slate-400">Waiting for first available doctor</p>
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="rounded-2xl bg-white/[0.04] p-3.5 border border-white/5 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Chief Complaint:
              </span>
              <p className="text-sm font-semibold text-teal-100">
                {callData.chiefComplaint || "Immediate medical advice requested"}
              </p>
            </div>

            {/* Allergies if noted */}
            {callData.allergies && (
              <div className="rounded-2xl bg-amber-500/10 p-2.5 border border-amber-500/20 flex items-center gap-2 text-xs font-medium text-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Allergies: {callData.allergies}</span>
              </div>
            )}
          </div>

          {/* 30s Countdown Progress Bar */}
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mb-5">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 30, ease: "linear" }}
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
            />
          </div>

          {/* Action Buttons: Accept / Decline */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={handleDecline}
              className="w-full min-h-[48px] font-bold text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4 mr-1.5" />
              <span>Decline</span>
            </Button>

            <Button
              variant="action"
              onClick={handleAccept}
              className="w-full min-h-[48px] font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.4)]"
            >
              <Check className="h-5 w-5 mr-1.5" />
              <span>Accept Consult</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
