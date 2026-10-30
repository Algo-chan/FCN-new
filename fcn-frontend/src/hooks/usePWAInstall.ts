import { useCallback, useEffect, useState } from "react";

export const CURRENT_APP_VERSION = "1.2.0";
export const FCN_APP_DOWNLOADED_KEY = "fcn_app_downloaded";
export const FCN_PWA_INSTALLED_KEY = "fcn_pwa_installed";
export const FCN_APP_VERSION_KEY = "fcn_app_version";
export const FCN_LAST_UPDATE_KEY = "fcn_last_app_update";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const isStandaloneDisplay = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    Boolean((window.navigator as unknown as { standalone?: boolean }).standalone) ||
    (typeof document !== "undefined" && document.referrer.includes("android-app://"))
  );
};

export const checkIsDownloadedBefore = (): boolean => {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplay()) return true;
  return (
    localStorage.getItem(FCN_APP_DOWNLOADED_KEY) === "true" ||
    localStorage.getItem(FCN_PWA_INSTALLED_KEY) === "true"
  );
};

const isIOSDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(isStandaloneDisplay);
  const [isDownloadedBefore, setIsDownloadedBefore] = useState<boolean>(checkIsDownloadedBefore);
  const [isIOS] = useState<boolean>(() => !isStandaloneDisplay() && isIOSDevice());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // If running in standalone mode, guarantee downloaded flag is set
    if (isStandaloneDisplay()) {
      localStorage.setItem(FCN_APP_DOWNLOADED_KEY, "true");
      localStorage.setItem(FCN_PWA_INSTALLED_KEY, "true");
      setIsDownloadedBefore(true);
      setIsStandalone(true);
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const onAppInstalled = () => {
      setCanInstall(false);
      localStorage.setItem(FCN_APP_DOWNLOADED_KEY, "true");
      localStorage.setItem(FCN_PWA_INSTALLED_KEY, "true");
      localStorage.setItem(FCN_APP_VERSION_KEY, CURRENT_APP_VERSION);
      setIsDownloadedBefore(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);

      if (choice.outcome === "accepted") {
        localStorage.setItem(FCN_APP_DOWNLOADED_KEY, "true");
        localStorage.setItem(FCN_PWA_INSTALLED_KEY, "true");
        localStorage.setItem(FCN_APP_VERSION_KEY, CURRENT_APP_VERSION);
        setIsDownloadedBefore(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  const markAsDownloaded = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(FCN_APP_DOWNLOADED_KEY, "true");
      localStorage.setItem(FCN_PWA_INSTALLED_KEY, "true");
      localStorage.setItem(FCN_APP_VERSION_KEY, CURRENT_APP_VERSION);
    }
    setIsDownloadedBefore(true);
  }, []);

  const resetDownloadedState = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(FCN_APP_DOWNLOADED_KEY);
      localStorage.removeItem(FCN_PWA_INSTALLED_KEY);
      localStorage.removeItem(FCN_APP_VERSION_KEY);
      sessionStorage.removeItem("fcn_app_popup_dismissed_session");
      localStorage.removeItem("fcn_install_prompt_dismissed");
    }
    const standalone = isStandaloneDisplay();
    setIsDownloadedBefore(standalone);
    setIsStandalone(standalone);
  }, []);

  const updateApp = useCallback(async (): Promise<boolean> => {
    setIsUpdating(true);
    try {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          try {
            await reg.update();
            if (reg.waiting) {
              reg.waiting.postMessage({ type: "SKIP_WAITING" });
            }
          } catch {
            // Ignore individual SW update errors
          }
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(FCN_APP_VERSION_KEY, CURRENT_APP_VERSION);
        localStorage.setItem(FCN_LAST_UPDATE_KEY, new Date().toISOString());
        localStorage.setItem(FCN_APP_DOWNLOADED_KEY, "true");
        localStorage.setItem(FCN_PWA_INSTALLED_KEY, "true");
      }

      setTimeout(() => {
        window.location.reload();
      }, 750);
      return true;
    } catch {
      setIsUpdating(false);
      return false;
    }
  }, []);

  return {
    canInstall,
    isDownloadedBefore,
    // isInstalled alias for backward compatibility
    isInstalled: isDownloadedBefore,
    isIOS,
    isStandalone,
    isUpdating,
    appVersion: CURRENT_APP_VERSION,
    promptInstall,
    markAsDownloaded,
    resetDownloadedState,
    updateApp
  };
};
