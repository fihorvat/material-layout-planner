import type { Surface, Project, Point2D } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';
import { registerCommand } from '../registry';

export type CreateSurfacePayload = { surface: Surface };
export type DeleteSurfacePayload = { id: string };
export type UpdateSurfacePayload = { id: string; patch: Partial<Surface> };
export type RenameSurfacePayload = { id: string; name: string };
export type AddSurfaceHolePayload = { surfaceId: string; hole: Point2D[] };
export type RemoveSurfaceHolePayload = { surfaceId: string; holeIndex: number };
export type UpdateSurfaceHolePayload = { surfaceId: string; holeIndex: number; hole: Point2D[] };

const reinsertSurface = (
  payload: { surface: Surface; index: number },
  label: string,
): Command<{ surface: Surface; index: number }> => ({
  id: newCommandId(),
  type: 'reinsertSurface',
  label,
  payload,
  apply: (p: Project) => {
    const next = p.surfaces.slice();
    next.splice(Math.min(Math.max(payload.index, 0), next.length), 0, payload.surface);
    return { ...p, surfaces: next };
  },
  invert: () => deleteSurface({ id: payload.surface.id }, `Undo ${label}`),
});

const deleteSurface = (
  payload: DeleteSurfacePayload,
  label = 'Delete surface',
): Command<DeleteSurfacePayload> => ({
  id: newCommandId(),
  type: 'deleteSurface',
  label,
  payload,
  apply: (p: Project) => ({ ...p, surfaces: p.surfaces.filter((s) => s.id !== payload.id) }),
  invert: (prev: Project) => {
    const idx = prev.surfaces.findIndex((s) => s.id === payload.id);
    const s = prev.surfaces[idx];
    if (!s) throw new Error(`deleteSurface: ${payload.id} not found`);
    return reinsertSurface({ surface: s, index: idx }, 'Restore surface');
  },
});

const createSurfaceCmd = (
  payload: CreateSurfacePayload,
  label = `Create surface ${payload.surface.name}`,
): Command<CreateSurfacePayload> => ({
  id: newCommandId(),
  type: 'createSurface',
  label,
  payload,
  apply: (p: Project) => ({ ...p, surfaces: [...p.surfaces, payload.surface] }),
  invert: () => deleteSurface({ id: payload.surface.id }, `Undo ${label}`),
});

const updateSurfaceCmd = (
  payload: UpdateSurfacePayload,
  label = 'Update surface',
): Command<UpdateSurfacePayload> => ({
  id: newCommandId(),
  type: 'updateSurface',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) => (s.id === payload.id ? { ...s, ...payload.patch } : s)),
  }),
  invert: (prev: Project) => {
    const original = prev.surfaces.find((s) => s.id === payload.id);
    if (!original) throw new Error(`updateSurface: ${payload.id} not found`);
    const inv: Record<string, unknown> = {};
    for (const k of Object.keys(payload.patch)) {
      inv[k] = (original as unknown as Record<string, unknown>)[k];
    }
    return updateSurfaceCmd({ id: payload.id, patch: inv as Partial<Surface> }, `Undo ${label}`);
  },
});

const renameSurfaceCmd = (
  payload: RenameSurfacePayload,
  label = 'Rename surface',
): Command<RenameSurfacePayload> =>
  updateSurfaceCmd({ id: payload.id, patch: { name: payload.name } }, label) as unknown as Command<RenameSurfacePayload>;

const addSurfaceHoleCmd = (
  payload: AddSurfaceHolePayload,
  label = 'Add hole to surface',
): Command<AddSurfaceHolePayload> => ({
  id: newCommandId(),
  type: 'addSurfaceHole',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) =>
      s.id === payload.surfaceId ? { ...s, holes: [...s.holes, payload.hole] } : s,
    ),
  }),
  invert: (prev: Project) => {
    const s = prev.surfaces.find((x) => x.id === payload.surfaceId);
    if (!s) throw new Error('addSurfaceHole: surface not found');
    return removeSurfaceHoleCmd(
      { surfaceId: payload.surfaceId, holeIndex: s.holes.length },
      `Undo ${label}`,
    );
  },
});

const removeSurfaceHoleCmd = (
  payload: RemoveSurfaceHolePayload,
  label = 'Remove surface hole',
): Command<RemoveSurfaceHolePayload> => ({
  id: newCommandId(),
  type: 'removeSurfaceHole',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) =>
      s.id === payload.surfaceId
        ? { ...s, holes: s.holes.filter((_, i) => i !== payload.holeIndex) }
        : s,
    ),
  }),
  invert: (prev: Project) => {
    const s = prev.surfaces.find((x) => x.id === payload.surfaceId);
    if (!s) throw new Error('removeSurfaceHole: surface not found');
    const hole = s.holes[payload.holeIndex];
    if (!hole) throw new Error('removeSurfaceHole: hole index out of range');
    return addSurfaceHoleCmd({ surfaceId: payload.surfaceId, hole }, `Undo ${label}`);
  },
});

const updateSurfaceHoleCmd = (
  payload: UpdateSurfaceHolePayload,
  label = 'Update surface hole',
): Command<UpdateSurfaceHolePayload> => ({
  id: newCommandId(),
  type: 'updateSurfaceHole',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) =>
      s.id === payload.surfaceId
        ? {
            ...s,
            holes: s.holes.map((h, i) => (i === payload.holeIndex ? payload.hole : h)),
          }
        : s,
    ),
  }),
  invert: (prev: Project) => {
    const s = prev.surfaces.find((x) => x.id === payload.surfaceId);
    const hole = s?.holes[payload.holeIndex];
    if (!s || !hole) throw new Error('updateSurfaceHole: hole not found');
    return updateSurfaceHoleCmd(
      { surfaceId: payload.surfaceId, holeIndex: payload.holeIndex, hole },
      `Undo ${label}`,
    );
  },
});

export const createSurfaceCommand: CommandFactory<CreateSurfacePayload> = createSurfaceCmd;
export const deleteSurfaceCommand: CommandFactory<DeleteSurfacePayload> = deleteSurface;
export const updateSurfaceCommand: CommandFactory<UpdateSurfacePayload> = updateSurfaceCmd;
export const renameSurfaceCommand: CommandFactory<RenameSurfacePayload> = renameSurfaceCmd;
export const addSurfaceHoleCommand: CommandFactory<AddSurfaceHolePayload> = addSurfaceHoleCmd;
export const removeSurfaceHoleCommand: CommandFactory<RemoveSurfaceHolePayload> = removeSurfaceHoleCmd;
export const updateSurfaceHoleCommand: CommandFactory<UpdateSurfaceHolePayload> = updateSurfaceHoleCmd;

registerCommand('createSurface', createSurfaceCommand);
registerCommand('deleteSurface', deleteSurfaceCommand);
registerCommand('updateSurface', updateSurfaceCommand);
registerCommand('renameSurface', renameSurfaceCommand);
registerCommand('addSurfaceHole', addSurfaceHoleCommand);
registerCommand('removeSurfaceHole', removeSurfaceHoleCommand);
registerCommand('updateSurfaceHole', updateSurfaceHoleCommand);
registerCommand('reinsertSurface', reinsertSurface as unknown as CommandFactory<unknown>);
