import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";

export function OfflineDetector() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    function goOffline() {
      setOffline(true);
    }
    function goOnline() {
      setOffline(false);
      toast.success("You're back online ✅");
    }
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-amber-600/90 backdrop-blur-sm px-4 py-3 text-center text-sm font-medium text-white"
        >
          📡 You're offline. Some features may not work.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
