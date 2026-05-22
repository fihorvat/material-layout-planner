import type { Point2D, Surface, RectangleEntity } from '@/types';
import { defaultSurfaceStyle } from '@/types';
import { ensureCCW, ensureCW } from '@/domain/geometry';
import { newSurfaceId } from '@/domain/ids';

type CreateSurfaceInput = {
  name: string;
  outerBoundary: Point2D[];
  holes?: Point2D[][];
};

export const createSurface = (input: CreateSurfaceInput): Surface => {
  return {
    id: newSurfaceId(),
    name: input.name,
    outerBoundary: ensureCCW(input.outerBoundary),
    holes: (input.holes ?? []).map((h) => ensureCW(h)),
    holeMeta: [],
    materialId: null,
    placementPatternId: null,
    patternOffsetXmm: 0,
    patternOffsetYmm: 0,
    edgeRules: [],
    connections: [],
    showName: true,
    showDimensions: true,
    showArea: false,
    style: defaultSurfaceStyle(),
  };
};

export const rectangleToSurface = (rect: RectangleEntity, name: string): Surface => {
  const points = [
    { x: rect.origin.x, y: rect.origin.y },
    { x: rect.origin.x + rect.widthMm, y: rect.origin.y },
    { x: rect.origin.x + rect.widthMm, y: rect.origin.y + rect.heightMm },
    { x: rect.origin.x, y: rect.origin.y + rect.heightMm },
  ];
  return createSurface({ name, outerBoundary: points });
};
