import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/Button";

export const INSTALL_PROMPT_KEY = "fcn_show_install_prompt";
const DISMISS_KEY = "fcn_install_prompt_dismissed";

export const InstallPromptBanner = () => {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState<boolean>(
    () => localStorage.getItem(INSTALL_PROMPT_KEY) === "1" && localStorage.getItem(DISMISS_KEY) !== "1"
  );

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    localStorage.removeItem(INSTALL_PROMPT_KEY);
    setVisible(false);
  };

  const handleInstall = async () => {
    if (await promptInstall()) {
      localStorage.removeItem(INSTALL_PROMPT_KEY);
      setVisible(false);
    }
  };

  const showable = visible && !isInstalled && (canInstall || isIOS);

  return (
    <AnimatePresence>
      {showable && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="fixed inset-x-0 bottom-0 z-[60] mx-auto mb-3 max-w-md px-3"
        >
          <div className="rounded-2xl border border-fcn-primary/15 bg-white p-4 shadow-2xl dark:bg-fcn-dark">
            <div className="flex items-start gap-3">
              <img
                src="/icons/icon-192x192.png"
                alt="Fast Care"
                className="h-12 w-12 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  Get the Fast Care app
                </p>
                <p className="mt-0.5 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                  {isIOS
                    ? "Tap Share, then Add to Home Screen to install."
                    : "Install it now for one-tap access to your doctors."}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {isIOS ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-fcn-primary/10 px-3 py-2 text-xs font-medium text-fcn-primary">
                      <Share className="h-3.5 w-3.5" />
                      Share → Add to Home Screen
                    </span>
                  ) : (
                    <Button size="sm" icon={<Download className="h-4 w-4" />} onClick={handleInstall}>
                      Install App
                    </Button>
                  )}
                </div>
              </div>

              <button
                onClick={dismiss}
                className="shrink-0 rounded-md p-1 text-fcn-text-light/40 transition hover:bg-fcn-primary/10 hover:text-fcn-text-light dark:text-fcn-text-dark/40 dark:hover:text-fcn-text-dark"
                aria-label="Not now"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};