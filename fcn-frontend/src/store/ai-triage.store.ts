import { create } from "zustand";
import type { SupportedLanguage, ConversationMessage, ParsedAssessment } from "@/types";

interface AITriageState {
  assessmentId: string | null;
  language: SupportedLanguage | null;
  conversation: ConversationMessage[];
  currentRound: number;
  isLoading: boolean;
  isComplete: boolean;
  finalAssessment: ParsedAssessment | null;
  error: string | null;
  bookingInitiated: boolean;
}

interface AITriageActions {
  setLanguage: (lang: SupportedLanguage) => void;
  startConversation: (assessmentId: string, firstMessage: ConversationMessage, aiResponse: ConversationMessage) => void;
  addMessages: (userMsg: ConversationMessage, aiMsg: ConversationMessage) => void;
  setLoading: (val: boolean) => void;
  setComplete: (assessment: ParsedAssessment) => void;
  setError: (error: string | null) => void;
  setBookingInitiated: () => void;
  setAssessmentId: (id: string) => void;
  restoreAssessment: (data: {
    assessmentId: string;
    language: SupportedLanguage;
    conversation: ConversationMessage[];
    currentRound: number;
    isComplete: boolean;
    finalAssessment: ParsedAssessment | null;
    bookingInitiated?: boolean;
  }) => void;
  reset: () => void;
}

const initialState: AITriageState = {
  assessmentId: null,
  language: null,
  conversation: [],
  currentRound: 0,
  isLoading: false,
  isComplete: false,
  finalAssessment: null,
  error: null,
  bookingInitiated: false
};

export const useAITriageStore = create<AITriageState & AITriageActions>((set) => ({
  ...initialState,

  setLanguage: (lang) => set({ language: lang }),

  startConversation: (assessmentId, firstMessage, aiResponse) =>
    set({
      assessmentId,
      conversation: [firstMessage, aiResponse],
      currentRound: 1,
      isLoading: false,
      isComplete: false,
      finalAssessment: null,
      error: null,
      bookingInitiated: false
    }),

  addMessages: (userMsg, aiMsg) =>
    set((state) => ({
      conversation: [...state.conversation, userMsg, aiMsg],
      currentRound: aiMsg.round ?? state.currentRound,
      isLoading: false
    })),

  setLoading: (val) => set({ isLoading: val }),

  setComplete: (assessment) =>
    set({
      isComplete: true,
      finalAssessment: assessment,
      isLoading: false
    }),

  setError: (error) => set({ error, isLoading: false }),

  setBookingInitiated: () => set({ bookingInitiated: true }),

  setAssessmentId: (id) => set({ assessmentId: id }),

  restoreAssessment: (data) =>
    set({
      assessmentId: data.assessmentId,
      language: data.language,
      conversation: data.conversation,
      currentRound: data.currentRound,
      isComplete: data.isComplete,
      finalAssessment: data.finalAssessment,
      isLoading: false,
      error: null,
      bookingInitiated: data.bookingInitiated ?? false
    }),

  reset: () => set(initialState)
}));
