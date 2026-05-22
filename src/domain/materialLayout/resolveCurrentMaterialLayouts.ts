import type { MaterialLayout, Project } from '@/types';
import { generateLayoutsForProject } from './generateLayoutsForProject';

export type ResolvedMaterialLayoutEntry = {
  layout: MaterialLayout;
  status: 'optimized' | 'preview';
};

const hasResolvedOverlapOpacities = (layout: MaterialLayout): boolean =>
  layout.pieces.every(
    (piece) =>
      piece.overlapPolygons.length === 0 ||
      piece.overlapPolygonOpacities?.length === piece.overlapPolygons.length,
  );

const isPersistedLayoutCurrent = (
  persisted: MaterialLayout | undefined,
  live: MaterialLayout,
): persisted is MaterialLayout =>
  !!persisted &&
  hasResolvedOverlapOpacities(persisted) &&
  persisted.materialId === live.materialId &&
  persisted.placementPatternId === live.placementPatternId &&
  persisted.settingsSnapshot.material === live.settingsSnapshot.material &&
  persisted.settingsSnapshot.placementPattern === live.settingsSnapshot.placementPattern &&
  persisted.settingsSnapshot.edgeRules === live.settingsSnapshot.edgeRules &&
  persisted.settingsSnapshot.surfaceConnections === live.settingsSnapshot.surfaceConnections;

export const resolveCurrentMaterialLayoutEntries = (
  project: Project,
): ResolvedMaterialLayoutEntry[] => {
  const live = generateLayoutsForProject(project);
  const persistedBySurface = new Map<string, MaterialLayout>();
  for (const layout of project.materialLayouts) {
    persistedBySurface.set(layout.surfaceId, layout);
  }
  return live.map((liveLayout) => {
    const persisted = persistedBySurface.get(liveLayout.surfaceId);
    if (isPersistedLayoutCurrent(persisted, liveLayout)) {
      return { layout: persisted, status: 'optimized' };
    }
    return { layout: liveLayout, status: 'preview' };
  });
};

export const resolveCurrentMaterialLayouts = (project: Project): MaterialLayout[] =>
  resolveCurrentMaterialLayoutEntries(project).map((entry) => entry.layout);