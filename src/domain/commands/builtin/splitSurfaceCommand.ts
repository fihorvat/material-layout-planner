import type { Surface, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';
import { registerCommand } from '../registry';

export type SplitSurfacePayload = { sourceId: string; parts: Surface[] };
export type UnsplitSurfacePayload = { source: Surface; partIds: string[] };

const unsplit = (
  payload: UnsplitSurfacePayload,
  label: string,
): Command<UnsplitSurfacePayload> => ({
  id: newCommandId(),
  type: 'unsplitSurface',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: [
      ...p.surfaces.filter((s) => !payload.partIds.includes(s.id)),
      payload.source,
    ],
  }),
  invert: () => splitSurfaceCommand(
    { sourceId: payload.source.id, parts: [] },
    `Undo ${label}`,
  ) as unknown as Command<UnsplitSurfacePayload>,
});

const splitSurfaceCmd = (
  payload: SplitSurfacePayload,
  label = 'Split surface',
): Command<SplitSurfacePayload> => ({
  id: newCommandId(),
  type: 'splitSurface',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: [
      ...p.surfaces.filter((s) => s.id !== payload.sourceId),
      ...payload.parts,
    ],
  }),
  invert: (prev: Project) => {
    const source = prev.surfaces.find((s) => s.id === payload.sourceId);
    if (!source) throw new Error(`splitSurface: source ${payload.sourceId} not found`);
    return unsplit({ source, partIds: payload.parts.map((p2) => p2.id) }, `Undo ${label}`);
  },
});

export const splitSurfaceCommand: CommandFactory<SplitSurfacePayload> = splitSurfaceCmd;
registerCommand('splitSurface', splitSurfaceCommand);
registerCommand('unsplitSurface', unsplit as unknown as CommandFactory<unknown>);
