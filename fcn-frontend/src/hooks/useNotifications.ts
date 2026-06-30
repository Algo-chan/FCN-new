import { useUiStore } from "@/store/ui.store";

export const useNotifications = () => {
  const toasts = useUiStore((state) => state.toasts);
  const addToast = useUiStore((state) => state.addToast);
  const removeToast = useUiStore((state) => state.removeToast);

  return {
    toasts,
    addToast,
    removeToast
  };
};
