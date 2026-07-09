import { create } from 'zustand';
import type { ChatMessage } from '@/lib/types/intent';

interface SessionRecord {
  id: string;
  intent: string;
  timestamp: number;
  messages: ChatMessage[];
}

interface UserState {
  preferences: Record<string, unknown>;
  sessionHistory: SessionRecord[];
  currentSession: ChatMessage[];
  addToHistory: (record: SessionRecord) => void;
  updatePreference: (key: string, value: unknown) => void;
  addMessage: (message: ChatMessage) => void;
  clearSession: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  preferences: {},
  sessionHistory: [],
  currentSession: [],
  addToHistory: (record) =>
    set((state) => ({
      sessionHistory: [...state.sessionHistory.slice(-49), record],
    })),
  updatePreference: (key, value) =>
    set((state) => ({
      preferences: { ...state.preferences, [key]: value },
    })),
  addMessage: (message) =>
    set((state) => ({
      currentSession: [...state.currentSession, message],
    })),
  clearSession: () => set({ currentSession: [] }),
}));
