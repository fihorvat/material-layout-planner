import { describe, it, expect } from 'vitest';
import { ProjectSchema } from '../project';
import { SurfaceSchema } from '../surface';
import { createEmptyProject } from '../defaults';

describe('ProjectSchema', () => {
  it('parses a freshly created empty project without throwing', () => {
    const project = createEmptyProject('test');
    expect(() => ProjectSchema.parse(project)).not.toThrow();
  });

  it('rejects a project missing a required field', () => {
    const project = createEmptyProject('test') as Record<string, unknown>;
    delete project.name;
    const result = ProjectSchema.safeParse(project);
    expect(result.success).toBe(false);
  });

  it('round-trips through JSON without losing data', () => {
    const original = createEmptyProject('round-trip');
    const cloned = ProjectSchema.parse(JSON.parse(JSON.stringify(original)));
    expect(cloned).toEqual(original);
  });

  it('enforces schemaVersion === 1', () => {
    const bad = { ...createEmptyProject('v2'), schemaVersion: 2 };
    expect(ProjectSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an unknown top-level field due to strict()', () => {
    const project = createEmptyProject('test');
    const withExtra = { ...project, extra: 'nope' };
    expect(ProjectSchema.safeParse(withExtra).success).toBe(false);
  });
});

describe('SurfaceSchema', () => {
  it('rejects an outerBoundary with fewer than 3 points', () => {
    const surface = {
      id: 'surface-1',
      name: 'Front face',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      holes: [],
      materialId: null,
      placementPatternId: null,
      edgeRules: [],
      connections: [],
      showName: true,
      showDimensions: true,
      showArea: true,
      style: {
        strokeColor: '#000',
        strokeWidthPx: 1,
        fillColor: '#fff',
        fillOpacity: 0.5,
        textColor: '#000',
      },
    };
    expect(SurfaceSchema.safeParse(surface).success).toBe(false);
  });

  it('accepts a valid triangular surface', () => {
    const surface = {
      id: 'surface-1',
      name: 'Tri',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 },
      ],
      holes: [],
      materialId: null,
      placementPatternId: null,
      edgeRules: [],
      connections: [],
      showName: true,
      showDimensions: true,
      showArea: true,
      style: {
        strokeColor: '#000',
        strokeWidthPx: 1,
        fillColor: '#fff',
        fillOpacity: 0.5,
        textColor: '#000',
      },
    };
    expect(SurfaceSchema.safeParse(surface).success).toBe(true);
  });
});
