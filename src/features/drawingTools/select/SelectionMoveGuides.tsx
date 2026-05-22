import { useMemo } from 'react';
import { Group, Line as KLine, Text } from 'react-konva';
import { create } from 'zustand';
import { findOpeningSurface } from '@/domain/commands';
import { pointsToAabb, rectangleToPoints } from '@/domain/geometry';
import { formatLength } from '@/domain/units';
import { collectShapeEdges } from '@/features/drawingTools/drawingMode';
import {
  computeOrthoMeasureGuides,
  type OrthoMeasureGuide,
} from '@/features/drawingTools/orthoMeasureMath';
import { useProjectStore, useSelectionStore, type SelectionEntry } from '@/state';
import type { Point2D, Project } from '@/types';

type SelectionMovePreview = { dx: number; dy: number } | null;

type SelectionMovePreviewState = {
  preview: SelectionMovePreview;
  setPreview: (preview: { dx: number; dy: number }) => void;
  clearPreview: () => void;
};

const GUIDE_COLOR = '#22c55e';
const LABEL_COLOR = '#15803d';
const MIN_DISTANCE_MM = 0.5;

export const useSelectionMovePreviewStore = create<SelectionMovePreviewState>((set) => ({
  preview: null,
  setPreview: (preview) => set({ preview }),
  clearPreview: () => set({ preview: null }),
}));

export const resolveSelectionDragDelta = (dx: number, dy: number, shift: boolean): Point2D => {
  if (!shift) return { x: dx, y: dy };
  return Math.abs(dx) >= Math.abs(dy) ? { x: dx, y: 0 } : { x: 0, y: dy };
};

const translatePoint = (point: Point2D, dx: number, dy: number): Point2D => ({
  x: point.x + dx,
  y: point.y + dy,
});

const buildGuideAnchors = (
  project: Project,
  selection: SelectionEntry[],
  dx: number,
  dy: number,
): Point2D[] => {
  const points: Point2D[] = [];

  for (const entry of selection) {
    if (entry.kind === 'line' || entry.kind === 'rectangle' || entry.kind === 'polygon') {
      const entity = project.drawingEntities.find((item) => item.id === entry.id);
      if (!entity) continue;
      if (entity.type === 'line') {
        points.push(translatePoint(entity.start, dx, dy), translatePoint(entity.end, dx, dy));
      } else if (entity.type === 'rectangle') {
        points.push(
          ...rectangleToPoints(entity.origin, entity.widthMm, entity.heightMm, entity.rotationDeg).map(
            (point) => translatePoint(point, dx, dy),
          ),
        );
      } else {
        points.push(...entity.points.map((point) => translatePoint(point, dx, dy)));
      }
      continue;
    }

    if (entry.kind === 'surface') {
      const surface = project.surfaces.find((item) => item.id === entry.id);
      if (!surface) continue;
      points.push(...surface.outerBoundary.map((point) => translatePoint(point, dx, dy)));
      for (const hole of surface.holes) {
        points.push(...hole.map((point) => translatePoint(point, dx, dy)));
      }
      continue;
    }

    if (entry.kind === 'opening') {
      const found = findOpeningSurface(project, entry.id);
      if (!found) continue;
      const hole = found.surface.holes[found.index];
      if (!hole) continue;
      points.push(...hole.map((point) => translatePoint(point, dx, dy)));
      continue;
    }

    if (entry.kind === 'label') {
      const label = project.labels.find((item) => item.id === entry.id);
      if (!label) continue;
      points.push(translatePoint(label.position, dx, dy));
    }
  }

  if (points.length <= 1) return points;
  const box = pointsToAabb(points);
  const midX = (box.minX + box.maxX) / 2;
  const midY = (box.minY + box.maxY) / 2;
  return [
    { x: box.minX, y: box.minY },
    { x: midX, y: box.minY },
    { x: box.maxX, y: box.minY },
    { x: box.maxX, y: midY },
    { x: box.maxX, y: box.maxY },
    { x: midX, y: box.maxY },
    { x: box.minX, y: box.maxY },
    { x: box.minX, y: midY },
    { x: midX, y: midY },
  ];
};

const buildReferenceProject = (project: Project, selection: SelectionEntry[]): Project => {
  const drawingIds = new Set(
    selection
      .filter((entry) => entry.kind === 'line' || entry.kind === 'rectangle' || entry.kind === 'polygon')
      .map((entry) => entry.id),
  );
  const surfaceIds = new Set(selection.filter((entry) => entry.kind === 'surface').map((entry) => entry.id));
  const openingIds = new Set(selection.filter((entry) => entry.kind === 'opening').map((entry) => entry.id));

  return {
    ...project,
    drawingEntities: project.drawingEntities.filter((entity) => !drawingIds.has(entity.id)),
    surfaces: project.surfaces.flatMap((surface) => {
      if (surfaceIds.has(surface.id)) return [];
      if (openingIds.size === 0) return [surface];
      const keptHoles = surface.holes.filter((_, index) => !openingIds.has(surface.holeMeta[index]?.id ?? ''));
      const keptMeta = surface.holeMeta.filter((meta) => !openingIds.has(meta.id));
      return [{ ...surface, holes: keptHoles, holeMeta: keptMeta }];
    }),
  };
};

const guideKey = (guide: OrthoMeasureGuide): 'east' | 'west' | 'south' | 'north' => {
  if (guide.orientation === 'horizontal') {
    return guide.to.x >= guide.from.x ? 'east' : 'west';
  }
  return guide.to.y >= guide.from.y ? 'south' : 'north';
};

const collectNearestGuides = (anchors: Point2D[], project: Project): OrthoMeasureGuide[] => {
  const edges = collectShapeEdges(project);
  const byDirection = new Map<'east' | 'west' | 'south' | 'north', OrthoMeasureGuide>();
  for (const anchor of anchors) {
    for (const guide of computeOrthoMeasureGuides(anchor, edges)) {
      if (guide.distanceMm < MIN_DISTANCE_MM) continue;
      const key = guideKey(guide);
      const current = byDirection.get(key);
      if (!current || guide.distanceMm < current.distanceMm) {
        byDirection.set(key, guide);
      }
    }
  }
  return [...byDirection.values()];
};

export const SelectionMoveGuides = () => {
  const project = useProjectStore((state) => state.project);
  const selection = useSelectionStore((state) => state.selected);
  const preview = useSelectionMovePreviewStore((state) => state.preview);

  const guides = useMemo(() => {
    if (!preview) return [];
    const anchors = buildGuideAnchors(project, selection, preview.dx, preview.dy);
    if (anchors.length === 0) return [];
    const referenceProject = buildReferenceProject(project, selection);
    return collectNearestGuides(anchors, referenceProject);
  }, [preview, project, selection]);

  if (!preview || guides.length === 0) return null;

  return (
    <Group listening={false}>
      {guides.map((guide, index) => {
        const midX = (guide.from.x + guide.to.x) / 2;
        const midY = (guide.from.y + guide.to.y) / 2;
        return (
          <Group key={`${guideKey(guide)}:${index}`}>
            <KLine
              points={[guide.from.x, guide.from.y, guide.to.x, guide.to.y]}
              stroke={GUIDE_COLOR}
              strokeWidth={1}
              strokeScaleEnabled={false}
              dash={[4, 3]}
              dashEnabled
              opacity={0.9}
            />
            <Text
              x={midX}
              y={midY}
              text={formatLength(guide.distanceMm)}
              fontSize={10}
              fill={LABEL_COLOR}
              offsetY={guide.orientation === 'horizontal' ? 12 : 0}
              offsetX={guide.orientation === 'vertical' ? -6 : 0}
            />
          </Group>
        );
      })}
    </Group>
  );
};