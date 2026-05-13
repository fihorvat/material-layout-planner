import type { LabelEntity, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';

type AddLabelPayload = { label: LabelEntity };
type DeleteLabelPayload = { id: string };
type UpdateLabelPayload = { id: string; patch: Partial<LabelEntity> };

const reinsertLabel = (
  payload: { label: LabelEntity; index: number },
  label: string,
): Command<{ label: LabelEntity; index: number }> => ({
  id: newCommandId(),
  type: 'reinsertLabel',
  label,
  payload,
  apply: (p: Project) => {
    const next = p.labels.slice();
    next.splice(Math.min(Math.max(payload.index, 0), next.length), 0, payload.label);
    return { ...p, labels: next };
  },
  invert: () => deleteLabelCommand({ id: payload.label.id }, `Undo ${label}`),
});

const deleteLabel = (
  payload: DeleteLabelPayload,
  label = 'Delete label',
): Command<DeleteLabelPayload> => ({
  id: newCommandId(),
  type: 'deleteLabel',
  label,
  payload,
  apply: (p: Project) => ({ ...p, labels: p.labels.filter((l) => l.id !== payload.id) }),
  invert: (prev: Project) => {
    const idx = prev.labels.findIndex((l) => l.id === payload.id);
    const lbl = prev.labels[idx];
    if (!lbl) throw new Error(`deleteLabel: ${payload.id} not found`);
    return reinsertLabel({ label: lbl, index: idx }, 'Restore label');
  },
});

const addLabel = (
  payload: AddLabelPayload,
  label = 'Add label',
): Command<AddLabelPayload> => ({
  id: newCommandId(),
  type: 'addLabel',
  label,
  payload,
  apply: (p: Project) => ({ ...p, labels: [...p.labels, payload.label] }),
  invert: () => deleteLabelCommand({ id: payload.label.id }, `Undo ${label}`),
});

const updateLabel = (
  payload: UpdateLabelPayload,
  label = 'Update label',
): Command<UpdateLabelPayload> => ({
  id: newCommandId(),
  type: 'updateLabel',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    labels: p.labels.map((l) => (l.id === payload.id ? { ...l, ...payload.patch } : l)),
  }),
  invert: (prev: Project) => {
    const original = prev.labels.find((l) => l.id === payload.id);
    if (!original) throw new Error(`updateLabel: ${payload.id} not found`);
    const inv: Record<string, unknown> = {};
    for (const k of Object.keys(payload.patch)) {
      inv[k] = (original as unknown as Record<string, unknown>)[k];
    }
    return updateLabelCommand({ id: payload.id, patch: inv as Partial<LabelEntity> }, `Undo ${label}`);
  },
});

export const addLabelCommand: CommandFactory<AddLabelPayload> = addLabel;
export const deleteLabelCommand: CommandFactory<DeleteLabelPayload> = deleteLabel;
export const updateLabelCommand: CommandFactory<UpdateLabelPayload> = updateLabel;
