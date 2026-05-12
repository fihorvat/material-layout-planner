import type { Surface, Material, PlacementPattern } from '@/types';
import type { Aabb } from '@/domain/geometry';
import type { LayoutCandidate } from './types';
import { generatePlacementGrid } from './generatePlacementGrid';

const MAX_CANDIDATES = 16;

export const generateMaterialCandidates = (input: {
  surface: Surface;
  material: Material;
  pattern: PlacementPattern;
  workingAabb: Aabb;
  manualOffsetLocked: boolean;
}): LayoutCandidate[] => {
  const { surface, material, pattern, workingAabb, manualOffsetLocked } = input;
  const baseStepX = (pattern.orientation === 'vertical' ? material.unitHeightMm : material.unitWidthMm) + pattern.jointMm;
  const baseStepY = (pattern.orientation === 'vertical' ? material.unitWidthMm : material.unitHeightMm) + pattern.jointMm;

  const variations: { name: string; mutate: (p: PlacementPattern) => PlacementPattern }[] = [
    { name: 'baseline', mutate: (p) => p },
  ];

  if (!manualOffsetLocked) {
    variations.push(
      { name: 'shiftX+halfUnit', mutate: (p) => ({ ...p, offsetXmm: p.offsetXmm + baseStepX / 2 }) },
      { name: 'shiftX-halfUnit', mutate: (p) => ({ ...p, offsetXmm: p.offsetXmm - baseStepX / 2 }) },
      { name: 'shiftX+quarterUnit', mutate: (p) => ({ ...p, offsetXmm: p.offsetXmm + baseStepX / 4 }) },
      { name: 'shiftX-quarterUnit', mutate: (p) => ({ ...p, offsetXmm: p.offsetXmm - baseStepX / 4 }) },
      { name: 'shiftY+halfUnit', mutate: (p) => ({ ...p, offsetYmm: p.offsetYmm + baseStepY / 2 }) },
      { name: 'shiftY-halfUnit', mutate: (p) => ({ ...p, offsetYmm: p.offsetYmm - baseStepY / 2 }) },
    );
    if (pattern.orientation !== 'customAngle') {
      variations.push({
        name: 'swappedOrientation',
        mutate: (p) => ({
          ...p,
          orientation: p.orientation === 'horizontal' ? 'vertical' : 'horizontal',
        }),
      });
    }
  }

  const candidates: LayoutCandidate[] = [];
  for (const v of variations) {
    if (candidates.length >= MAX_CANDIDATES) break;
    const next = v.mutate(pattern);
    candidates.push({
      pattern: next,
      grid: generatePlacementGrid({ surface, material, pattern: next, workingAabb }),
      meta: { variation: v.name },
    });
  }
  return candidates;
};
