import type { DrawingEntity, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';

export type EntityPatch = { id: string; patch: Partial<DrawingEntity> };

type UpdateDrawingEntitiesPayload = { patches: EntityPatch[] };

const make = (
  payload: UpdateDrawingEntitiesPayload,
  label = 'Update drawing entities',
): Command<UpdateDrawingEntitiesPayload> => ({
  id: newCommandId(),
  type: 'updateDrawingEntities',
  label,
  payload,
  apply: (project: Project) => {
    if (payload.patches.length === 0) return project;
    const byId = new Map<string, Partial<DrawingEntity>>();
    for (const item of payload.patches) byId.set(item.id, item.patch);
    return {
      ...project,
      drawingEntities: project.drawingEntities.map((e) => {
        const patch = byId.get(e.id);
        if (!patch) return e;
        return { ...e, ...patch } as DrawingEntity;
      }),
    };
  },
  invert: (prev: Project) => {
    const inversePatches: EntityPatch[] = [];
    for (const item of payload.patches) {
      const original = prev.drawingEntities.find((e) => e.id === item.id);
      if (!original) continue;
      const inv: Record<string, unknown> = {};
      for (const key of Object.keys(item.patch)) {
        inv[key] = (original as unknown as Record<string, unknown>)[key];
      }
      inversePatches.push({ id: item.id, patch: inv as Partial<DrawingEntity> });
    }
    return make({ patches: inversePatches }, `Undo ${label}`);
  },
});

export const updateDrawingEntitiesCommand: CommandFactory<UpdateDrawingEntitiesPayload> = make;
