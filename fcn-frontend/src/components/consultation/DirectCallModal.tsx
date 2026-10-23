import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneCall, Copy, Check, X, ShieldCheck, Signal, ExternalLink, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";

interface DirectCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName: string;
  doctorSpecialty?: string | null;
  doctorPhone?: string | null;
}

export function DirectCallModal({
  isOpen,
  onClose,
  doctorName,
  doctorSpecialty,
  doctorPhone
}: DirectCallModalProps) {
  const [copied, setCopied] = useState(false);

  // Clean phone number for tel: protocol (e.g. +251912345678)
  const cleanPhone = doctorPhone ? doctorPhone.replace(/[\s\-\(\)]/g, "") : null;

  // Pretty formatted display (e.g. +251 91 234 5678)
  const formatDisplayPhone = (raw: string) => {
    const cleaned = raw.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+251") && cleaned.length >= 12) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    if (cleaned.startsWith("09") && cleaned.length >= 10) {
      return `+251 ${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return raw;
  };

  const handleDial = () => {
    if (!cleanPhone) {
      toast.error("Doctor's phone number is not available yet.");
      return;
    }
    // Triggers default mobile or desktop phone dialer app with the number copied into it
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleCopy = async () => {
    if (!cleanPhone) return;
    try {
      await navigator.clipboard.writeText(cleanPhone);
      setCopied(true);
      toast.success(`Copied ${cleanPhone} to clipboard`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy phone number");
    }
  };

  // Automatically trigger dialer when modal opens if cleanPhone exists on mobile devices
  useEffect(() => {
    if (isOpen && cleanPhone) {
      // Small timeout so user sees the modal backdrop before dialer takes focus
      const timer = setTimeout(() => {
        window.location.href = `tel:${cleanPhone}`;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, cleanPhone]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl overflow-hidden"
          data-lenis-prevent
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Direct Phone Call
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-400">
                    Works on 2G • No Internet Required
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Doctor Info & Number Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white truncate">
                    {doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`}
                  </h4>
                  <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {doctorSpecialty || "Consulting Physician"}
                </p>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                <Signal className="h-3 w-3" />
                <span>Ethio Telecom / Safaricom</span>
              </div>
            </div>

            {/* Prominent Number Display */}
            {cleanPhone ? (
              <div className="rounded-xl bg-slate-900 border border-slate-700/80 p-3.5 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Doctor's Direct Number:
                  </span>
                  <span className="text-lg font-black tracking-wide text-emerald-400 font-mono">
                    {formatDisplayPhone(cleanPhone)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-bold transition-all border border-slate-700"
                  title="Copy number"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-900/80 border border-amber-500/30 p-3.5 text-center">
                <p className="text-xs text-amber-300 font-semibold mb-1">
                  Doctor's phone number is being connected.
                </p>
                <p className="text-[11px] text-slate-400">
                  You can send a message in the consultation chat asking the doctor to initiate the direct call.
                </p>
              </div>
            )}
          </div>

          {/* Key Advantages / 2G Rural explanation */}
          <div className="space-y-2 mb-5">
            <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-800/40 rounded-xl p-2.5 border border-slate-800">
              <span className="text-emerald-400 font-bold shrink-0">1.</span>
              <p>
                Your phone's calling app opens automatically with the doctor's phone number copied in.
              </p>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-800/40 rounded-xl p-2.5 border border-slate-800">
              <span className="text-emerald-400 font-bold shrink-0">2.</span>
              <p>
                Calls connect over normal cellular voice — ideal for elderly patients or rural areas with 2G and spotty data.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Done
            </button>

            {cleanPhone && (
              <button
                type="button"
                onClick={handleDial}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
              >
                <Phone className="h-4 w-4" />
                <span>Open Phone Dialer Now</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
