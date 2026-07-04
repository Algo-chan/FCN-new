import { create } from "zustand";
import type { Message } from "@/types";

interface ConsultationState {
  messages: Message[];
  isTyping: { userId: string; userName: string } | null;
  onlineUsers: string[];
  isConnected: boolean;
  isReadOnly: boolean;
  endedAt: string | null;
  unreadCount: number;
}

interface ConsultationActions {
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setTyping: (user: { userId: string; userName: string } | null) => void;
  setOnlineUsers: (userIds: string[]) => void;
  setConnected: (val: boolean) => void;
  setReadOnly: (val: boolean, endedAt?: string) => void;
  markMessagesRead: (messageIds: string[]) => void;
  incrementUnread: () => void;
  resetUnread: () => void;
  reset: () => void;
}

const initialState: ConsultationState = {
  messages: [],
  isTyping: null,
  onlineUsers: [],
  isConnected: false,
  isReadOnly: false,
  endedAt: null,
  unreadCount: 0
};

export const useConsultationStore = create<ConsultationState & ConsultationActions>((set, get) => ({
  ...initialState,

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message]
    }));
  },

  setMessages: (messages) => {
    set({ messages });
  },

  setTyping: (user) => {
    set({ isTyping: user });
  },

  setOnlineUsers: (userIds) => {
    set({ onlineUsers: userIds });
  },

  setConnected: (val) => {
    set({ isConnected: val });
  },

  setReadOnly: (val, endedAt) => {
    set({ isReadOnly: val, endedAt: endedAt ?? null });
  },

  markMessagesRead: (messageIds) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        messageIds.includes(msg.id) ? { ...msg, read_at: new Date().toISOString() } : msg
      )
    }));
  },

  incrementUnread: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },

  resetUnread: () => {
    set({ unreadCount: 0 });
  },

  reset: () => {
    set(initialState);
  }
}));
