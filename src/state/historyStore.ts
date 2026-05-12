import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Project } from '@/types';

export interface Command<TPayload = unknown> {
  id: string;
  label: string;
  payload: TPayload;
  apply: (project: Project) => Project;
  invert: (project: Project) => Command;
}

export const DEFAULT_HISTORY_DEPTH = 200;

export type HistoryState = {
  past: Command[];
  future: Command[];
  maxDepth: number;

  pushApplied: (cmd: Command) => void;
  popUndo: () => Command | undefined;
  popRedo: () => Command | undefined;
  clear: () => void;
  setMaxDepth: (depth: number) => void;
  resetForTests: () => void;
};

export const useHistoryStore = create<HistoryState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      past: [],
      future: [],
      maxDepth: DEFAULT_HISTORY_DEPTH,

      pushApplied: (cmd) =>
        set((s) => {
          s.past.push(cmd);
          s.future = [];
          while (s.past.length > s.maxDepth) {
            s.past.shift();
          }
        }),

      popUndo: () => {
        const top = get().past[get().past.length - 1];
        if (!top) return undefined;
        set((s) => {
          const cmd = s.past.pop();
          if (cmd) s.future.push(cmd);
        });
        return top;
      },

      popRedo: () => {
        const top = get().future[get().future.length - 1];
        if (!top) return undefined;
        set((s) => {
          const cmd = s.future.pop();
          if (cmd) s.past.push(cmd);
        });
        return top;
      },

      clear: () =>
        set((s) => {
          s.past = [];
          s.future = [];
        }),

      setMaxDepth: (depth) =>
        set((s) => {
          s.maxDepth = Math.max(1, Math.floor(depth));
          while (s.past.length > s.maxDepth) {
            s.past.shift();
          }
        }),

      resetForTests: () =>
        set((s) => {
          s.past = [];
          s.future = [];
          s.maxDepth = DEFAULT_HISTORY_DEPTH;
        }),
    })),
  ),
);

export const getHistory = (): HistoryState => useHistoryStore.getState();
