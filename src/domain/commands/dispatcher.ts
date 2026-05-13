import { useProjectStore, useHistoryStore } from '@/state';
import type { Command as HistoryCommand } from '@/state';
import { useToastStore } from '@/state/toastStore';
import type { Command } from './types';

const applyAndStamp = (cmd: HistoryCommand): { prev: ReturnType<typeof useProjectStore.getState>['project']; next: ReturnType<typeof useProjectStore.getState>['project'] } => {
  const prev = useProjectStore.getState().project;
  const next = cmd.apply(prev);
  const stamped = { ...next, updatedAt: new Date().toISOString() };
  useProjectStore.setState((s) => ({
    ...s,
    project: stamped,
    isDirty: true,
  }));
  return { prev, next: stamped };
};

export const dispatchCommand = (cmd: Command): void => {
  const prev = useProjectStore.getState().project;
  try {
    const inverse = cmd.invert(prev);
    applyAndStamp(cmd);
    // Past holds the inverse command that undoes the most recent change.
    useHistoryStore.getState().pushApplied(inverse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    useToastStore.getState().pushToast(message, 'error');
    throw err;
  }
};

export const undo = (): boolean => {
  const hist = useHistoryStore.getState();
  const inverse = hist.past[hist.past.length - 1];
  if (!inverse) return false;
  const { prev } = applyAndStamp(inverse);
  const redoCmd = inverse.invert(prev);
  useHistoryStore.setState((s) => ({
    ...s,
    past: s.past.slice(0, -1),
    future: [...s.future, redoCmd],
  }));
  return true;
};

export const redo = (): boolean => {
  const hist = useHistoryStore.getState();
  const forward = hist.future[hist.future.length - 1];
  if (!forward) return false;
  const { prev } = applyAndStamp(forward);
  const undoCmd = forward.invert(prev);
  useHistoryStore.setState((s) => ({
    ...s,
    future: s.future.slice(0, -1),
    past: [...s.past, undoCmd],
  }));
  return true;
};

export const canUndo = (): boolean => useHistoryStore.getState().past.length > 0;
export const canRedo = (): boolean => useHistoryStore.getState().future.length > 0;
