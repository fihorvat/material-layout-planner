import type { DrawingEntity, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';

type ReplaceDrawingEntityPayload = {
  sourceId: string;
  replacement: DrawingEntity;
};

type UnreplaceDrawingEntityPayload = {
  source: DrawingEntity;
  sourceIndex: number;
  replacementId: string;
};

const unreplace = (
  payload: UnreplaceDrawingEntityPayload,
  label: string,
): Command<UnreplaceDrawingEntityPayload> => ({
  id: newCommandId(),
  type: 'unreplaceDrawingEntity',
  label,
  payload,
  apply: (p: Project) => {
    const filtered = p.drawingEntities.filter((e) => e.id !== payload.replacementId);
    const idx = Math.min(Math.max(payload.sourceIndex, 0), filtered.length);
    const next = filtered.slice();
    next.splice(idx, 0, payload.source);
    return { ...p, drawingEntities: next };
  },
  invert: (): Command =>
    replaceCmd(
      { sourceId: payload.source.id, replacement: undefined as unknown as DrawingEntity },
      `Undo ${label}`,
    ),
});

const replaceCmd = (
  payload: ReplaceDrawingEntityPayload,
  label = 'Replace drawing entity',
): Command<ReplaceDrawingEntityPayload> => ({
  id: newCommandId(),
  type: 'replaceDrawingEntity',
  label,
  payload,
  apply: (p: Project) => {
    const idx = p.drawingEntities.findIndex((e) => e.id === payload.sourceId);
    if (idx < 0) return p;
    const next = p.drawingEntities.slice();
    next.splice(idx, 1, payload.replacement);
    return { ...p, drawingEntities: next };
  },
  invert: (prev: Project) => {
    const idx = prev.drawingEntities.findIndex((e) => e.id === payload.sourceId);
    const source = prev.drawingEntities[idx];
    if (!source) {
      throw new Error(
        `replaceDrawingEntity inverse: source ${payload.sourceId} not found`,
      );
    }
    return unreplace(
      { source, sourceIndex: idx, replacementId: payload.replacement.id },
      `Undo ${label}`,
    );
  },
});

export const replaceDrawingEntityCommand: CommandFactory<ReplaceDrawingEntityPayload> =
  replaceCmd;
