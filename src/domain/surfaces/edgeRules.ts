import type { Surface, SurfaceConnection, EdgeRule } from '@/types';
import { encodeEdgeId, decodeEdgeId } from './connectSurfaces';

export type ResolvedEdgeRule = {
  edgeIndex: number;
  ruleType: EdgeRule['ruleType'];
  maxOverlapMm: number;
  overlapOpacity: number;
  applyThicknessCompensation: boolean;
  customThicknessAllowanceMm?: number;
  source: 'connection' | 'edgeRule' | 'default';
};

const findEdgeConnection = (
  surfaceId: string,
  edgeIndex: number,
  connections: SurfaceConnection[],
): SurfaceConnection | null => {
  const edgeId = encodeEdgeId(surfaceId, edgeIndex);
  for (const c of connections) {
    if (c.edgeAId === edgeId || c.edgeBId === edgeId) return c;
  }
  return null;
};

export const getEffectiveEdgeRule = (
  surface: Surface,
  edgeIndex: number,
  connections: SurfaceConnection[],
): ResolvedEdgeRule => {
  const conn = findEdgeConnection(surface.id, edgeIndex, connections);
  if (conn && conn.allowPhysicalOverlap) {
    const otherEdge = conn.edgeAId.startsWith(surface.id) ? conn.edgeBId : conn.edgeAId;
    const other = decodeEdgeId(otherEdge);
    return {
      edgeIndex,
      ruleType: 'connectedOverlap',
      maxOverlapMm: conn.defaultOverlapMm,
      overlapOpacity: conn.overlapOpacity,
      applyThicknessCompensation: conn.thicknessMode !== 'ignoreThickness',
      source: 'connection',
      customThicknessAllowanceMm:
        conn.thicknessMode === 'customAllowance' ? undefined : undefined,
      ...(other ? {} : {}),
    };
  }
  const rule = surface.edgeRules.find((r) => r.edgeIndex === edgeIndex);
  if (rule) {
    return {
      edgeIndex,
      ruleType: rule.ruleType,
      maxOverlapMm: rule.maxOverlapMm,
      overlapOpacity: rule.overlapOpacity,
      applyThicknessCompensation: rule.applyThicknessCompensation,
      customThicknessAllowanceMm: rule.customThicknessAllowanceMm,
      source: 'edgeRule',
    };
  }
  return {
    edgeIndex,
    ruleType: 'hardStop',
    maxOverlapMm: 0,
    overlapOpacity: 0.25,
    applyThicknessCompensation: false,
    source: 'default',
  };
};
