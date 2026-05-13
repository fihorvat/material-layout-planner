import type { DrawingEntity, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';

type DeleteDrawingEntityPayload = { id: string };

type ReinsertPayload = { entity: DrawingEntity; index: number };

const makeReinsert = (
  payload: ReinsertPayload,
  label: string,
): Command<ReinsertPayload> => ({
  id: newCommandId(),
  type: 'reinsertDrawingEntity',
  label,
  payload,
  apply: (project: Project) => {
    const next = project.drawingEntities.slice();
    const idx = Math.min(Math.max(payload.index, 0), next.length);
    next.splice(idx, 0, payload.entity);
    return { ...project, drawingEntities: next };
  },
  invert: (): Command => deleteCmd({ id: payload.entity.id }, `Undo ${label}`),
});

const deleteCmd = (
  payload: DeleteDrawingEntityPayload,
  label = 'Delete drawing entity',
): Command<DeleteDrawingEntityPayload> => ({
  id: newCommandId(),
  type: 'deleteDrawingEntity',
  label,
  payload,
  apply: (project: Project) => ({
    ...project,
    drawingEntities: project.drawingEntities.filter((e) => e.id !== payload.id),
  }),
  invert: (prev: Project) => {
    const idx = prev.drawingEntities.findIndex((e) => e.id === payload.id);
    const entity = prev.drawingEntities[idx];
    if (!entity || idx < 0) {
      throw new Error(`deleteDrawingEntity inverse: entity ${payload.id} not found`);
    }
    return makeReinsert({ entity, index: idx }, `Restore ${entity.type}`);
  },
});

export const deleteDrawingEntityCommand: CommandFactory<DeleteDrawingEntityPayload> = deleteCmd;
