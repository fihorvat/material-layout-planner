import type { Surface, SurfaceConnection } from '@/types';
import { newSurfaceConnectionId } from '@/domain/ids';
import { distance } from '@/domain/geometry';

export const encodeEdgeId = (surfaceId: string, edgeIndex: number): string =>
  `${surfaceId}#${edgeIndex}`;

export const decodeEdgeId = (edgeId: string): { surfaceId: string; edgeIndex: number } => {
  const idx = edgeId.lastIndexOf('#');
  if (idx < 0) return { surfaceId: edgeId, edgeIndex: 0 };
  return {
    surfaceId: edgeId.slice(0, idx),
    edgeIndex: Number(edgeId.slice(idx + 1)),
  };
};

type ConnectionInput = {
  surfaceAId: string;
  edgeAIndex: number;
  surfaceBId: string;
  edgeBIndex: number;
  connectionType: SurfaceConnection['connectionType'];
  angleDeg?: number;
  jointAtConnectionMm?: number;
  allowPatternContinuation?: boolean;
  allowPhysicalOverlap?: boolean;
  physicalOverlapSide?: SurfaceConnection['physicalOverlapSide'];
  defaultOverlapMm?: number;
  overlapOpacity?: number;
  thicknessMode?: SurfaceConnection['thicknessMode'];
};

export const makeConnection = (input: ConnectionInput): SurfaceConnection => ({
  id: newSurfaceConnectionId(),
  surfaceAId: input.surfaceAId,
  edgeAId: encodeEdgeId(input.surfaceAId, input.edgeAIndex),
  surfaceBId: input.surfaceBId,
  edgeBId: encodeEdgeId(input.surfaceBId, input.edgeBIndex),
  connectionType: input.connectionType,
  angleDeg: input.angleDeg ?? (input.connectionType === 'flatContinuation' ? 180 : 90),
  jointAtConnectionMm: input.jointAtConnectionMm ?? 3,
  allowPatternContinuation: input.allowPatternContinuation ?? false,
  allowPhysicalOverlap: input.allowPhysicalOverlap ?? false,
  physicalOverlapSide: input.physicalOverlapSide ?? 'both',
  defaultOverlapMm: input.defaultOverlapMm ?? 0,
  overlapOpacity: input.overlapOpacity ?? 0.25,
  thicknessMode: input.thicknessMode ?? 'ignoreThickness',
});

type ConnectionValidation = {
  valid: boolean;
  issues: { code: string; message: string }[];
  warnings: { code: string; message: string }[];
};

export const validateConnection = (
  surfaces: Surface[],
  existing: SurfaceConnection[],
  input: ConnectionInput,
): ConnectionValidation => {
  const issues: ConnectionValidation['issues'] = [];
  const warnings: ConnectionValidation['warnings'] = [];
  const a = surfaces.find((s) => s.id === input.surfaceAId);
  const b = surfaces.find((s) => s.id === input.surfaceBId);
  if (!a) issues.push({ code: 'missingSurfaceA', message: 'Surface A not found' });
  if (!b) issues.push({ code: 'missingSurfaceB', message: 'Surface B not found' });
  if (input.surfaceAId === input.surfaceBId) {
    issues.push({ code: 'sameSurface', message: 'Cannot connect a surface to itself' });
  }
  if (a && (input.edgeAIndex < 0 || input.edgeAIndex >= a.outerBoundary.length)) {
    issues.push({ code: 'edgeAOutOfRange', message: 'Edge A index out of range' });
  }
  if (b && (input.edgeBIndex < 0 || input.edgeBIndex >= b.outerBoundary.length)) {
    issues.push({ code: 'edgeBOutOfRange', message: 'Edge B index out of range' });
  }
  const aEdgeId = encodeEdgeId(input.surfaceAId, input.edgeAIndex);
  const bEdgeId = encodeEdgeId(input.surfaceBId, input.edgeBIndex);
  for (const c of existing) {
    if (
      (c.edgeAId === aEdgeId && c.edgeBId === bEdgeId) ||
      (c.edgeAId === bEdgeId && c.edgeBId === aEdgeId)
    ) {
      issues.push({
        code: 'duplicateConnection',
        message: 'Connection already exists between these edges',
      });
      break;
    }
  }
  if (a && b && issues.length === 0) {
    const aA = a.outerBoundary[input.edgeAIndex]!;
    const aB = a.outerBoundary[(input.edgeAIndex + 1) % a.outerBoundary.length]!;
    const bA = b.outerBoundary[input.edgeBIndex]!;
    const bB = b.outerBoundary[(input.edgeBIndex + 1) % b.outerBoundary.length]!;
    const lenA = distance(aA, aB);
    const lenB = distance(bA, bB);
    if (Math.abs(lenA - lenB) > 1) {
      warnings.push({
        code: 'edgeLengthMismatch',
        message: `Edge lengths differ (${lenA.toFixed(1)} vs ${lenB.toFixed(1)} mm)`,
      });
    }
  }
  return { valid: issues.length === 0, issues, warnings };
};
