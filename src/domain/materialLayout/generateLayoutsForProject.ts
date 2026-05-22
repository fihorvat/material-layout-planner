import type { Project, MaterialLayout } from '@/types';
import { buildMaterialLayout } from './buildMaterialLayout';
import { computeWorkingPolygon } from './computeWorkingPolygon';
import { buildPatternContinuationPlacementMap } from './patternContinuation';

export const generateLayoutsForProject = (
  project: Project,
  opts?: { generatedAt?: string },
): MaterialLayout[] => {
  const out: MaterialLayout[] = [];
  const patternPlacements = buildPatternContinuationPlacementMap(project);
  for (let i = 0; i < project.surfaces.length; i++) {
    const surface = project.surfaces[i]!;
    if (!surface.materialId || !surface.placementPatternId) continue;
    const material = project.materials.find((m) => m.id === surface.materialId);
    const pattern = project.placementPatterns.find((p) => p.id === surface.placementPatternId);
    if (!material || !pattern) continue;
    const placement = patternPlacements.get(surface.id);
    const anchorSurfaceId = placement?.anchorSurfaceId ?? surface.id;
    const patternAnchorSurface =
      project.surfaces.find((entry) => entry.id === anchorSurfaceId) ?? surface;
    const { visible, physical } = computeWorkingPolygon({
      surface,
      connections: project.surfaceConnections,
    });
    out.push(
      buildMaterialLayout({
        surface,
        surfaceIndex: i,
        material,
        pattern,
        patternAnchorSurface,
        patternVirtualOffset: placement?.virtualOffset,
        patternOriginTranslation: placement?.originTranslation,
        edgeRules: surface.edgeRules,
        visibleSurfacePolygon: visible,
        physicalWorkingPolygon: physical,
        generatedAt: opts?.generatedAt,
      }),
    );
  }
  return out;
};
