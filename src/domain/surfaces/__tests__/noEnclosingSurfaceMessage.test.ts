import { describe, expect, it } from 'vitest';
import { noEnclosingSurfaceMessage } from '../noEnclosingSurfaceMessage';
import { createSurface } from '../createSurface';
import { createEmptyProject, defaultDrawingStyle } from '@/types';
import type { Project, RectangleEntity } from '@/types';

const emptyProject = (): Project => createEmptyProject('p');

const projectWithSurface = (): Project => ({
  ...emptyProject(),
  surfaces: [
    createSurface({
      name: 'S',
      outerBoundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    }),
  ],
});

const projectWithRectangleEntity = (): Project => {
  const rect: RectangleEntity = {
    id: 'R1',
    type: 'rectangle',
    origin: { x: 0, y: 0 },
    widthMm: 100,
    heightMm: 100,
    rotationDeg: 0,
    showDimensions: false,
    style: defaultDrawingStyle(),
  };
  return { ...emptyProject(), drawingEntities: [rect] };
};

describe('noEnclosingSurfaceMessage', () => {
  it('tells the user to create a surface first when none exist', () => {
    const msg = noEnclosingSurfaceMessage(emptyProject(), { x: 50, y: 50 });
    expect(msg.toLowerCase()).toContain('no surfaces');
  });

  it('tells the user a drawing entity is not a surface when the click hits one', () => {
    const msg = noEnclosingSurfaceMessage(projectWithRectangleEntity(), { x: 50, y: 50 });
    expect(msg.toLowerCase()).toMatch(/drawing entity|convert it to a surface/);
  });

  it('falls back to a generic message when the click is in empty space', () => {
    const msg = noEnclosingSurfaceMessage(projectWithSurface(), { x: 500, y: 500 });
    expect(msg.toLowerCase()).toContain('click inside a surface');
  });
});
