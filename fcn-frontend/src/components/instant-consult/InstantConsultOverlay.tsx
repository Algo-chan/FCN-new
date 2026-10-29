import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useInstantConsultStore } from "@/store/instant-consult.store";
import { instantConsultService } from "@/services/instant-consult.service";
import { useSocket } from "@/hooks/useSocket";
import { FindingDoctorScreen } from "./FindingDoctorScreen";
import { DoctorFoundScreen } from "./DoctorFoundScreen";
import { NoDoctorScreen } from "./NoDoctorScreen";
import { BrandLogo } from "@/components/common/BrandLogo";

export const InstantConsultOverlay = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const {
    isOpen,
    step,
    appointmentId,
    doctor,
    queuePosition,
    estimatedWaitMinutes,
    nextAvailableDoctors,
    allergiesNote,
    chiefComplaint,
    closeInstantConsult,
    setDoctorFound,
    setNoDoctor,
    setQueueUpdate,
    setAllergiesNote,
    reset
  } = useInstantConsultStore();

  // Socket listener bindings
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleDoctorAccepted = (data: { appointmentId: string; doctor: any }) => {
      setDoctorFound(data.doctor, data.appointmentId);
    };

    const handleConsultationReady = (data: { appointmentId: string }) => {
      navigate(`/consultation/${data.appointmentId}`);
      closeInstantConsult();
      reset();
    };

    const handleNoDoctor = (data: { queuePosition: number; estimatedWait: number; nextAvailable?: any[] }) => {
      setNoDoctor(data.queuePosition, data.estimatedWait, data.nextAvailable);
    };

    const handleQueueUpdate = (data: { queuePosition: number; estimatedWait: number }) => {
      setQueueUpdate(data.queuePosition, data.estimatedWait);
    };

    socket.on("doctor_accepted", handleDoctorAccepted);
    socket.on("consultation_ready", handleConsultationReady);
    socket.on("no_doctors_available", handleNoDoctor);
    socket.on("queue_update", handleQueueUpdate);

    return () => {
      socket.off("doctor_accepted", handleDoctorAccepted);
      socket.off("consultation_ready", handleConsultationReady);
      socket.off("no_doctors_available", handleNoDoctor);
      socket.off("queue_update", handleQueueUpdate);
    };
  }, [socket, isOpen, navigate, closeInstantConsult, reset, setDoctorFound, setNoDoctor, setQueueUpdate]);

  // Request instant consult from backend when opened in 'finding' state
  useEffect(() => {
    if (!isOpen || step !== "finding") return;

    let isSubscribed = true;
    instantConsultService
      .requestInstantConsult({
        chief_complaint: chiefComplaint || undefined,
        allergies: allergiesNote || undefined
      })
      .then((res) => {
        if (!isSubscribed) return;
        const resData = res.data;
        if (!resData) {
          setNoDoctor(1, 5, []);
          return;
        }
        if (resData.available && resData.doctor && resData.appointmentId) {
          setDoctorFound(resData.doctor, resData.appointmentId);
        } else if (!resData.available) {
          setNoDoctor(
            resData.queuePosition ?? 1,
            resData.estimatedWait ?? 5,
            resData.nextAvailable
          );
        }
      })
      .catch(() => {
        // Fallback to queue if error
        if (isSubscribed) {
          setNoDoctor(1, 5, []);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, step, chiefComplaint, allergiesNote, setDoctorFound, setNoDoctor]);

  const handleCancel = useCallback(async () => {
    try {
      await instantConsultService.cancelInstantConsult(appointmentId ?? undefined);
    } catch {
      // Ignore
    }
    closeInstantConsult();
    reset();
  }, [appointmentId, closeInstantConsult, reset]);

  const handleNavigateToConsultation = useCallback(() => {
    if (appointmentId) {
      navigate(`/consultation/${appointmentId}`);
      closeInstantConsult();
      reset();
    }
  }, [appointmentId, navigate, closeInstantConsult, reset]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0A1628] via-[#0B3B59] to-[#0A7EA4] text-white"
    >
      {/* Subtle Background Radial Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#14b8a6_0%,transparent_60%)] opacity-20 pointer-events-none" />

      {/* Top Header: FCN Logo & Exit Button */}
      <header className="relative z-20 flex h-20 items-center justify-between px-6 sm:px-10">
        <div className="w-10" /> {/* Spacer */}

        {/* Center FCN Logo (40px, fade in) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <BrandLogo
            variant="dark"
            className="h-10 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(45,212,191,0.3)]"
          />
        </motion.div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Close instant consultation"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white transition-all backdrop-blur-md border border-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Center Interactive Screens */}
      <main className="relative z-20 flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          {step === "finding" && (
            <motion.div
              key="finding"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <FindingDoctorScreen onCancel={handleCancel} chiefComplaint={chiefComplaint} />
            </motion.div>
          )}

          {step === "found" && (
            <motion.div
              key="found"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <DoctorFoundScreen
                doctor={doctor}
                onReady={handleNavigateToConsultation}
                allergiesNote={allergiesNote}
                onAllergiesChange={setAllergiesNote}
              />
            </motion.div>
          )}

          {step === "no_doctor" && (
            <motion.div
              key="no_doctor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <NoDoctorScreen
                queuePosition={queuePosition}
                estimatedWaitMinutes={estimatedWaitMinutes}
                nextAvailableDoctors={nextAvailableDoctors}
                onLeaveQueue={handleCancel}
                onClose={closeInstantConsult}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom EKG SVG Line (Opacity 0.3) */}
      <footer className="relative z-10 w-full overflow-hidden pointer-events-none opacity-30 select-none pb-2">
        <svg
          viewBox="0 0 1200 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-12 stroke-teal-300"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0 30 H200 L210 18 L220 42 L230 10 L240 50 L250 25 L260 30 H450 L460 18 L470 42 L480 10 L490 50 L500 25 L510 30 H700 L710 18 L720 42 L730 10 L740 50 L750 25 L760 30 H950 L960 18 L970 42 L980 10 L990 50 L1000 25 L1010 30 H1200"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{
              x: [0, -250]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </svg>
      </footer>
    </div>
  );
};
