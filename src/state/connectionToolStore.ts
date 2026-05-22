import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ConnectionFormValues } from '@/features/surfaces/connectionDefaults';
import { createConnectionDefaults } from '@/features/surfaces/connectionDefaults';

export type ConnectionToolPhase =
  | { kind: 'pickA' }
  | { kind: 'pickB'; surfaceAId: string; edgeAIndex: number }
  | {
      kind: 'dialog';
      surfaceAId: string;
      edgeAIndex: number;
      surfaceBId: string;
      edgeBIndex: number;
    };

export type ConnectionToolState = {
  phase: ConnectionToolPhase;
  /** Selected connection id, used by the properties panel. */
  selectedId: string | null;
  /** Defaults used to pre-populate the dialog. */
  defaults: ConnectionFormValues;

  reset: () => void;
  pickFirst: (surfaceAId: string, edgeAIndex: number) => void;
  pickSecond: (surfaceBId: string, edgeBIndex: number) => void;
  closeDialog: () => void;
  selectConnection: (id: string | null) => void;
  updateDefaults: (patch: Partial<ConnectionToolState['defaults']>) => void;

  resetForTests: () => void;
};

const buildDefaults = (): ConnectionToolState['defaults'] => createConnectionDefaults();

const buildInitial = () => ({
  phase: { kind: 'pickA' } as ConnectionToolPhase,
  selectedId: null as string | null,
  defaults: buildDefaults(),
});

export const useConnectionToolStore = create<ConnectionToolState>()(
  subscribeWithSelector((set) => ({
    ...buildInitial(),
    reset: () => set({ phase: { kind: 'pickA' } }),
    pickFirst: (surfaceAId, edgeAIndex) =>
      set({ phase: { kind: 'pickB', surfaceAId, edgeAIndex } }),
    pickSecond: (surfaceBId, edgeBIndex) =>
      set((s) => {
        if (s.phase.kind !== 'pickB') return {};
        return {
          phase: {
            kind: 'dialog',
            surfaceAId: s.phase.surfaceAId,
            edgeAIndex: s.phase.edgeAIndex,
            surfaceBId,
            edgeBIndex,
          },
        };
      }),
    closeDialog: () => set({ phase: { kind: 'pickA' } }),
    selectConnection: (selectedId) => set({ selectedId }),
    updateDefaults: (patch) => set((s) => ({ defaults: { ...s.defaults, ...patch } })),
    resetForTests: () => set(buildInitial()),
  })),
);

export const getConnectionTool = (): ConnectionToolState => useConnectionToolStore.getState();
