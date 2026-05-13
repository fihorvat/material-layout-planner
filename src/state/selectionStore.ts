import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

export type SelectableKind =
  | 'point'
  | 'line'
  | 'rectangle'
  | 'polygon'
  | 'surface'
  | 'opening'
  | 'dimension'
  | 'label'
  | 'materialPiece'
  | 'patternHandle'
  | 'overlap'
  | 'backgroundImage'
  | 'connection';

export type SelectionEntry = { kind: SelectableKind; id: string };

const sameEntry = (a: SelectionEntry, b: SelectionEntry): boolean =>
  a.id === b.id && a.kind === b.kind;

export type SelectionState = {
  selected: SelectionEntry[];

  select: (entry: SelectionEntry, additive?: boolean) => void;
  selectMany: (entries: SelectionEntry[]) => void;
  clear: () => void;
  toggle: (entry: SelectionEntry) => void;
  removeFromSelection: (id: string) => void;
  resetForTests: () => void;
};

export const useSelectionStore = create<SelectionState>()(
  subscribeWithSelector(
    immer((set) => ({
      selected: [],

      select: (entry, additive) =>
        set((s) => {
          if (additive) {
            if (!s.selected.some((e) => sameEntry(e, entry))) {
              s.selected.push(entry);
            }
          } else {
            s.selected = [entry];
          }
        }),

      selectMany: (entries) =>
        set((s) => {
          s.selected = entries.slice();
        }),

      clear: () =>
        set((s) => {
          s.selected = [];
        }),

      toggle: (entry) =>
        set((s) => {
          const idx = s.selected.findIndex((e) => sameEntry(e, entry));
          if (idx === -1) {
            s.selected.push(entry);
          } else {
            s.selected.splice(idx, 1);
          }
        }),

      removeFromSelection: (id) =>
        set((s) => {
          s.selected = s.selected.filter((e) => e.id !== id);
        }),

      resetForTests: () =>
        set((s) => {
          s.selected = [];
        }),
    })),
  ),
);

export const getSelection = (): SelectionState => useSelectionStore.getState();
