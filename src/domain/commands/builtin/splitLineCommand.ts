import type { LineEntity, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';
import { registerCommand } from '../registry';

export type SplitLinePayload = {
  sourceId: string;
  parts: [LineEntity, LineEntity];
};

export type UnsplitLinePayload = {
  source: LineEntity;
  sourceIndex: number;
  partIds: [string, string];
};

const unsplit = (
  payload: UnsplitLinePayload,
  label: string,
): Command<UnsplitLinePayload> => ({
  id: newCommandId(),
  type: 'unsplitLine',
  label,
  payload,
  apply: (p: Project) => {
    const filtered = p.drawingEntities.filter(
      (e) => !payload.partIds.includes(e.id),
    );
    const idx = Math.min(Math.max(payload.sourceIndex, 0), filtered.length);
    const next = filtered.slice();
    next.splice(idx, 0, payload.source);
    return { ...p, drawingEntities: next };
  },
  invert: (): Command =>
    splitLineCmd(
      { sourceId: payload.source.id, parts: [] as unknown as [LineEntity, LineEntity] },
      `Undo ${label}`,
    ),
});

const splitLineCmd = (
  payload: SplitLinePayload,
  label = 'Split line',
): Command<SplitLinePayload> => ({
  id: newCommandId(),
  type: 'splitLine',
  label,
  payload,
  apply: (p: Project) => {
    const idx = p.drawingEntities.findIndex((e) => e.id === payload.sourceId);
    if (idx < 0) return p;
    const next = p.drawingEntities.slice();
    next.splice(idx, 1, ...payload.parts);
    return { ...p, drawingEntities: next };
  },
  invert: (prev: Project) => {
    const idx = prev.drawingEntities.findIndex((e) => e.id === payload.sourceId);
    const source = prev.drawingEntities[idx];
    if (!source || source.type !== 'line') {
      throw new Error(`splitLine inverse: source ${payload.sourceId} not found`);
    }
    return unsplit(
      {
        source,
        sourceIndex: idx,
        partIds: [payload.parts[0].id, payload.parts[1].id],
      },
      `Undo ${label}`,
    );
  },
});

export const splitLineCommand: CommandFactory<SplitLinePayload> = splitLineCmd;
registerCommand('splitLine', splitLineCommand);
registerCommand('unsplitLine', unsplit as unknown as CommandFactory<unknown>);
