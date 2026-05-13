import { useCallback, useState } from 'react';
import { useProjectStore } from '@/state';
import { useToastStore } from '@/state/toastStore';
import { dispatchCommand, setMaterialLayoutsCommand } from '@/domain/commands';
import { computeWorkingPolygon } from '@/domain/materialLayout/computeWorkingPolygon';
import type { OptimizeInput } from '@/domain/materialLayout/optimizeMaterialLayout';
import { runOptimizer } from '@/workers/materialLayoutOptimizerClient';
import type { MaterialLayout, Project } from '@/types';

const buildOptimizeInputs = (project: Project): OptimizeInput[] => {
  const inputs: OptimizeInput[] = [];
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
    inputs.push({
      surface,
      surfaceIndex: i,
      material,
      pattern,
      edgeRules: surface.edgeRules,
      connections: project.surfaceConnections,
      visibleSurfacePolygon: visible,
      physicalWorkingPolygon: physical,
      priority: pattern.optimizationPriority,
    });
  }
  return inputs;
};

export const useGenerateLayout = () => {
  const [running, setRunning] = useState(false);
  const generateAndPersist = useCallback(async () => {
    const pushToast = useToastStore.getState().pushToast;
    setRunning(true);
    try {
      const project = useProjectStore.getState().project;
      const inputs = buildOptimizeInputs(project);
      if (inputs.length === 0) {
        pushToast('Assign a material and pattern to a surface to generate a layout.', 'warning');
        return;
      }
      const results = await runOptimizer(inputs);
      const layouts: MaterialLayout[] = results.map((r) => r.layout);
      dispatchCommand(setMaterialLayoutsCommand({ layouts }));
      pushToast(
        `Generated ${layouts.length} layout${layouts.length === 1 ? '' : 's'}.`,
        'success',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      useToastStore.getState().pushToast(`Layout generation failed: ${message}`, 'error');
    } finally {
      setRunning(false);
    }
  }, []);
  return { generateAndPersist, running };
};
