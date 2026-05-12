import type { PlacementPattern, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';
import { registerCommand } from '../registry';
import { isPlacementPatternUsed } from '@/domain/placementPatterns/placementPattern';

export type AddPlacementPatternPayload = { pattern: PlacementPattern };
export type DeletePlacementPatternPayload = { id: string };
export type UpdatePlacementPatternPayload = { id: string; patch: Partial<PlacementPattern> };
export type AssignPlacementPatternPayload = { surfaceId: string; patternId: string | null };

export class PatternInUseError extends Error {
  readonly code = 'patternInUse';
}

const reinsertPattern = (
  payload: { pattern: PlacementPattern; index: number },
  label: string,
): Command<{ pattern: PlacementPattern; index: number }> => ({
  id: newCommandId(),
  type: 'reinsertPlacementPattern',
  label,
  payload,
  apply: (p: Project) => {
    const next = p.placementPatterns.slice();
    next.splice(Math.min(Math.max(payload.index, 0), next.length), 0, payload.pattern);
    return { ...p, placementPatterns: next };
  },
  invert: () => deletePlacementPatternCommand({ id: payload.pattern.id }, `Undo ${label}`),
});

const deletePattern = (
  payload: DeletePlacementPatternPayload,
  label = 'Delete pattern',
): Command<DeletePlacementPatternPayload> => ({
  id: newCommandId(),
  type: 'deletePlacementPattern',
  label,
  payload,
  apply: (p: Project) => {
    if (isPlacementPatternUsed(p, payload.id)) {
      throw new PatternInUseError(`Pattern ${payload.id} is in use`);
    }
    return { ...p, placementPatterns: p.placementPatterns.filter((x) => x.id !== payload.id) };
  },
  invert: (prev: Project) => {
    const idx = prev.placementPatterns.findIndex((x) => x.id === payload.id);
    const p = prev.placementPatterns[idx];
    if (!p) throw new Error(`deletePattern: ${payload.id} not found`);
    return reinsertPattern({ pattern: p, index: idx }, 'Restore pattern');
  },
});

const addPattern = (
  payload: AddPlacementPatternPayload,
  label = `Add pattern ${payload.pattern.name}`,
): Command<AddPlacementPatternPayload> => ({
  id: newCommandId(),
  type: 'addPlacementPattern',
  label,
  payload,
  apply: (p: Project) => ({ ...p, placementPatterns: [...p.placementPatterns, payload.pattern] }),
  invert: () => deletePlacementPatternCommand({ id: payload.pattern.id }, `Undo ${label}`),
});

const updatePattern = (
  payload: UpdatePlacementPatternPayload,
  label = 'Update pattern',
): Command<UpdatePlacementPatternPayload> => ({
  id: newCommandId(),
  type: 'updatePlacementPattern',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    placementPatterns: p.placementPatterns.map((x) =>
      x.id === payload.id ? { ...x, ...payload.patch } : x,
    ),
  }),
  invert: (prev: Project) => {
    const original = prev.placementPatterns.find((x) => x.id === payload.id);
    if (!original) throw new Error(`updatePattern: ${payload.id} not found`);
    const inv: Record<string, unknown> = {};
    for (const k of Object.keys(payload.patch)) {
      inv[k] = (original as unknown as Record<string, unknown>)[k];
    }
    return updatePlacementPatternCommand(
      { id: payload.id, patch: inv as Partial<PlacementPattern> },
      `Undo ${label}`,
    );
  },
});

const assignPattern = (
  payload: AssignPlacementPatternPayload,
  label = 'Assign pattern',
): Command<AssignPlacementPatternPayload> => ({
  id: newCommandId(),
  type: 'assignPlacementPattern',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) =>
      s.id === payload.surfaceId ? { ...s, placementPatternId: payload.patternId } : s,
    ),
  }),
  invert: (prev: Project) => {
    const s = prev.surfaces.find((x) => x.id === payload.surfaceId);
    if (!s) throw new Error('assignPattern: surface not found');
    return assignPlacementPatternCommand(
      { surfaceId: payload.surfaceId, patternId: s.placementPatternId },
      `Undo ${label}`,
    );
  },
});

export const addPlacementPatternCommand: CommandFactory<AddPlacementPatternPayload> = addPattern;
export const deletePlacementPatternCommand: CommandFactory<DeletePlacementPatternPayload> = deletePattern;
export const updatePlacementPatternCommand: CommandFactory<UpdatePlacementPatternPayload> = updatePattern;
export const assignPlacementPatternCommand: CommandFactory<AssignPlacementPatternPayload> = assignPattern;

registerCommand('addPlacementPattern', addPlacementPatternCommand);
registerCommand('deletePlacementPattern', deletePlacementPatternCommand);
registerCommand('updatePlacementPattern', updatePlacementPatternCommand);
registerCommand('assignPlacementPattern', assignPlacementPatternCommand);
registerCommand('reinsertPlacementPattern', reinsertPattern as unknown as CommandFactory<unknown>);
