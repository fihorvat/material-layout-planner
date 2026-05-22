import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '@/types/defaults';
import { createMaterial } from '@/domain/materials/material';
import { createSurface } from '@/domain/surfaces/createSurface';
import {
  createConnectionDefaults,
  getConnectionTypeDefaults,
} from '../connectionDefaults';

describe('connectionDialogMeta', () => {
  it('builds the shared connection defaults', () => {
    expect(createConnectionDefaults()).toMatchObject({
      connectionType: 'outsideCorner',
      angleDeg: 90,
      jointAtConnectionMm: 3,
      allowPhysicalOverlap: false,
      defaultOverlapMm: 0,
      thicknessMode: 'ignoreThickness',
    });
  });

  it('uses assigned material thickness for butt-joint presets', () => {
    const project = createEmptyProject('Connection defaults');
    const material = createMaterial({ name: 'Tile', unitWidthMm: 300, unitHeightMm: 600, thicknessMm: 12 });
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
    };
    project.materials.push(material);
    project.surfaces.push(surfaceA, surfaceB);

    expect(
      getConnectionTypeDefaults('buttJoint', {
        project,
        surfaceAId: surfaceA.id,
        surfaceBId: surfaceB.id,
      }),
    ).toMatchObject({
      angleDeg: 90,
      jointAtConnectionMm: 0,
      allowPhysicalOverlap: true,
      defaultOverlapMm: 12,
      thicknessMode: 'compensateCoveredEdge',
    });
  });

  it('falls back to a safe overlap when butt-joint materials are not assigned', () => {
    const project = createEmptyProject('Connection defaults');
    const surfaceA = createSurface({
      name: 'A',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    const surfaceB = createSurface({
      name: 'B',
      outerBoundary: [
        { x: 100, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 100 },
        { x: 100, y: 100 },
      ],
    });
    project.surfaces.push(surfaceA, surfaceB);

    expect(
      getConnectionTypeDefaults('buttJoint', {
        project,
        surfaceAId: surfaceA.id,
        surfaceBId: surfaceB.id,
      }),
    ).toMatchObject({
      allowPhysicalOverlap: true,
      defaultOverlapMm: 10,
      thicknessMode: 'compensateCoveredEdge',
    });
  });
});