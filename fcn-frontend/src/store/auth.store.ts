import { create } from "zustand";
import type { AuthTokens, User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (val: boolean) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  onboardingCompleted: false,
  setOnboardingCompleted: (val) => set({ onboardingCompleted: val }),
  login: (user, tokens) => {
    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      onboardingCompleted: false
    });
  },
  logout: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      onboardingCompleted: false
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
  setLoading: (isLoading) => set({ isLoading })
}));
