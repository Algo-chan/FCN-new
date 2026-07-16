import { create } from "zustand";
import type { AuthTokens, User } from "@/types";

const LS_ACTIVITY_KEY = "fcn_last_activity";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean;
  last_activity: number;
  setOnboardingCompleted: (val: boolean) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens) => void;
  setLoading: (isLoading: boolean) => void;
  updateActivity: () => void;
}

const storedActivity = Number(localStorage.getItem(LS_ACTIVITY_KEY)) || 0;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  onboardingCompleted: false,
  last_activity: storedActivity,
  setOnboardingCompleted: (val) => set({ onboardingCompleted: val }),
  login: (user, tokens) => {
    const now = Date.now();
    localStorage.setItem(LS_ACTIVITY_KEY, String(now));
    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      last_activity: now
    });
  },
  logout: () => {
    localStorage.removeItem(LS_ACTIVITY_KEY);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      onboardingCompleted: false,
      last_activity: 0
    });
  },
  setUser: (user) => set({ user }),
  setTokens: (tokens) => {
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true
    });
  },
  setLoading: (isLoading) => set({ isLoading }),
  updateActivity: () => {
    const now = Date.now();
    localStorage.setItem(LS_ACTIVITY_KEY, String(now));
    set({ last_activity: now });
  }
}));
