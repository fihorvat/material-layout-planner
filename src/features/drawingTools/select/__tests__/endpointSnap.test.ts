import { describe, expect, it } from 'vitest';
import { createEmptyProject, defaultDrawingStyle } from '@/types';
import type { LineEntity, RectangleEntity, Project } from '@/types';
import {
  collectEndpointSnapCandidates,
  snapDroppedLineEndpoint,
} from '../endpointSnap';

const makeLine = (
  id: string,
  start: { x: number; y: number },
  end: { x: number; y: number },
): LineEntity => ({
  id,
  type: 'line',
  start,
  end,
  showDimension: true,
  style: defaultDrawingStyle(),
});

const makeRect = (
  id: string,
  origin: { x: number; y: number },
  w: number,
  h: number,
): RectangleEntity => ({
  id,
  type: 'rectangle',
  origin,
  widthMm: w,
  heightMm: h,
  rotationDeg: 0,
  showDimensions: true,
  style: defaultDrawingStyle(),
});

const projectWith = (entities: Project['drawingEntities']): Project => ({
  ...createEmptyProject('p'),
  drawingEntities: entities,
});

describe('endpointSnap', () => {
  describe('collectEndpointSnapCandidates', () => {
    it('includes line endpoints except for excluded ones', () => {
      const project = projectWith([
        makeLine('A', { x: 0, y: 0 }, { x: 100, y: 0 }),
        makeLine('B', { x: 200, y: 0 }, { x: 300, y: 0 }),
      ]);
      const pts = collectEndpointSnapCandidates(project, new Set(['A.end']));
      // A.start, B.start, B.end are present; A.end is excluded.
      expect(pts).toEqual([
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 300, y: 0 },
      ]);
    });

    it('includes rectangle corners', () => {
      const project = projectWith([makeRect('R', { x: 0, y: 0 }, 100, 50)]);
      const pts = collectEndpointSnapCandidates(project, new Set());
      expect(pts).toHaveLength(4);
      expect(pts).toContainEqual({ x: 0, y: 0 });
      expect(pts).toContainEqual({ x: 100, y: 0 });
      expect(pts).toContainEqual({ x: 100, y: 50 });
      expect(pts).toContainEqual({ x: 0, y: 50 });
    });
  });

  describe('snapDroppedLineEndpoint', () => {
    it('snaps the dragged endpoint onto a nearby other line endpoint', () => {
      const project = projectWith([
        makeLine('A', { x: 0, y: 0 }, { x: 100, y: 0 }),
        // B's end is being dragged near A.end (within tolerance in screen px).
        makeLine('B', { x: 300, y: 300 }, { x: 102, y: 1 }),
      ]);
      const snapped = snapDroppedLineEndpoint({
        worldPoint: { x: 102, y: 1 },
        project,
        excludedLineEndpoints: new Set(['B.end']),
        snapEnabled: true,
        snapTolerancePx: 8,
        viewportScale: 1,
      });
      // Tolerance is 8/1 = 8mm; distance from (102,1) to A.end (100,0) is ~2.24mm.
      expect(snapped).toEqual({ x: 100, y: 0 });
    });

    it('does not snap when no candidate is within tolerance', () => {
      const project = projectWith([
        makeLine('A', { x: 0, y: 0 }, { x: 100, y: 0 }),
      ]);
      const snapped = snapDroppedLineEndpoint({
        worldPoint: { x: 500, y: 500 },
        project,
        excludedLineEndpoints: new Set(),
        snapEnabled: true,
        snapTolerancePx: 8,
        viewportScale: 1,
      });
      expect(snapped).toEqual({ x: 500, y: 500 });
    });

    it('does not snap to the endpoint being dragged itself', () => {
      const project = projectWith([
        makeLine('A', { x: 0, y: 0 }, { x: 100, y: 0 }),
      ]);
      // Drag A.end slightly; the nearest candidate is A.end itself, but it is
      // excluded, so the snap should be a no-op.
      const snapped = snapDroppedLineEndpoint({
        worldPoint: { x: 101, y: 0 },
        project,
        excludedLineEndpoints: new Set(['A.end']),
        snapEnabled: true,
        snapTolerancePx: 8,
        viewportScale: 1,
      });
      expect(snapped).toEqual({ x: 101, y: 0 });
    });

    it('returns the input point unchanged when snap is disabled', () => {
      const project = projectWith([
        makeLine('A', { x: 0, y: 0 }, { x: 100, y: 0 }),
      ]);
      const snapped = snapDroppedLineEndpoint({
        worldPoint: { x: 101, y: 0 },
        project,
        excludedLineEndpoints: new Set(['B.end']),
        snapEnabled: false,
        snapTolerancePx: 8,
        viewportScale: 1,
      });
      expect(snapped).toEqual({ x: 101, y: 0 });
    });

    it('scales tolerance by viewport zoom', () => {
      const project = projectWith([
        makeLine('A', { x: 0, y: 0 }, { x: 100, y: 0 }),
      ]);
      // At scale=4, 8px == 2mm world tolerance. A 5mm offset is outside it.
      const snapped = snapDroppedLineEndpoint({
        worldPoint: { x: 105, y: 0 },
        project,
        excludedLineEndpoints: new Set(['B.end']),
        snapEnabled: true,
        snapTolerancePx: 8,
        viewportScale: 4,
      });
      expect(snapped).toEqual({ x: 105, y: 0 });
    });

    it('snaps to a rectangle corner', () => {
      const project = projectWith([
        makeRect('R', { x: 0, y: 0 }, 100, 50),
      ]);
      const snapped = snapDroppedLineEndpoint({
        worldPoint: { x: 100.5, y: 49.5 },
        project,
        excludedLineEndpoints: new Set(['L.end']),
        snapEnabled: true,
        snapTolerancePx: 8,
        viewportScale: 1,
      });
      expect(snapped).toEqual({ x: 100, y: 50 });
    });
  });
});
