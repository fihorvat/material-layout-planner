import type { Project, SurfaceConnection, SurfaceConnectionOverlapSide } from '@/types';

export type ConnectionFormValues = {
  connectionType: SurfaceConnection['connectionType'];
  angleDeg: number;
  jointAtConnectionMm: number;
  allowPatternContinuation: boolean;
  allowPhysicalOverlap: boolean;
  physicalOverlapSide: SurfaceConnectionOverlapSide;
  defaultOverlapMm: number;
  overlapOpacity: number;
  thicknessMode: SurfaceConnection['thicknessMode'];
};

const FALLBACK_BUTT_JOINT_OVERLAP_MM = 10;
const DEFAULT_OVERLAP_SIDE: SurfaceConnectionOverlapSide = 'both';

export const createConnectionDefaults = (): ConnectionFormValues => ({
  connectionType: 'outsideCorner',
  angleDeg: 90,
  jointAtConnectionMm: 3,
  allowPatternContinuation: false,
  allowPhysicalOverlap: false,
  physicalOverlapSide: DEFAULT_OVERLAP_SIDE,
  defaultOverlapMm: 0,
  overlapOpacity: 0.25,
  thicknessMode: 'ignoreThickness',
});

export const normalizeConnectionFormValues = (
  values: Partial<ConnectionFormValues | SurfaceConnection>,
): ConnectionFormValues => ({
  ...createConnectionDefaults(),
  ...values,
  physicalOverlapSide: values.physicalOverlapSide ?? DEFAULT_OVERLAP_SIDE,
});

const findSurfaceThicknessMm = (project: Project, surfaceId: string): number => {
  const surface = project.surfaces.find((entry) => entry.id === surfaceId);
  if (!surface?.materialId) return 0;
  const material = project.materials.find((entry) => entry.id === surface.materialId);
  return material?.thicknessMm ?? 0;
};

export const inferConnectionMaterialThicknessMm = (
  project: Project,
  surfaceAId: string,
  surfaceBId: string,
): number => {
  const thicknesses = [
    findSurfaceThicknessMm(project, surfaceAId),
    findSurfaceThicknessMm(project, surfaceBId),
  ].filter((value) => value > 0);
  return thicknesses.length > 0 ? Math.max(...thicknesses) : 0;
};

export const getConnectionTypeDefaults = (
  connectionType: SurfaceConnection['connectionType'],
  context?: {
    project: Project;
    surfaceAId: string;
    surfaceBId: string;
  },
): Partial<ConnectionFormValues> => {
  const inferredThicknessMm = context
    ? inferConnectionMaterialThicknessMm(context.project, context.surfaceAId, context.surfaceBId)
    : 0;

  switch (connectionType) {
    case 'insideCorner':
      return {
        connectionType,
        angleDeg: 90,
        jointAtConnectionMm: 3,
        allowPatternContinuation: false,
        allowPhysicalOverlap: false,
        physicalOverlapSide: DEFAULT_OVERLAP_SIDE,
        defaultOverlapMm: 0,
        thicknessMode: 'ignoreThickness',
      };
    case 'flatContinuation':
      return {
        connectionType,
        angleDeg: 180,
        jointAtConnectionMm: 0,
        allowPatternContinuation: false,
        allowPhysicalOverlap: false,
        physicalOverlapSide: DEFAULT_OVERLAP_SIDE,
        defaultOverlapMm: 0,
        thicknessMode: 'ignoreThickness',
      };
    case 'mitreCut':
      return {
        connectionType,
        angleDeg: 90,
        jointAtConnectionMm: 0,
        allowPatternContinuation: false,
        allowPhysicalOverlap: false,
        physicalOverlapSide: DEFAULT_OVERLAP_SIDE,
        defaultOverlapMm: 0,
        thicknessMode: 'showThicknessOnly',
      };
    case 'buttJoint': {
      const overlapMm =
        inferredThicknessMm > 0 ? inferredThicknessMm : FALLBACK_BUTT_JOINT_OVERLAP_MM;
      return {
        connectionType,
        angleDeg: 90,
        jointAtConnectionMm: 0,
        allowPatternContinuation: false,
        allowPhysicalOverlap: true,
        physicalOverlapSide: 'surfaceA',
        defaultOverlapMm: overlapMm,
        thicknessMode: 'compensateCoveredEdge',
      };
    }
    case 'custom':
      return {
        connectionType,
        angleDeg: 90,
        physicalOverlapSide: DEFAULT_OVERLAP_SIDE,
      };
    case 'outsideCorner':
    default:
      return {
        connectionType: 'outsideCorner',
        angleDeg: 90,
        jointAtConnectionMm: 3,
        allowPatternContinuation: false,
        allowPhysicalOverlap: false,
        physicalOverlapSide: DEFAULT_OVERLAP_SIDE,
        defaultOverlapMm: 0,
        thicknessMode: 'ignoreThickness',
      };
  }
};
