import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  RefreshCw,
  Share,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  WifiOff,
  BellRing,
  ShieldCheck,
  ChevronRight,
  Smartphone
} from "lucide-react";
import { usePWAInstall, CURRENT_APP_VERSION } from "@/hooks/usePWAInstall";
import { useAppPromptStore } from "@/store/app-prompt.store";
import { Button } from "@/components/ui/Button";

export const INSTALL_PROMPT_KEY = "fcn_show_install_prompt";
const DISMISS_SESSION_KEY = "fcn_app_popup_dismissed_session";
const DISMISS_PERMANENT_KEY = "fcn_install_prompt_dismissed";

export const InstallPromptBanner = () => {
  const {
    canInstall,
    isDownloadedBefore,
    isIOS,
    isUpdating,
    promptInstall,
    markAsDownloaded,
    resetDownloadedState,
    updateApp
  } = usePWAInstall();

  const { isOpen, manualOverrideMode, open, close, setOverrideMode } = useAppPromptStore();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Determine effective mode: manual override takes precedence if set, otherwise real device state
  const effectiveMode: "download" | "update" =
    manualOverrideMode ?? (isDownloadedBefore ? "update" : "download");

  // On page visit: trigger pop up after a smooth 1.2-second delay if not dismissed in this session
  useEffect(() => {
    const isDismissedInSession = sessionStorage.getItem(DISMISS_SESSION_KEY) === "1";
    const forceFromRegister = localStorage.getItem(INSTALL_PROMPT_KEY) === "1";

    if (!isDismissedInSession || forceFromRegister) {
      const timer = setTimeout(() => {
        open();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
    localStorage.removeItem(INSTALL_PROMPT_KEY);
    setShowIOSGuide(false);
    close();
  };

  const handleDownloadClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) {
        localStorage.removeItem(INSTALL_PROMPT_KEY);
        handleDismiss();
      }
    } else {
      // Fallback guide if browser prompt is not immediately available
      setShowIOSGuide(true);
    }
  };

  const handleUpdateClick = async () => {
    const success = await updateApp();
    if (success) {
      setUpdateSuccess(true);
    }
  };

  const handleMarkAsInstalledManual = () => {
    markAsDownloaded();
    setShowIOSGuide(false);
    sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="fixed inset-x-2 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[80] mx-auto w-full max-w-[440px] pointer-events-auto"
        >
          <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-white/95 p-5 shadow-2xl shadow-teal-950/20 backdrop-blur-xl dark:border-teal-400/20 dark:bg-[#0B132B]/95 dark:shadow-black/70">
            {/* Top decorative gradient glow */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-500/0 blur-2xl dark:from-teal-500/20" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-gradient-to-tr from-cyan-400/15 to-teal-500/0 blur-2xl" />

            {/* Header: App icon, status badge, and close button */}
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-teal-500/20 bg-teal-50 p-1 shadow-md dark:border-teal-400/20 dark:bg-teal-950/40">
                  <img
                    src="/fcn-brand/png/icon-192.png"
                    alt="Fast Care App"
                    className="h-full w-full object-contain"
                  />
                  {effectiveMode === "update" ? (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border border-white dark:border-[#0B132B]" />
                    </span>
                  ) : null}
                </div>

                <div>
                  {/* Badge */}
                  {effectiveMode === "download" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                      <Sparkles className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                      Official App • Dire Dawa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Update Available • v{CURRENT_APP_VERSION}
                    </span>
                  )}

                  <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {effectiveMode === "download"
                      ? "Download the Fast Care App"
                      : "Update Fast Care App"}
                  </h3>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Description & Features */}
            {effectiveMode === "download" ? (
              <div className="relative mt-3">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Fast Care works best as an app on your phone or computer. Install it now for
                  instant 1-tap bookings, doctor consultations, and offline e-prescriptions.
                </p>

                {/* Micro benefit tags */}
                <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                  <div className="flex flex-col items-center rounded-lg bg-teal-50/70 p-2 dark:bg-white/5">
                    <Zap className="h-4 w-4 text-teal-600 dark:text-teal-400 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                      1-Tap Access
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg bg-teal-50/70 p-2 dark:bg-white/5">
                    <WifiOff className="h-4 w-4 text-teal-600 dark:text-teal-400 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                      Offline Mode
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg bg-teal-50/70 p-2 dark:bg-white/5">
                    <BellRing className="h-4 w-4 text-teal-600 dark:text-teal-400 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                      Live Alerts
                    </span>
                  </div>
                </div>

                {/* iOS or Manual Step-by-Step Instructions */}
                {showIOSGuide ? (
                  <div className="mt-3 rounded-xl border border-teal-500/20 bg-teal-50/90 p-3 text-xs text-slate-700 dark:bg-slate-800/90 dark:text-slate-200 space-y-2">
                    <p className="font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5" />
                      Add to Home Screen in 2 Steps:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                      <li>
                        Tap the <span className="font-semibold text-teal-700 dark:text-teal-400">Share icon</span> <Share className="inline h-3 w-3 ml-0.5" /> at the bottom of Safari/Chrome.
                      </li>
                      <li>
                        Scroll down and tap <span className="font-semibold text-teal-700 dark:text-teal-400">Add to Home Screen</span>.
                      </li>
                    </ol>
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full text-xs"
                        onClick={handleMarkAsInstalledManual}
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        I've Added It to Home Screen
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Action Buttons */}
                {!showIOSGuide && (
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 font-semibold"
                      icon={<Download className="h-4 w-4" />}
                      onClick={handleDownloadClick}
                    >
                      Download App
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                      onClick={handleDismiss}
                    >
                      Maybe Later
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* UPDATE VIEW (App is downloaded before) */
              <div className="relative mt-3">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  A fresh update is ready for your Fast Care app! Update now to enjoy the latest
                  Dire Dawa doctor rosters, faster booking speed, and enhanced offline medical records.
                </p>

                {/* What's new bullet points */}
                <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-2.5 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-200">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                    <span>Updated Dire Dawa clinic & specialist schedules</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-3.5 w-3.5 shrink-0 text-teal-500 mt-0.5" />
                    <span>Faster appointment booking & consultation chats</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-500 mt-0.5" />
                    <span>Enhanced offline prescription and receipt caching</span>
                  </div>
                </div>

                {/* Update Action Buttons */}
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="action"
                    disabled={isUpdating || updateSuccess}
                    className="flex-1 font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-emerald-950/20"
                    icon={
                      <RefreshCw
                        className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`}
                      />
                    }
                    onClick={handleUpdateClick}
                  >
                    {isUpdating
                      ? "Updating Fast Care..."
                      : updateSuccess
                      ? "Updated! Refreshing..."
                      : "Update the App"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                    onClick={handleDismiss}
                  >
                    Remind Later
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Testing & State Switcher (Discreet utility footer) */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate">Fast Care Health v{CURRENT_APP_VERSION}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOverrideMode(effectiveMode === "download" ? "update" : "download")
                  }
                  className="hover:text-teal-600 dark:hover:text-teal-400 underline decoration-dotted"
                  title="Preview other mode for testing"
                >
                  Test: Switch to {effectiveMode === "download" ? "Update" : "Download"}
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={resetDownloadedState}
                  className="hover:text-rose-500 underline decoration-dotted"
                  title="Clear downloaded flag in local storage"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
