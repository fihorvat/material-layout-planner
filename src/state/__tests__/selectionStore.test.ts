import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from '../selectionStore';

describe('selectionStore', () => {
  beforeEach(() => {
    useSelectionStore.getState().resetForTests();
  });

  it('starts empty', () => {
    expect(useSelectionStore.getState().selected).toEqual([]);
  });

  it('select replaces selection by default', () => {
    useSelectionStore.getState().select({ kind: 'line', id: 'a' });
    useSelectionStore.getState().select({ kind: 'line', id: 'b' });
    expect(useSelectionStore.getState().selected).toEqual([{ kind: 'line', id: 'b' }]);
  });

  it('select additive appends without duplicates', () => {
    useSelectionStore.getState().select({ kind: 'line', id: 'a' });
    useSelectionStore.getState().select({ kind: 'line', id: 'b' }, true);
    useSelectionStore.getState().select({ kind: 'line', id: 'a' }, true);
    expect(useSelectionStore.getState().selected).toEqual([
      { kind: 'line', id: 'a' },
      { kind: 'line', id: 'b' },
    ]);
  });

  it('toggle adds when absent and removes when present', () => {
    useSelectionStore.getState().toggle({ kind: 'surface', id: 's1' });
    expect(useSelectionStore.getState().selected).toHaveLength(1);
    useSelectionStore.getState().toggle({ kind: 'surface', id: 's1' });
    expect(useSelectionStore.getState().selected).toHaveLength(0);
  });

  it('removeFromSelection drops by id', () => {
    useSelectionStore.getState().selectMany([
      { kind: 'surface', id: 's1' },
      { kind: 'line', id: 'l1' },
    ]);
    useSelectionStore.getState().removeFromSelection('s1');
    expect(useSelectionStore.getState().selected).toEqual([{ kind: 'line', id: 'l1' }]);
  });

  it('clear empties the selection', () => {
    useSelectionStore.getState().select({ kind: 'line', id: 'a' });
    useSelectionStore.getState().clear();
    expect(useSelectionStore.getState().selected).toEqual([]);
  });
});
