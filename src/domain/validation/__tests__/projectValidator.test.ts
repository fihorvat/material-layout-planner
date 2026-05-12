import { describe, expect, it } from 'vitest';
import { validateProject, summarizeWarnings } from '../projectValidator';
import { createEmptyProject } from '@/types';
import { createSurface } from '@/domain/surfaces/createSurface';
import { createMaterial } from '@/domain/materials/material';

describe('validateProject', () => {
  it('flags surface missing material/pattern', () => {
    const p = createEmptyProject('T');
    p.surfaces.push(createSurface({
      name: 'S',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    }));
    const w = validateProject(p);
    expect(w.some((x) => x.code === 'surface.missingMaterial')).toBe(true);
    expect(w.some((x) => x.code === 'surface.missingPattern')).toBe(true);
  });

  it('flags overlapping surfaces', () => {
    const p = createEmptyProject('T');
    p.surfaces.push(createSurface({
      name: 'A',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    }));
    p.surfaces.push(createSurface({
      name: 'B',
      outerBoundary: [
        { x: 50, y: 50 },
        { x: 150, y: 50 },
        { x: 150, y: 150 },
        { x: 50, y: 150 },
      ],
    }));
    const w = validateProject(p);
    expect(w.some((x) => x.code === 'surfaces.overlap')).toBe(true);
  });

  it('summarizeWarnings counts by severity', () => {
    const p = createEmptyProject('T');
    p.materials.push(createMaterial({ name: 'M', unitWidthMm: 100, unitHeightMm: 100, thicknessMm: 10 }));
    const summary = summarizeWarnings(validateProject(p));
    expect(summary.errorCount).toBe(0);
  });
});
