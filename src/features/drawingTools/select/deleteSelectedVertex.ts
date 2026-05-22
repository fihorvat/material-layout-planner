import type { Point2D, PolygonEntity, RectangleEntity } from '@/types';
import {
  useProjectStore,
  useSelectionStore,
  useSelectedVertexStore,
  type SelectedVertex,
} from '@/state';
import {
  dispatchCommand,
  findOpeningSurface,
  replaceDrawingEntityCommand,
  updateDrawingEntityCommand,
  updateOpeningCommand,
  updateSurfaceCommand,
} from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';
import { degToRad, ensureCCW } from '@/domain/geometry';

const MIN_POLYGON_VERTICES = 3;

const withoutIndex = <T,>(items: T[], index: number): T[] =>
  items.filter((_, itemIndex) => itemIndex !== index);

const rectangleCorners = (rect: RectangleEntity): Point2D[] => {
  const rad = degToRad(rect.rotationDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const local: Point2D[] = [
    { x: 0, y: 0 },
    { x: rect.widthMm, y: 0 },
    { x: rect.widthMm, y: rect.heightMm },
    { x: 0, y: rect.heightMm },
  ];
  return ensureCCW(
    local.map((point) => ({
      x: rect.origin.x + point.x * cos - point.y * sin,
      y: rect.origin.y + point.x * sin + point.y * cos,
    })),
  );
};

const replaceSelectionEntry = (
  current: ReturnType<typeof useSelectionStore.getState>['selected'],
  source: { kind: 'rectangle'; id: string },
  replacement: { kind: 'polygon'; id: string },
): void => {
  const next = current.map((entry) =>
    entry.kind === source.kind && entry.id === source.id ? replacement : entry,
  );
  if (next.some((entry) => entry.kind === replacement.kind && entry.id === replacement.id)) {
    useSelectionStore.getState().selectMany(next);
    return;
  }
  useSelectionStore.getState().select(replacement);
};

const deletePolygonVertex = (selectedVertex: SelectedVertex): boolean => {
  if (selectedVertex.kind !== 'polygonVertex') return false;
  const project = useProjectStore.getState().project;
  const entity = project.drawingEntities.find(
    (candidate): candidate is PolygonEntity =>
      candidate.id === selectedVertex.entityId && candidate.type === 'polygon',
  );
  if (!entity) return false;
  if (selectedVertex.index < 0 || selectedVertex.index >= entity.points.length) return false;
  if (entity.points.length <= MIN_POLYGON_VERTICES) return false;
  dispatchCommand(
    updateDrawingEntityCommand(
      {
        id: entity.id,
        patch: { points: withoutIndex(entity.points, selectedVertex.index) },
      },
      'Delete polygon vertex',
    ),
  );
  useSelectedVertexStore.getState().clear();
  return true;
};

const deleteRectangleCorner = (selectedVertex: SelectedVertex): boolean => {
  if (selectedVertex.kind !== 'rectCorner') return false;
  const project = useProjectStore.getState().project;
  const entity = project.drawingEntities.find(
    (candidate): candidate is RectangleEntity =>
      candidate.id === selectedVertex.entityId && candidate.type === 'rectangle',
  );
  if (!entity) return false;
  const corners = rectangleCorners(entity);
  if (selectedVertex.corner < 0 || selectedVertex.corner >= corners.length) return false;
  const replacement: PolygonEntity = {
    id: newDrawingEntityId(),
    type: 'polygon',
    points: withoutIndex(corners, selectedVertex.corner),
    name: entity.name,
    showSegmentDimensions: entity.showDimensions,
    showArea: false,
    style: entity.style,
  };
  dispatchCommand(
    replaceDrawingEntityCommand(
      { sourceId: entity.id, replacement },
      'Delete rectangle vertex',
    ),
  );
  replaceSelectionEntry(
    useSelectionStore.getState().selected,
    { kind: 'rectangle', id: entity.id },
    { kind: 'polygon', id: replacement.id },
  );
  useSelectedVertexStore.getState().clear();
  return true;
};

const deleteSurfaceVertex = (selectedVertex: SelectedVertex): boolean => {
  if (selectedVertex.kind !== 'surfaceVertex') return false;
  const project = useProjectStore.getState().project;
  const surface = project.surfaces.find((candidate) => candidate.id === selectedVertex.surfaceId);
  if (!surface) return false;
  if (selectedVertex.index < 0 || selectedVertex.index >= surface.outerBoundary.length) {
    return false;
  }
  if (surface.outerBoundary.length <= MIN_POLYGON_VERTICES) return false;
  dispatchCommand(
    updateSurfaceCommand(
      {
        id: surface.id,
        patch: { outerBoundary: withoutIndex(surface.outerBoundary, selectedVertex.index) },
      },
      'Delete surface vertex',
    ),
  );
  useSelectedVertexStore.getState().clear();
  return true;
};

const deleteOpeningVertex = (selectedVertex: SelectedVertex): boolean => {
  if (selectedVertex.kind !== 'openingVertex') return false;
  const project = useProjectStore.getState().project;
  const found = findOpeningSurface(project, selectedVertex.openingId);
  if (!found || found.surface.id !== selectedVertex.surfaceId) return false;
  const hole = found.surface.holes[found.index];
  if (!hole) return false;
  if (selectedVertex.index < 0 || selectedVertex.index >= hole.length) return false;
  if (hole.length <= MIN_POLYGON_VERTICES) return false;
  dispatchCommand(
    updateOpeningCommand(
      {
        surfaceId: selectedVertex.surfaceId,
        openingId: selectedVertex.openingId,
        patch: { hole: withoutIndex(hole, selectedVertex.index) },
      },
      'Delete opening vertex',
    ),
  );
  useSelectedVertexStore.getState().clear();
  return true;
};

export const deleteSelectedVertex = (): boolean => {
  const selectedVertex = useSelectedVertexStore.getState().selectedVertex;
  if (!selectedVertex) return false;
  return (
    deleteRectangleCorner(selectedVertex) ||
    deletePolygonVertex(selectedVertex) ||
    deleteSurfaceVertex(selectedVertex) ||
    deleteOpeningVertex(selectedVertex)
  );
};