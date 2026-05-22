import { create } from 'zustand';
import { useEditorStore, useProjectStore, useSelectionStore, type SelectionEntry } from '@/state';
import type {
  DimensionEntity,
  DrawingEntity,
  LabelEntity,
  Point2D,
  Project,
  Surface,
  SurfaceConnection,
  SurfaceHoleMeta,
} from '@/types';
import {
  newDimensionId,
  newDrawingEntityId,
  newEdgeRuleId,
  newLabelId,
  newOpeningId,
  newSurfaceConnectionId,
  newSurfaceId,
} from '@/domain/ids';
import { dispatchCommand, findOpeningSurface, replaceProjectCommand } from '@/domain/commands';
import { decodeEdgeId, encodeEdgeId } from '@/domain/surfaces/connectSurfaces';

type OpeningSnapshot = {
  surfaceId: string;
  hole: Point2D[];
  meta: SurfaceHoleMeta;
};

export type ClipboardSnapshot = {
  selection: SelectionEntry[];
  drawingEntities: DrawingEntity[];
  surfaces: Surface[];
  openings: OpeningSnapshot[];
  dimensions: DimensionEntity[];
  labels: LabelEntity[];
  surfaceConnections: SurfaceConnection[];
};

type SelectionClipboardState = {
  snapshot: ClipboardSnapshot | null;
  setSnapshot: (snapshot: ClipboardSnapshot | null) => void;
  clear: () => void;
  resetForTests: () => void;
};

const COPYABLE_KINDS = new Set<SelectionEntry['kind']>([
  'line',
  'rectangle',
  'polygon',
  'surface',
  'opening',
  'dimension',
  'label',
]);

const MOVABLE_KINDS = new Set<SelectionEntry['kind']>([
  'line',
  'rectangle',
  'polygon',
  'surface',
  'opening',
  'label',
]);

const translatePoint = (point: Point2D, dx: number, dy: number): Point2D => ({
  x: point.x + dx,
  y: point.y + dy,
});

const translatePoints = (points: Point2D[], dx: number, dy: number): Point2D[] =>
  points.map((point) => translatePoint(point, dx, dy));

const translateDrawingEntity = (entity: DrawingEntity, dx: number, dy: number): DrawingEntity => {
  if (entity.type === 'line') {
    return {
      ...entity,
      start: translatePoint(entity.start, dx, dy),
      end: translatePoint(entity.end, dx, dy),
    };
  }
  if (entity.type === 'rectangle') {
    return {
      ...entity,
      origin: translatePoint(entity.origin, dx, dy),
    };
  }
  return {
    ...entity,
    points: translatePoints(entity.points, dx, dy),
  };
};

const remapLabelAnchorId = (
  label: LabelEntity,
  maps: {
    drawingIds: Map<string, string>;
    surfaceIds: Map<string, string>;
    openingIds: Map<string, string>;
  },
): string | undefined => {
  const anchorId = label.anchorId;
  if (!anchorId) return undefined;

  if (label.anchorType === 'surface') {
    return maps.surfaceIds.get(anchorId) ?? anchorId;
  }

  if (label.anchorType === 'opening') {
    if (maps.openingIds.has(anchorId)) return maps.openingIds.get(anchorId);
    if (maps.surfaceIds.has(anchorId)) return maps.surfaceIds.get(anchorId);
    if (anchorId.endsWith(':hole')) {
      const surfaceId = anchorId.slice(0, -':hole'.length);
      const mapped = maps.surfaceIds.get(surfaceId);
      return mapped ? `${mapped}:hole` : anchorId;
    }
    return anchorId;
  }

  if (label.anchorType === 'edge') {
    const [surfaceId, edgeIndex] = anchorId.split(':');
    const mapped = maps.surfaceIds.get(surfaceId ?? '');
    return mapped && edgeIndex !== undefined ? `${mapped}:${edgeIndex}` : anchorId;
  }

  return maps.drawingIds.get(anchorId) ?? anchorId;
};

const remapReferenceId = (
  referenceId: string,
  maps: {
    drawingIds: Map<string, string>;
    surfaceIds: Map<string, string>;
    openingIds: Map<string, string>;
  },
): string => {
  if (maps.drawingIds.has(referenceId)) return maps.drawingIds.get(referenceId)!;
  if (maps.surfaceIds.has(referenceId)) return maps.surfaceIds.get(referenceId)!;
  if (maps.openingIds.has(referenceId)) return maps.openingIds.get(referenceId)!;

  if (referenceId.includes('#')) {
    const { surfaceId, edgeIndex } = decodeEdgeId(referenceId);
    const mappedSurfaceId = maps.surfaceIds.get(surfaceId);
    if (mappedSurfaceId) return encodeEdgeId(mappedSurfaceId, edgeIndex);
  }

  return referenceId;
};

const isLabelAnchorMoved = (
  label: LabelEntity,
  selectedDrawingIds: Set<string>,
  selectedSurfaceIds: Set<string>,
  selectedOpeningIds: Set<string>,
): boolean => {
  const anchorId = label.anchorId;
  if (!anchorId) return false;

  if (label.anchorType === 'surface') {
    return selectedSurfaceIds.has(anchorId);
  }

  if (label.anchorType === 'opening') {
    if (selectedOpeningIds.has(anchorId) || selectedSurfaceIds.has(anchorId)) return true;
    if (anchorId.endsWith(':hole')) {
      const surfaceId = anchorId.slice(0, -':hole'.length);
      return selectedSurfaceIds.has(surfaceId);
    }
    return false;
  }

  if (label.anchorType === 'edge') {
    const [surfaceId] = anchorId.split(':');
    return selectedSurfaceIds.has(surfaceId ?? '');
  }

  return selectedDrawingIds.has(anchorId);
};

export const useSelectionClipboardStore = create<SelectionClipboardState>()((set) => ({
  snapshot: null,
  setSnapshot: (snapshot) => set({ snapshot }),
  clear: () => set({ snapshot: null }),
  resetForTests: () => set({ snapshot: null }),
}));

export const hasCopyableSelection = (selection: SelectionEntry[]): boolean =>
  selection.some((entry) => COPYABLE_KINDS.has(entry.kind));

export const hasMovableSelection = (selection: SelectionEntry[]): boolean =>
  selection.some((entry) => MOVABLE_KINDS.has(entry.kind));

export const buildClipboardSnapshot = (
  project: Project,
  selection: SelectionEntry[],
): ClipboardSnapshot | null => {
  const copiedSelection = selection.filter((entry) => COPYABLE_KINDS.has(entry.kind));
  if (copiedSelection.length === 0) return null;

  const drawingIds = new Set(
    copiedSelection
      .filter(
        (entry) => entry.kind === 'line' || entry.kind === 'rectangle' || entry.kind === 'polygon',
      )
      .map((entry) => entry.id),
  );
  const surfaceIds = new Set(
    copiedSelection.filter((entry) => entry.kind === 'surface').map((entry) => entry.id),
  );
  const openingIds = new Set(
    copiedSelection.filter((entry) => entry.kind === 'opening').map((entry) => entry.id),
  );
  const dimensionIds = new Set(
    copiedSelection.filter((entry) => entry.kind === 'dimension').map((entry) => entry.id),
  );
  const labelIds = new Set(
    copiedSelection.filter((entry) => entry.kind === 'label').map((entry) => entry.id),
  );

  const drawingEntities = project.drawingEntities.filter((entity) => drawingIds.has(entity.id));
  const surfaces = project.surfaces.filter((surface) => surfaceIds.has(surface.id));
  const dimensions = project.dimensions.filter((dimension) => dimensionIds.has(dimension.id));
  const labels = project.labels.filter((label) => labelIds.has(label.id));

  const openings: OpeningSnapshot[] = [];
  for (const openingId of openingIds) {
    const found = findOpeningSurface(project, openingId);
    if (!found || surfaceIds.has(found.surface.id)) continue;
    const hole = found.surface.holes[found.index];
    const meta = found.surface.holeMeta[found.index];
    if (!hole || !meta) continue;
    openings.push({
      surfaceId: found.surface.id,
      hole,
      meta,
    });
  }

  const surfaceConnections = project.surfaceConnections.filter(
    (connection) => surfaceIds.has(connection.surfaceAId) && surfaceIds.has(connection.surfaceBId),
  );

  return {
    selection: copiedSelection,
    drawingEntities,
    surfaces,
    openings,
    dimensions,
    labels,
    surfaceConnections,
  };
};

export const pasteClipboardIntoProject = (
  project: Project,
  snapshot: ClipboardSnapshot,
  offsetMm = 10,
): { nextProject: Project; selection: SelectionEntry[] } => {
  const drawingIdMap = new Map<string, string>();
  const surfaceIdMap = new Map<string, string>();
  const openingIdMap = new Map<string, string>();
  const dimensionIdMap = new Map<string, string>();
  const labelIdMap = new Map<string, string>();

  const nextProject: Project = {
    ...project,
    drawingEntities: project.drawingEntities.slice(),
    surfaces: project.surfaces.slice(),
    surfaceConnections: project.surfaceConnections.slice(),
    dimensions: project.dimensions.slice(),
    labels: project.labels.slice(),
  };

  for (const entity of snapshot.drawingEntities) {
    const nextId = newDrawingEntityId();
    drawingIdMap.set(entity.id, nextId);
    nextProject.drawingEntities.push({
      ...translateDrawingEntity(entity, offsetMm, offsetMm),
      id: nextId,
    });
  }

  for (const surface of snapshot.surfaces) {
    const nextSurfaceId = newSurfaceId();
    surfaceIdMap.set(surface.id, nextSurfaceId);

    const nextHoleMeta = surface.holeMeta.map((meta) => {
      const nextOpeningId = newOpeningId();
      openingIdMap.set(meta.id, nextOpeningId);
      return { ...meta, id: nextOpeningId };
    });

    nextProject.surfaces.push({
      ...surface,
      id: nextSurfaceId,
      outerBoundary: translatePoints(surface.outerBoundary, offsetMm, offsetMm),
      holes: surface.holes.map((hole) => translatePoints(hole, offsetMm, offsetMm)),
      holeMeta: nextHoleMeta,
      edgeRules: surface.edgeRules.map((rule) => ({
        ...rule,
        id: newEdgeRuleId(),
        surfaceId: nextSurfaceId,
        connectedSurfaceId: rule.connectedSurfaceId
          ? (surfaceIdMap.get(rule.connectedSurfaceId) ?? rule.connectedSurfaceId)
          : undefined,
      })),
      connections: [],
    });
  }

  for (const opening of snapshot.openings) {
    const nextOpeningId = newOpeningId();
    openingIdMap.set(opening.meta.id, nextOpeningId);
    nextProject.surfaces = nextProject.surfaces.map((surface) =>
      surface.id !== opening.surfaceId
        ? surface
        : {
            ...surface,
            holes: [...surface.holes, translatePoints(opening.hole, offsetMm, offsetMm)],
            holeMeta: [...surface.holeMeta, { ...opening.meta, id: nextOpeningId }],
          },
    );
  }

  for (const connection of snapshot.surfaceConnections) {
    const nextConnectionId = newSurfaceConnectionId();
    const nextSurfaceAId = surfaceIdMap.get(connection.surfaceAId);
    const nextSurfaceBId = surfaceIdMap.get(connection.surfaceBId);
    if (!nextSurfaceAId || !nextSurfaceBId) continue;

    const edgeA = decodeEdgeId(connection.edgeAId);
    const edgeB = decodeEdgeId(connection.edgeBId);
    nextProject.surfaceConnections.push({
      ...connection,
      id: nextConnectionId,
      surfaceAId: nextSurfaceAId,
      edgeAId: encodeEdgeId(nextSurfaceAId, edgeA.edgeIndex),
      surfaceBId: nextSurfaceBId,
      edgeBId: encodeEdgeId(nextSurfaceBId, edgeB.edgeIndex),
    });
    nextProject.surfaces = nextProject.surfaces.map((surface) => {
      if (surface.id !== nextSurfaceAId && surface.id !== nextSurfaceBId) return surface;
      return {
        ...surface,
        connections: [...surface.connections, { connectionId: nextConnectionId }],
      };
    });
  }

  for (const dimension of snapshot.dimensions) {
    const nextDimensionId = newDimensionId();
    dimensionIdMap.set(dimension.id, nextDimensionId);
    nextProject.dimensions.push({
      ...dimension,
      id: nextDimensionId,
      references: dimension.references.map((reference) => ({
        ...reference,
        id: remapReferenceId(reference.id, {
          drawingIds: drawingIdMap,
          surfaceIds: surfaceIdMap,
          openingIds: openingIdMap,
        }),
      })),
    });
  }

  for (const label of snapshot.labels) {
    const nextLabelId = newLabelId();
    labelIdMap.set(label.id, nextLabelId);
    const nextAnchorId = remapLabelAnchorId(label, {
      drawingIds: drawingIdMap,
      surfaceIds: surfaceIdMap,
      openingIds: openingIdMap,
    });
    const anchorMoved = Boolean(label.anchorId && nextAnchorId !== label.anchorId);
    nextProject.labels.push({
      ...label,
      id: nextLabelId,
      anchorId: nextAnchorId,
      position:
        label.anchorType === 'free' || !anchorMoved
          ? translatePoint(label.position, offsetMm, offsetMm)
          : label.position,
    });
  }

  const selection = snapshot.selection
    .map<SelectionEntry | null>((entry) => {
      if (entry.kind === 'line' || entry.kind === 'rectangle' || entry.kind === 'polygon') {
        const nextId = drawingIdMap.get(entry.id);
        return nextId ? { kind: entry.kind, id: nextId } : null;
      }
      if (entry.kind === 'surface') {
        const nextId = surfaceIdMap.get(entry.id);
        return nextId ? { kind: 'surface', id: nextId } : null;
      }
      if (entry.kind === 'opening') {
        const nextId = openingIdMap.get(entry.id);
        return nextId ? { kind: 'opening', id: nextId } : null;
      }
      if (entry.kind === 'dimension') {
        const nextId = dimensionIdMap.get(entry.id);
        return nextId ? { kind: 'dimension', id: nextId } : null;
      }
      if (entry.kind === 'label') {
        const nextId = labelIdMap.get(entry.id);
        return nextId ? { kind: 'label', id: nextId } : null;
      }
      return null;
    })
    .filter((entry): entry is SelectionEntry => entry !== null);

  return { nextProject, selection };
};

export const copySelection = (): boolean => {
  const project = useProjectStore.getState().project;
  const selection = useSelectionStore.getState().selected;
  const snapshot = buildClipboardSnapshot(project, selection);
  if (!snapshot) return false;
  useSelectionClipboardStore.getState().setSnapshot(snapshot);
  return true;
};

export const pasteSelection = (offsetMm = 10): boolean => {
  const snapshot = useSelectionClipboardStore.getState().snapshot;
  if (!snapshot) return false;

  const project = useProjectStore.getState().project;
  const { nextProject, selection } = pasteClipboardIntoProject(project, snapshot, offsetMm);
  dispatchCommand(replaceProjectCommand({ next: nextProject }, 'Paste selection'));
  useSelectionStore.getState().selectMany(selection);
  useEditorStore.getState().setActiveTool('select');
  return true;
};

export const translateSelectionInProject = (
  project: Project,
  selection: SelectionEntry[],
  dx: number,
  dy: number,
): Project => {
  if (dx === 0 && dy === 0) return project;

  const selectedDrawingIds = new Set(
    selection
      .filter(
        (entry) => entry.kind === 'line' || entry.kind === 'rectangle' || entry.kind === 'polygon',
      )
      .map((entry) => entry.id),
  );
  const selectedSurfaceIds = new Set(
    selection.filter((entry) => entry.kind === 'surface').map((entry) => entry.id),
  );
  const selectedOpeningIds = new Set(
    selection.filter((entry) => entry.kind === 'opening').map((entry) => entry.id),
  );
  const selectedLabelIds = new Set(
    selection.filter((entry) => entry.kind === 'label').map((entry) => entry.id),
  );

  return {
    ...project,
    drawingEntities: project.drawingEntities.map((entity) =>
      selectedDrawingIds.has(entity.id) ? translateDrawingEntity(entity, dx, dy) : entity,
    ),
    surfaces: project.surfaces.map((surface) => {
      if (selectedSurfaceIds.has(surface.id)) {
        return {
          ...surface,
          outerBoundary: translatePoints(surface.outerBoundary, dx, dy),
          holes: surface.holes.map((hole) => translatePoints(hole, dx, dy)),
        };
      }

      const nextHoles = surface.holes.map((hole, index) => {
        const openingId = surface.holeMeta[index]?.id;
        if (!openingId || !selectedOpeningIds.has(openingId)) return hole;
        return translatePoints(hole, dx, dy);
      });

      return nextHoles.some((hole, index) => hole !== surface.holes[index])
        ? { ...surface, holes: nextHoles }
        : surface;
    }),
    labels: project.labels.map((label) => {
      if (!selectedLabelIds.has(label.id)) return label;
      return isLabelAnchorMoved(label, selectedDrawingIds, selectedSurfaceIds, selectedOpeningIds)
        ? label
        : { ...label, position: translatePoint(label.position, dx, dy) };
    }),
  };
};

export const translateCurrentSelection = (dx: number, dy: number): boolean => {
  const selection = useSelectionStore.getState().selected;
  if (!hasMovableSelection(selection) || (dx === 0 && dy === 0)) return false;

  const project = useProjectStore.getState().project;
  const nextProject = translateSelectionInProject(project, selection, dx, dy);
  dispatchCommand(replaceProjectCommand({ next: nextProject }, 'Move selection'));
  return true;
};
