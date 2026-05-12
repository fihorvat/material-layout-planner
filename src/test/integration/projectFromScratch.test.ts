import { describe, expect, it, beforeEach } from 'vitest';
import { useProjectStore, useHistoryStore } from '@/state';
import {
  dispatchCommand,
  addDrawingEntityCommand,
  createSurfaceCommand,
  addMaterialCommand,
  addPlacementPatternCommand,
  assignMaterialCommand,
  assignPlacementPatternCommand,
  setMaterialLayoutsCommand,
} from '@/domain/commands';
import { defaultDrawingStyle } from '@/types';
import { createMaterial } from '@/domain/materials/material';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';
import { rectangleToSurface } from '@/domain/surfaces/createSurface';
import { generateLayoutsForProject } from '@/domain/materialLayout/generateLayoutsForProject';
import { buildCutList } from '@/domain/materialLayout/materialCutList';
import { buildPdfDocument } from '@/domain/pdf';
import { computeProjectStats } from '@/domain/materialLayout/layoutStats';
import { defaultPdfSettings } from '@/types';

describe('integration: project from scratch', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('draw → surface → assign material+pattern → generate layout → cut list → PDF', async () => {
    const rect = {
      id: 'R1',
      type: 'rectangle' as const,
      origin: { x: 0, y: 0 },
      widthMm: 1200,
      heightMm: 900,
      rotationDeg: 0,
      showDimensions: false,
      style: defaultDrawingStyle(),
    };
    dispatchCommand(addDrawingEntityCommand({ entity: rect }));
    const surface = rectangleToSurface(rect, 'Wall A');
    dispatchCommand(createSurfaceCommand({ surface }));
    const material = createMaterial({ name: 'Tile', unitWidthMm: 600, unitHeightMm: 300 });
    dispatchCommand(addMaterialCommand({ material }));
    const pattern = createPlacementPattern({ name: 'Stacked', jointMm: 0, originMode: 'topLeft' });
    dispatchCommand(addPlacementPatternCommand({ pattern }));
    dispatchCommand(assignMaterialCommand({ surfaceId: surface.id, materialId: material.id }));
    dispatchCommand(assignPlacementPatternCommand({ surfaceId: surface.id, patternId: pattern.id }));

    const project = useProjectStore.getState().project;
    const layouts = generateLayoutsForProject(project);
    dispatchCommand(setMaterialLayoutsCommand({ layouts }));

    const finalProject = useProjectStore.getState().project;
    expect(finalProject.materialLayouts).toHaveLength(1);
    expect(finalProject.materialLayouts[0]?.pieces.length).toBeGreaterThanOrEqual(6);

    const cutList = buildCutList(finalProject);
    expect(cutList.length).toBeGreaterThanOrEqual(1);

    const pdfBytes = await buildPdfDocument({
      project: finalProject,
      settings: defaultPdfSettings(),
      layouts: finalProject.materialLayouts,
      cutList,
      cuttingDiagrams: [],
      projectStats: computeProjectStats(finalProject),
    });
    expect(pdfBytes.byteLength).toBeGreaterThan(1000);
  });
});
