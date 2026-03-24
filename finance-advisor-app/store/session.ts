/**
 * Global state store — Zustand with AsyncStorage persistence.
 * Step 7.4 — Global State
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  user_id: string;
  name: string;
  age: number;
  income: number;
  credit_score: number;
  goals: string[];
  risk_tolerance?: string;
}

interface ExecutionState {
  sessionId: string;
  productId: string;
  productType: string;
  productName: string;
  stepIndex: number;
  totalSteps: number;
  filledData: Record<string, any>;
  agentLog: string[];
}

interface SessionStore {
  // User
  userId: string;
  profile: UserProfile | null;

  // Execution
  activeExecutionSessionId: string | null;
  executionState: ExecutionState | null;
  inProgressProduct: { productId: string; productName: string; productType: string } | null;

  // Actions
  setUserId: (id: string) => void;
  setProfile: (profile: UserProfile) => void;
  startExecution: (state: ExecutionState) => void;
  updateExecution: (partial: Partial<ExecutionState>) => void;
  clearExecution: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      userId: 'user-demo-001',
      profile: null,
      activeExecutionSessionId: null,
      executionState: null,
      inProgressProduct: null,

      setUserId: (id: string) => set({ userId: id }),

      setProfile: (profile: UserProfile) => set({ profile }),

      startExecution: (state: ExecutionState) =>
        set({
          activeExecutionSessionId: state.sessionId,
          executionState: state,
          inProgressProduct: {
            productId: state.productId,
            productName: state.productName,
            productType: state.productType,
          },
        }),

      updateExecution: (partial: Partial<ExecutionState>) =>
        set((prev) => ({
          executionState: prev.executionState
            ? { ...prev.executionState, ...partial }
            : null,
        })),

      clearExecution: () =>
        set({
          activeExecutionSessionId: null,
          executionState: null,
          inProgressProduct: null,
        }),

      reset: () =>
        set({
          userId: 'user-demo-001',
          profile: null,
          activeExecutionSessionId: null,
          executionState: null,
          inProgressProduct: null,
        }),
    }),
    {
      name: 'finance-advisor-session',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
