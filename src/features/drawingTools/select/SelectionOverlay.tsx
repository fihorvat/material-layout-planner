import { Rect } from 'react-konva';
import { useProjectStore, useSelectionStore } from '@/state';
import { pointsToAabb } from '@/domain/geometry';
import type { Point2D } from '@/types';
import { useSelectionMovePreviewStore } from './SelectionMoveGuides';

const translatePoints = (points: Point2D[], dx: number, dy: number): Point2D[] =>
  points.map((point) => ({ x: point.x + dx, y: point.y + dy }));

export const SelectionOverlay = () => {
  const project = useProjectStore((s) => s.project);
  const selected = useSelectionStore((s) => s.selected);
  const preview = useSelectionMovePreviewStore((s) => s.preview);
  const dx = preview?.dx ?? 0;
  const dy = preview?.dy ?? 0;

  return (
    <>
      {selected.map((entry) => {
        let pts: Point2D[] | null = null;
        if (entry.kind === 'surface') {
          const s = project.surfaces.find((x) => x.id === entry.id);
          if (s) pts = s.outerBoundary;
        } else if (entry.kind === 'opening') {
          for (const s of project.surfaces) {
            const idx = s.holeMeta.findIndex((m) => m.id === entry.id);
            if (idx >= 0) {
              pts = s.holes[idx] ?? null;
              break;
            }
          }
        } else {
          const e = project.drawingEntities.find((x) => x.id === entry.id);
          if (e) {
            if (e.type === 'line') pts = [e.start, e.end];
            else if (e.type === 'rectangle')
              pts = [
                { x: e.origin.x, y: e.origin.y },
                { x: e.origin.x + e.widthMm, y: e.origin.y },
                { x: e.origin.x + e.widthMm, y: e.origin.y + e.heightMm },
                { x: e.origin.x, y: e.origin.y + e.heightMm },
              ];
            else pts = e.points;
          }
        }
        if (!pts || pts.length === 0) return null;
        const b = pointsToAabb(translatePoints(pts, dx, dy));
        return (
          <Rect
            key={`${entry.kind}:${entry.id}`}
            x={b.minX}
            y={b.minY}
            width={b.maxX - b.minX}
            height={b.maxY - b.minY}
            stroke="#2563eb"
            strokeWidth={1.5}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            dashEnabled
            listening={false}
          />
        );
      })}
    </>
  );
};
