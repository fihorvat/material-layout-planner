import { describe, expect, it } from 'vitest';
import { createEmptyProject, defaultDrawingStyle } from '@/types';
import { createMaterial } from '@/domain/materials/material';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';
import { rectangleToSurface } from '@/domain/surfaces/createSurface';
import { generateLayoutsForProject } from '../generateLayoutsForProject';
import { resolveCurrentMaterialLayoutEntries } from '../resolveCurrentMaterialLayouts';

describe('resolveCurrentMaterialLayoutEntries', () => {
  it('keeps cloned persisted layouts marked as optimized when their snapshot values still match', () => {
    const project = createEmptyProject('Resolve current layouts');
    const material = createMaterial({ name: 'Tile', unitWidthMm: 600, unitHeightMm: 300 });
    const pattern = createPlacementPattern({
      name: 'Stacked',
      jointMm: 0,
      originMode: 'topLeft',
    });
    const surface = rectangleToSurface(
      {
        id: 'rect-1',
        type: 'rectangle',
        origin: { x: 0, y: 0 },
        widthMm: 1200,
        heightMm: 900,
        rotationDeg: 0,
        showDimensions: false,
        style: defaultDrawingStyle(),
      },
      'Wall A',
    );

    surface.materialId = material.id;
    surface.placementPatternId = pattern.id;
    project.materials.push(material);
    project.placementPatterns.push(pattern);
    project.surfaces.push(surface);

    const liveLayout = generateLayoutsForProject(project, {
      generatedAt: '2026-05-23T09:00:00.000Z',
    })[0]!;
    project.materialLayouts = [JSON.parse(JSON.stringify(liveLayout))];

    const entries = resolveCurrentMaterialLayoutEntries(project);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.status).toBe('optimized');
  });
});
