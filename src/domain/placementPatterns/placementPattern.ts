import type { PlacementPattern, Project, Material } from '@/types';
import { defaultOptimizationPriority } from '@/types';
import { newPlacementPatternId } from '@/domain/ids';

type CreatePatternInput = { name: string } & Partial<PlacementPattern>;

export const createPlacementPattern = (input: CreatePatternInput): PlacementPattern => ({
  id: input.id ?? newPlacementPatternId(),
  name: input.name,
  type: input.type ?? 'stacked',
  orientation: input.orientation ?? 'horizontal',
  angleDeg: input.angleDeg ?? 0,
  jointMm: input.jointMm ?? 3,
  offsetXmm: input.offsetXmm ?? 0,
  offsetYmm: input.offsetYmm ?? 0,
  rowOffsetMm: input.rowOffsetMm ?? 0,
  rowOffsetPercent: input.rowOffsetPercent ?? 0,
  originMode: input.originMode ?? 'surfaceCenter',
  customOrigin: input.customOrigin,
  direction: input.direction ?? 'leftToRight',
  symmetryMode: input.symmetryMode ?? 'none',
  optimizationPriority: input.optimizationPriority ?? defaultOptimizationPriority(),
});

export const rowOffsetForType = (
  type: PlacementPattern['type'],
  unitWidthMm: number,
): number => {
  switch (type) {
    case 'runningBondHalf':
      return unitWidthMm / 2;
    case 'runningBondThird':
      return unitWidthMm / 3;
    case 'stacked':
    case 'verticalStacked':
      return 0;
    default:
      return 0;
  }
};

export const effectiveRowOffsetMm = (pattern: PlacementPattern, material: Material | null): number => {
  const typed = rowOffsetForType(pattern.type, material?.unitWidthMm ?? 0);
  if (typed > 0) return typed;
  if (pattern.rowOffsetMm > 0) return pattern.rowOffsetMm;
  if (pattern.rowOffsetPercent > 0 && material) {
    return (pattern.rowOffsetPercent / 100) * material.unitWidthMm;
  }
  return 0;
};

export const isPlacementPatternUsed = (project: Project, patternId: string): boolean =>
  project.surfaces.some((s) => s.placementPatternId === patternId) ||
  project.materialLayouts.some((l) => l.placementPatternId === patternId);

