import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '@/types';
import { exportProjectToJson, parseProjectFromJson } from '@/storage';
import { createSurface } from '@/domain/surfaces/createSurface';
import { createMaterial } from '@/domain/materials/material';

describe('integration: JSON round-trip', () => {
  it('export then import yields an equivalent project', async () => {
    const project = createEmptyProject('Round Trip', { id: 'prj_X', now: '2026-01-01T00:00:00Z' });
    project.surfaces.push(
      createSurface({
        name: 'S',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
      }),
    );
    project.materials.push(createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300 }));
    const blob = exportProjectToJson(project);
    const json = await blob.text();
    const parsed = parseProjectFromJson(json);
    expect(parsed.id).toBe(project.id);
    expect(parsed.surfaces).toHaveLength(1);
    expect(parsed.materials).toHaveLength(1);
  });
});
