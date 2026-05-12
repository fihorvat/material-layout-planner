import type { LabelEntity, Project, Point2D } from '@/types';
import { polygonCentroid } from '@/domain/geometry';

export const computeAnchorPosition = (label: LabelEntity, project: Project): Point2D | null => {
  if (label.anchorType === 'free' || !label.anchorId) {
    return label.position;
  }
  const offset = label.position;
  switch (label.anchorType) {
    case 'surface': {
      const s = project.surfaces.find((x) => x.id === label.anchorId);
      if (!s) return null;
      const c = polygonCentroid(s.outerBoundary);
      return { x: c.x + offset.x, y: c.y + offset.y };
    }
    case 'opening': {
      for (const s of project.surfaces) {
        for (const hole of s.holes) {
          if (`${s.id}:hole` === label.anchorId || s.id === label.anchorId) {
            const c = polygonCentroid(hole);
            return { x: c.x + offset.x, y: c.y + offset.y };
          }
        }
      }
      return null;
    }
    case 'edge': {
      const [surfaceId, idxStr] = (label.anchorId ?? '').split(':');
      const surface = project.surfaces.find((x) => x.id === surfaceId);
      if (!surface) return null;
      const i = Number(idxStr);
      const a = surface.outerBoundary[i];
      const b = surface.outerBoundary[(i + 1) % surface.outerBoundary.length];
      if (!a || !b) return null;
      return { x: (a.x + b.x) / 2 + offset.x, y: (a.y + b.y) / 2 + offset.y };
    }
    case 'materialPiece': {
      for (const layout of project.materialLayouts) {
        const piece = layout.pieces.find((p) => p.id === label.anchorId);
        if (piece) {
          return {
            x: piece.labelPosition.x + offset.x,
            y: piece.labelPosition.y + offset.y,
          };
        }
      }
      return null;
    }
    default:
      return null;
  }
};
