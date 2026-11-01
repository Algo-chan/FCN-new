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

export const checkHasUpdateAvailable = (): boolean => {
  if (typeof window === "undefined") return false;
  const isDownloaded = checkIsDownloadedBefore();
  if (!isDownloaded) return false;

  const installedVersion = localStorage.getItem(FCN_APP_VERSION_KEY);
  // If user has downloaded the app but has no recorded version or an older version, an update is pending
  if (!installedVersion || installedVersion !== CURRENT_APP_VERSION) {
    return true;
  }
  return false;
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
  const [hasUpdate, setHasUpdate] = useState<boolean>(checkHasUpdateAvailable);
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
      setHasUpdate(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // Listen for Service Worker update found events
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        // If a service worker is already waiting to activate
        if (reg.waiting) {
          setHasUpdate(true);
        }

        // Detect newly installed service worker waiting
        reg.addEventListener("updatefound", () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setHasUpdate(true);
              }
            });
          }
        });
      });
    }

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
        setHasUpdate(false);
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
    setHasUpdate(false);
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
    setHasUpdate(false);
  }, []);

  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting) {
            setHasUpdate(true);
            return true;
          }
        }
      } catch {
        // Ignore check errors
      }
    }
    const needsUpdate = checkHasUpdateAvailable();
    setHasUpdate(needsUpdate);
    return needsUpdate;
  }, []);

  const updateApp = useCallback(async (): Promise<boolean> => {
    setIsUpdating(true);
    try {
      // 1. Tell all service workers to activate immediately
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            try {
              if (reg.waiting) {
                reg.waiting.postMessage({ type: "SKIP_WAITING" });
              }
              await reg.update();
            } catch {
              // Ignore single SW update errors
            }
          }
        } catch {
          // Ignore registration errors
        }
      }

      // 2. Clear outdated caches so fresh resources load
      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((k) => k.includes("fcn") || k.includes("workbox"))
              .map((k) => caches.delete(k))
          );
        } catch {
          // Ignore cache deletion errors
        }
      }

      // 3. Update localStorage version & update timestamps
      if (typeof window !== "undefined") {
        localStorage.setItem(FCN_APP_VERSION_KEY, CURRENT_APP_VERSION);
        localStorage.setItem(FCN_LAST_UPDATE_KEY, new Date().toISOString());
        localStorage.setItem(FCN_APP_DOWNLOADED_KEY, "true");
        localStorage.setItem(FCN_PWA_INSTALLED_KEY, "true");
        sessionStorage.setItem("fcn_app_popup_dismissed_session", "1");
      }

      setHasUpdate(false);
      setIsUpdating(false);
      return true;
    } catch {
      setIsUpdating(false);
      return false;
    }
  }, []);

  return {
    canInstall,
    isDownloadedBefore,
    isInstalled: isDownloadedBefore,
    isIOS,
    isStandalone,
    isUpdating,
    hasUpdate,
    appVersion: CURRENT_APP_VERSION,
    promptInstall,
    markAsDownloaded,
    resetDownloadedState,
    checkForUpdates,
    updateApp
  };
};
