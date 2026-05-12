import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore, type Command } from '../historyStore';

const stubCommand = (id: string): Command => ({
  id,
  label: id,
  payload: undefined,
  apply: (p) => p,
  invert: () => stubCommand(`${id}-inv`),
});

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.getState().resetForTests();
  });

  it('pushApplied appends and clears future', () => {
    useHistoryStore.getState().pushApplied(stubCommand('a'));
    useHistoryStore.getState().pushApplied(stubCommand('b'));
    expect(useHistoryStore.getState().past).toHaveLength(2);
    expect(useHistoryStore.getState().future).toHaveLength(0);
  });

  it('popUndo moves last past entry to future', () => {
    useHistoryStore.getState().pushApplied(stubCommand('a'));
    const popped = useHistoryStore.getState().popUndo();
    expect(popped?.id).toBe('a');
    expect(useHistoryStore.getState().past).toHaveLength(0);
    expect(useHistoryStore.getState().future).toHaveLength(1);
  });

  it('popRedo returns last future entry back to past', () => {
    useHistoryStore.getState().pushApplied(stubCommand('a'));
    useHistoryStore.getState().popUndo();
    const popped = useHistoryStore.getState().popRedo();
    expect(popped?.id).toBe('a');
    expect(useHistoryStore.getState().past).toHaveLength(1);
    expect(useHistoryStore.getState().future).toHaveLength(0);
  });

  it('enforces maxDepth by trimming the oldest entry', () => {
    useHistoryStore.getState().setMaxDepth(3);
    ['a', 'b', 'c', 'd', 'e'].forEach((id) =>
      useHistoryStore.getState().pushApplied(stubCommand(id)),
    );
    const past = useHistoryStore.getState().past;
    expect(past).toHaveLength(3);
    expect(past[0]?.id).toBe('c');
    expect(past[2]?.id).toBe('e');
  });

  it('clear empties both stacks', () => {
    useHistoryStore.getState().pushApplied(stubCommand('a'));
    useHistoryStore.getState().popUndo();
    useHistoryStore.getState().clear();
    expect(useHistoryStore.getState().past).toEqual([]);
    expect(useHistoryStore.getState().future).toEqual([]);
  });
});
