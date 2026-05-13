import type { Project, Point2D, Surface, SurfaceHoleMeta, DrawingStyle } from '@/types';
import { defaultDrawingStyle } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId, newOpeningId } from '@/domain/ids';

export type OpeningMetaInput = {
  name?: string;
  showDimensions?: boolean;
  style?: DrawingStyle;
  labelOffset?: Point2D;
};

export type AddOpeningPayload = {
  surfaceId: string;
  hole: Point2D[];
  meta?: OpeningMetaInput;
};
export type RemoveOpeningPayload = { surfaceId: string; openingId: string };
export type UpdateOpeningPayload = {
  surfaceId: string;
  openingId: string;
  patch: { hole?: Point2D[]; meta?: OpeningMetaInput };
};

const buildMeta = (input: OpeningMetaInput | undefined): SurfaceHoleMeta => ({
  id: newOpeningId(),
  ...(input?.name !== undefined ? { name: input.name } : {}),
  showDimensions: input?.showDimensions ?? false,
  style: input?.style ?? defaultDrawingStyle(),
  ...(input?.labelOffset !== undefined ? { labelOffset: input.labelOffset } : {}),
});

const findSurface = (project: Project, surfaceId: string): Surface | undefined =>
  project.surfaces.find((s) => s.id === surfaceId);

const findOpeningIndex = (surface: Surface, openingId: string): number =>
  surface.holeMeta.findIndex((m) => m.id === openingId);

const addOpeningAt = (
  payload: { surfaceId: string; hole: Point2D[]; meta: SurfaceHoleMeta; index: number },
  label: string,
): Command<typeof payload> => ({
  id: newCommandId(),
  type: 'addOpeningAt',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) => {
      if (s.id !== payload.surfaceId) return s;
      const holes = s.holes.slice();
      const meta = s.holeMeta.slice();
      const idx = Math.min(Math.max(payload.index, 0), holes.length);
      holes.splice(idx, 0, payload.hole);
      meta.splice(idx, 0, payload.meta);
      return { ...s, holes, holeMeta: meta };
    }),
  }),
  invert: () =>
    removeOpeningCmd(
      { surfaceId: payload.surfaceId, openingId: payload.meta.id },
      `Undo ${label}`,
    ),
});

const addOpeningCmd = (
  payload: AddOpeningPayload,
  label = 'Add opening',
): Command<AddOpeningPayload> => {
  const meta = buildMeta(payload.meta);
  const stamped: AddOpeningPayload = { ...payload, meta };
  return {
    id: newCommandId(),
    type: 'addOpening',
    label,
    payload: stamped,
    apply: (p: Project) => ({
      ...p,
      surfaces: p.surfaces.map((s) =>
        s.id === payload.surfaceId
          ? { ...s, holes: [...s.holes, payload.hole], holeMeta: [...s.holeMeta, meta] }
          : s,
      ),
    }),
    invert: () =>
      removeOpeningCmd(
        { surfaceId: payload.surfaceId, openingId: meta.id },
        `Undo ${label}`,
      ),
  };
};

const removeOpeningCmd = (
  payload: RemoveOpeningPayload,
  label = 'Remove opening',
): Command<RemoveOpeningPayload> => ({
  id: newCommandId(),
  type: 'removeOpening',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) => {
      if (s.id !== payload.surfaceId) return s;
      const idx = findOpeningIndex(s, payload.openingId);
      if (idx < 0) return s;
      return {
        ...s,
        holes: s.holes.filter((_, i) => i !== idx),
        holeMeta: s.holeMeta.filter((_, i) => i !== idx),
      };
    }),
  }),
  invert: (prev: Project) => {
    const s = findSurface(prev, payload.surfaceId);
    if (!s) throw new Error('removeOpening: surface not found');
    const idx = findOpeningIndex(s, payload.openingId);
    if (idx < 0) throw new Error('removeOpening: opening not found');
    const hole = s.holes[idx]!;
    const meta = s.holeMeta[idx]!;
    return addOpeningAt(
      { surfaceId: payload.surfaceId, hole, meta, index: idx },
      `Undo ${label}`,
    );
  },
});

const mergeMeta = (existing: SurfaceHoleMeta, patch: OpeningMetaInput): SurfaceHoleMeta => {
  const out: SurfaceHoleMeta = { ...existing };
  if ('name' in patch) {
    if (patch.name === undefined) delete out.name;
    else out.name = patch.name;
  }
  if (patch.showDimensions !== undefined) out.showDimensions = patch.showDimensions;
  if (patch.style !== undefined) out.style = patch.style;
  if ('labelOffset' in patch) {
    if (patch.labelOffset === undefined) delete out.labelOffset;
    else out.labelOffset = patch.labelOffset;
  }
  return out;
};

const updateOpeningCmd = (
  payload: UpdateOpeningPayload,
  label = 'Update opening',
): Command<UpdateOpeningPayload> => ({
  id: newCommandId(),
  type: 'updateOpening',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) => {
      if (s.id !== payload.surfaceId) return s;
      const idx = findOpeningIndex(s, payload.openingId);
      if (idx < 0) return s;
      const holes = s.holes.slice();
      const meta = s.holeMeta.slice();
      if (payload.patch.hole) holes[idx] = payload.patch.hole;
      if (payload.patch.meta) meta[idx] = mergeMeta(meta[idx]!, payload.patch.meta);
      return { ...s, holes, holeMeta: meta };
    }),
  }),
  invert: (prev: Project) => {
    const s = findSurface(prev, payload.surfaceId);
    if (!s) throw new Error('updateOpening: surface not found');
    const idx = findOpeningIndex(s, payload.openingId);
    if (idx < 0) throw new Error('updateOpening: opening not found');
    const prevHole = s.holes[idx]!;
    const prevMeta = s.holeMeta[idx]!;
    const inversePatch: UpdateOpeningPayload['patch'] = {};
    if (payload.patch.hole) inversePatch.hole = prevHole;
    if (payload.patch.meta) {
      inversePatch.meta = {
        name: prevMeta.name,
        showDimensions: prevMeta.showDimensions,
        style: prevMeta.style,
        labelOffset: prevMeta.labelOffset,
      };
    }
    return updateOpeningCmd(
      { surfaceId: payload.surfaceId, openingId: payload.openingId, patch: inversePatch },
      `Undo ${label}`,
    );
  },
});

export const addOpeningCommand: CommandFactory<AddOpeningPayload> = addOpeningCmd;
export const removeOpeningCommand: CommandFactory<RemoveOpeningPayload> = removeOpeningCmd;
export const updateOpeningCommand: CommandFactory<UpdateOpeningPayload> = updateOpeningCmd;

export const findOpeningSurface = (
  project: Project,
  openingId: string,
): { surface: Surface; index: number } | null => {
  for (const s of project.surfaces) {
    const i = findOpeningIndex(s, openingId);
    if (i >= 0) return { surface: s, index: i };
  }
  return null;
};
