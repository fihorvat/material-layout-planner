import type { Project, MaterialLayout } from '@/types';
import { buildMaterialLayout } from './buildMaterialLayout';
import { computeWorkingPolygon } from './computeWorkingPolygon';

export const generateLayoutsForProject = (
  project: Project,
  opts?: { generatedAt?: string },
): MaterialLayout[] => {
  const out: MaterialLayout[] = [];
  for (let i = 0; i < project.surfaces.length; i++) {
    const surface = project.surfaces[i]!;
    if (!surface.materialId || !surface.placementPatternId) continue;
    const material = project.materials.find((m) => m.id === surface.materialId);
    const pattern = project.placementPatterns.find((p) => p.id === surface.placementPatternId);
    if (!material || !pattern) continue;
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
        edgeRules: surface.edgeRules,
        visibleSurfacePolygon: visible,
        physicalWorkingPolygon: physical,
        generatedAt: opts?.generatedAt,
      }),
    );
  }
  return out;
};
