import { create } from "zustand";

interface AppPromptState {
  isOpen: boolean;
  manualOverrideMode: "download" | "update" | null;
  open: (mode?: "download" | "update") => void;
  close: () => void;
  toggle: () => void;
  setOverrideMode: (mode: "download" | "update" | null) => void;
}

export const useAppPromptStore = create<AppPromptState>((set) => ({
  isOpen: false,
  manualOverrideMode: null,
  open: (mode) => set({ isOpen: true, manualOverrideMode: mode ?? null }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOverrideMode: (mode) => set({ manualOverrideMode: mode })
}));
