import type {
  Surface,
  Material,
  PlacementPattern,
  EdgeRule,
  SurfaceConnection,
  MaterialLayout,
  OptimizationPriority,
} from '@/types';
import type { Polygon } from '@/domain/geometry';
import type { OverlapZone } from './computeWorkingPolygon';
import { generateMaterialCandidates } from './generateMaterialCandidates';
import { buildMaterialLayout } from './buildMaterialLayout';
import { scoreMaterialLayout, type LayoutScore } from './scoreMaterialLayout';
import { pointsToAabb } from '@/domain/geometry';

export type OptimizeInput = {
  surface: Surface;
  surfaceIndex: number;
  material: Material;
  pattern: PlacementPattern;
  edgeRules: EdgeRule[];
  connections: SurfaceConnection[];
  visibleSurfacePolygon: Polygon;
  physicalWorkingPolygon: Polygon;
  overlapZones?: OverlapZone[];
  priority: OptimizationPriority;
  context?: { connectedLayouts?: MaterialLayout[] };
};

export type OptimizeResult = {
  layout: MaterialLayout;
  score: LayoutScore;
  variation: string;
};

const buildLayoutForCandidate = (
  input: OptimizeInput,
  candidatePattern: PlacementPattern,
): MaterialLayout =>
  buildMaterialLayout({
    surface: input.surface,
    surfaceIndex: input.surfaceIndex,
    material: input.material,
    pattern: candidatePattern,
    edgeRules: input.edgeRules,
    connections: input.connections,
    visibleSurfacePolygon: input.visibleSurfacePolygon,
    physicalWorkingPolygon: input.physicalWorkingPolygon,
    overlapZones: input.overlapZones,
  });

export const optimizeMaterialLayout = (input: OptimizeInput): OptimizeResult => {
  if (input.priority.manualOffsetLocked) {
    const layout = buildLayoutForCandidate(input, input.pattern);
    return {
      layout,
      score: scoreMaterialLayout({
        layout,
        surface: input.surface,
        material: input.material,
        priority: input.priority,
        context: input.context,
      }),
      variation: 'manualLock',
    };
  }
  const workingAabb = pointsToAabb(input.physicalWorkingPolygon.outer);
  const candidates = generateMaterialCandidates({
    surface: input.surface,
    material: input.material,
    pattern: input.pattern,
    workingAabb,
    manualOffsetLocked: false,
  });
  let best: OptimizeResult | null = null;
  for (const c of candidates) {
    const layout = buildLayoutForCandidate(input, c.pattern);
    const score = scoreMaterialLayout({
      layout,
      surface: input.surface,
      material: input.material,
      priority: input.priority,
      context: input.context,
    });
    if (!best || score.total < best.score.total) {
      best = { layout, score, variation: c.meta.variation };
    }
  }
  if (!best) {
    const layout = buildLayoutForCandidate(input, input.pattern);
    return {
      layout,
      score: scoreMaterialLayout({
        layout,
        surface: input.surface,
        material: input.material,
        priority: input.priority,
        context: input.context,
      }),
      variation: 'baseline',
    };
  }
  return best;
};
