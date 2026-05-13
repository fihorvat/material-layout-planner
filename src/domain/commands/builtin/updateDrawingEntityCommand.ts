import type { DrawingEntity, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';

type UpdateDrawingEntityPayload = {
  id: string;
  patch: Partial<DrawingEntity>;
};

const make = (
  payload: UpdateDrawingEntityPayload,
  label = 'Update drawing entity',
): Command<UpdateDrawingEntityPayload> => ({
  id: newCommandId(),
  type: 'updateDrawingEntity',
  label,
  payload,
  apply: (project: Project) => ({
    ...project,
    drawingEntities: project.drawingEntities.map((e) =>
      e.id === payload.id ? ({ ...e, ...payload.patch } as DrawingEntity) : e,
    ),
  }),
  invert: (prev: Project) => {
    const original = prev.drawingEntities.find((e) => e.id === payload.id);
    if (!original) {
      throw new Error(`updateDrawingEntity inverse: entity ${payload.id} not found`);
    }
    const inversePatch: Record<string, unknown> = {};
    for (const key of Object.keys(payload.patch)) {
      inversePatch[key] = (original as unknown as Record<string, unknown>)[key];
    }
    return make(
      { id: payload.id, patch: inversePatch as Partial<DrawingEntity> },
      `Undo ${label}`,
    );
  },
});

export const updateDrawingEntityCommand: CommandFactory<UpdateDrawingEntityPayload> = make;
