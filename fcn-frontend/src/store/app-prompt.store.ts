import { create } from "zustand";

export type AppPromptMode = "download" | "update" | "up-to-date";

interface AppPromptState {
  isOpen: boolean;
  manualOverrideMode: AppPromptMode | null;
  open: (mode?: AppPromptMode) => void;
  close: () => void;
  toggle: () => void;
  setOverrideMode: (mode: AppPromptMode | null) => void;
}

export const useAppPromptStore = create<AppPromptState>((set) => ({
  isOpen: false,
  manualOverrideMode: null,
  open: (mode) => set({ isOpen: true, manualOverrideMode: mode ?? null }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOverrideMode: (mode) => set({ manualOverrideMode: mode })
}));
