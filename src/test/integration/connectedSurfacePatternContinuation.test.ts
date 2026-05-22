import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '@/types/defaults';
import { createMaterial } from '@/domain/materials/material';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';
import { createSurface } from '@/domain/surfaces/createSurface';
import { makeConnection } from '@/domain/surfaces/connectSurfaces';
import { generateLayoutsForProject } from '@/domain/materialLayout/generateLayoutsForProject';

const normalizeLabelPositions = (
  layout: ReturnType<typeof generateLayoutsForProject>[number],
  boundary: { x: number; y: number }[],
) => {
  const minX = Math.min(...boundary.map((point) => point.x));
  const minY = Math.min(...boundary.map((point) => point.y));
  return layout.pieces
    .map(
      (piece) =>
        `${(piece.labelPosition.x - minX).toFixed(3)},${(piece.labelPosition.y - minY).toFixed(3)}`,
    )
    .sort();
};

describe('integration: connection pattern continuation', () => {
  it('reuses the anchor surface so connected patterns do not restart per surface', () => {
    const project = createEmptyProject('Continuation');
    const material = createMaterial({
      name: 'Tile',
      unitWidthMm: 60,
      unitHeightMm: 60,
      thicknessMm: 10,
    });
    const pattern = createPlacementPattern({
      name: 'Grid',
      jointMm: 0,
      originMode: 'topLeft',
    });
    const surfaceA = {
      ...createSurface({
        name: 'A',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
      }),
      materialId: material.id,
      placementPatternId: pattern.id,
    };
    const surfaceB = {
      ...createSurface({
        name: 'B',
        outerBoundary: [
          { x: 100, y: 0 },
          { x: 200, y: 0 },
          { x: 200, y: 100 },
          { x: 100, y: 100 },
        ],
      }),
      materialId: material.id,
      placementPatternId: pattern.id,
    };
    project.materials.push(material);
    project.placementPatterns.push(pattern);
    project.surfaces.push(surfaceA, surfaceB);
    const restartedLayouts = generateLayoutsForProject(project);
    const restartedLayoutB = restartedLayouts.find((layout) => layout.surfaceId === surfaceB.id);
    expect(restartedLayoutB).toBeTruthy();

    project.surfaceConnections.push(
      makeConnection({
        surfaceAId: surfaceA.id,
        edgeAIndex: 1,
        surfaceBId: surfaceB.id,
        edgeBIndex: 3,
        connectionType: 'flatContinuation',
        allowPatternContinuation: true,
      }),
    );

    const continuedLayouts = generateLayoutsForProject(project);
    const continuedLayoutB = continuedLayouts.find((layout) => layout.surfaceId === surfaceB.id);
    expect(continuedLayoutB).toBeTruthy();

    const restartedMinX = Math.min(
      ...(restartedLayoutB?.pieces ?? []).map((piece) => piece.labelPosition.x),
    );
    const continuedMinX = Math.min(
      ...(continuedLayoutB?.pieces ?? []).map((piece) => piece.labelPosition.x),
    );
    expect(restartedMinX).toBeCloseTo(130, 3);
    expect(continuedMinX).toBeCloseTo(110, 3);
    expect(continuedMinX).toBeLessThan(restartedMinX);
  });

  it('keeps the continued pattern stable when a connected surface is moved away for visibility', () => {
    const project = createEmptyProject('Continuation spread');
    const material = createMaterial({
      name: 'Tile',
      unitWidthMm: 60,
      unitHeightMm: 60,
      thicknessMm: 10,
    });
    const pattern = createPlacementPattern({
      name: 'Grid',
      jointMm: 0,
      originMode: 'topLeft',
    });
    const surfaceA = {
      ...createSurface({
        name: 'A',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
      }),
      materialId: material.id,
      placementPatternId: pattern.id,
    };
    const surfaceB = {
      ...createSurface({
        name: 'B',
        outerBoundary: [
          { x: 100, y: 0 },
          { x: 200, y: 0 },
          { x: 200, y: 100 },
          { x: 100, y: 100 },
        ],
      }),
      materialId: material.id,
      placementPatternId: pattern.id,
    };
    project.materials.push(material);
    project.placementPatterns.push(pattern);
    project.surfaces.push(surfaceA, surfaceB);
    project.surfaceConnections.push(
      makeConnection({
        surfaceAId: surfaceA.id,
        edgeAIndex: 1,
        surfaceBId: surfaceB.id,
        edgeBIndex: 3,
        connectionType: 'flatContinuation',
        allowPatternContinuation: true,
      }),
    );

    const continuedLayouts = generateLayoutsForProject(project);
    const continuedLayoutB = continuedLayouts.find((layout) => layout.surfaceId === surfaceB.id);
    expect(continuedLayoutB).toBeTruthy();

    const spreadBy = { x: 240, y: 80 };
    project.surfaces[1] = {
      ...surfaceB,
      outerBoundary: surfaceB.outerBoundary.map((point) => ({
        x: point.x + spreadBy.x,
        y: point.y + spreadBy.y,
      })),
    };

    const movedLayouts = generateLayoutsForProject(project);
    const movedLayoutB = movedLayouts.find((layout) => layout.surfaceId === surfaceB.id);
    expect(movedLayoutB).toBeTruthy();

    expect(normalizeLabelPositions(movedLayoutB!, project.surfaces[1]!.outerBoundary)).toEqual(
      normalizeLabelPositions(continuedLayoutB!, surfaceB.outerBoundary),
    );
  });

  it('uses the full collinear side span so stepped surfaces do not skew continuation', () => {
    const createProjectForEdge = (edgeAIndex: number) => {
      const project = createEmptyProject(`Continuation stepped ${edgeAIndex}`);
      const material = createMaterial({
        name: 'Tile',
        unitWidthMm: 60,
        unitHeightMm: 60,
        thicknessMm: 10,
      });
      const pattern = createPlacementPattern({
        name: 'Grid',
        jointMm: 0,
        originMode: 'topLeft',
      });
      const steppedSurface = {
        ...createSurface({
          name: 'Stepped',
          outerBoundary: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 80 },
            { x: 60, y: 80 },
            { x: 60, y: 120 },
            { x: 100, y: 120 },
            { x: 100, y: 200 },
            { x: 0, y: 200 },
          ],
        }),
        materialId: material.id,
        placementPatternId: pattern.id,
      };
      const surfaceB = {
        ...createSurface({
          name: 'B',
          outerBoundary: [
            { x: 140, y: 0 },
            { x: 240, y: 0 },
            { x: 240, y: 200 },
            { x: 140, y: 200 },
          ],
        }),
        materialId: material.id,
        placementPatternId: pattern.id,
      };

      project.materials.push(material);
      project.placementPatterns.push(pattern);
      project.surfaces.push(steppedSurface, surfaceB);
      project.surfaceConnections.push(
        makeConnection({
          surfaceAId: steppedSurface.id,
          edgeAIndex,
          surfaceBId: surfaceB.id,
          edgeBIndex: 3,
          connectionType: 'flatContinuation',
          allowPatternContinuation: true,
        }),
      );

      return { project, surfaceB };
    };

    const topProject = createProjectForEdge(1);
    const bottomProject = createProjectForEdge(5);
    const topLayout = generateLayoutsForProject(topProject.project).find(
      (layout) => layout.surfaceId === topProject.surfaceB.id,
    );
    const bottomLayout = generateLayoutsForProject(bottomProject.project).find(
      (layout) => layout.surfaceId === bottomProject.surfaceB.id,
    );

    expect(topLayout).toBeTruthy();
    expect(bottomLayout).toBeTruthy();
    expect(normalizeLabelPositions(topLayout!, topProject.surfaceB.outerBoundary)).toEqual(
      normalizeLabelPositions(bottomLayout!, bottomProject.surfaceB.outerBoundary),
    );
  });
});
