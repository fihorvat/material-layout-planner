import type { DimensionEntity, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';

type AddDimensionPayload = { dimension: DimensionEntity };
type DeleteDimensionPayload = { id: string };
type UpdateDimensionPayload = { id: string; patch: Partial<DimensionEntity> };

const reinsertDimension = (
  payload: { dimension: DimensionEntity; index: number },
  label: string,
): Command<{ dimension: DimensionEntity; index: number }> => ({
  id: newCommandId(),
  type: 'reinsertDimension',
  label,
  payload,
  apply: (p: Project) => {
    const next = p.dimensions.slice();
    next.splice(Math.min(Math.max(payload.index, 0), next.length), 0, payload.dimension);
    return { ...p, dimensions: next };
  },
  invert: () => deleteDimensionCommand({ id: payload.dimension.id }, `Undo ${label}`),
});

const deleteDimension = (
  payload: DeleteDimensionPayload,
  label = 'Delete dimension',
): Command<DeleteDimensionPayload> => ({
  id: newCommandId(),
  type: 'deleteDimension',
  label,
  payload,
  apply: (p: Project) => ({ ...p, dimensions: p.dimensions.filter((d) => d.id !== payload.id) }),
  invert: (prev: Project) => {
    const idx = prev.dimensions.findIndex((d) => d.id === payload.id);
    const dim = prev.dimensions[idx];
    if (!dim) throw new Error(`deleteDimension: ${payload.id} not found`);
    return reinsertDimension({ dimension: dim, index: idx }, 'Restore dimension');
  },
});

const addDimension = (
  payload: AddDimensionPayload,
  label = 'Add dimension',
): Command<AddDimensionPayload> => ({
  id: newCommandId(),
  type: 'addDimension',
  label,
  payload,
  apply: (p: Project) => ({ ...p, dimensions: [...p.dimensions, payload.dimension] }),
  invert: () => deleteDimensionCommand({ id: payload.dimension.id }, `Undo ${label}`),
});

const updateDimension = (
  payload: UpdateDimensionPayload,
  label = 'Update dimension',
): Command<UpdateDimensionPayload> => ({
  id: newCommandId(),
  type: 'updateDimension',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    dimensions: p.dimensions.map((d) => (d.id === payload.id ? { ...d, ...payload.patch } : d)),
  }),
  invert: (prev: Project) => {
    const original = prev.dimensions.find((d) => d.id === payload.id);
    if (!original) throw new Error(`updateDimension: ${payload.id} not found`);
    const inv: Record<string, unknown> = {};
    for (const k of Object.keys(payload.patch)) {
      inv[k] = (original as unknown as Record<string, unknown>)[k];
    }
    return updateDimensionCommand({ id: payload.id, patch: inv as Partial<DimensionEntity> }, `Undo ${label}`);
  },
});

export const addDimensionCommand: CommandFactory<AddDimensionPayload> = addDimension;
export const deleteDimensionCommand: CommandFactory<DeleteDimensionPayload> = deleteDimension;
export const updateDimensionCommand: CommandFactory<UpdateDimensionPayload> = updateDimension;
