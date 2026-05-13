import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createEmptyProject, defaultDrawingStyle } from '@/types';
import type {
  LineEntity,
  PolygonEntity,
  Project,
  RectangleEntity,
  Surface,
} from '@/types';
import { createSurface } from '@/domain/surfaces/createSurface';
import { useEditorStore, useSelectionStore } from '@/state';
import {
  collectShapeBoundingBoxes,
  collectShapeVertices,
  isDrawingModeActiveSnapshot,
  snapToBoundingBoxEdge,
} from '../drawingMode';

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

const makePoly = (id: string, points: { x: number; y: number }[]): PolygonEntity => ({
  id,
  type: 'polygon',
  points,
  showSegmentDimensions: true,
  showArea: false,
  style: defaultDrawingStyle(),
});

const projectWith = (
  entities: Project['drawingEntities'],
  surfaces: Surface[] = [],
): Project => ({
  ...createEmptyProject('p'),
  drawingEntities: entities,
  surfaces,
});

describe('drawingMode', () => {
  describe('collectShapeVertices', () => {
    it('returns line endpoints, rectangle corners, polygon vertices, and surface boundary', () => {
      const surface = createSurface({
        name: 'S',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 30 },
          { x: 0, y: 30 },
        ],
      });
      const project = projectWith(
        [
          makeLine('L', { x: 0, y: 0 }, { x: 100, y: 0 }),
          makeRect('R', { x: 10, y: 10 }, 20, 40),
          makePoly('P', [
            { x: 200, y: 0 },
            { x: 250, y: 50 },
            { x: 200, y: 50 },
          ]),
        ],
        [surface],
      );
      const pts = collectShapeVertices(project);
      // 2 (line) + 4 (rect) + 3 (poly) + 4 (surface outer) = 13
      expect(pts).toHaveLength(13);
      expect(pts).toContainEqual({ x: 100, y: 0 });
      expect(pts).toContainEqual({ x: 30, y: 50 });
      expect(pts).toContainEqual({ x: 250, y: 50 });
      expect(pts).toContainEqual({ x: 50, y: 30 });
    });
  });

  describe('collectShapeBoundingBoxes', () => {
    it('skips lines and returns axis-aligned bboxes for rectangles, polygons, surfaces', () => {
      const surface = createSurface({
        name: 'S',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 60 },
          { x: 0, y: 60 },
        ],
      });
      const project = projectWith(
        [
          makeLine('L', { x: 0, y: 0 }, { x: 100, y: 0 }),
          makeRect('R', { x: 10, y: 10 }, 20, 40),
          makePoly('P', [
            { x: 200, y: 0 },
            { x: 250, y: 50 },
            { x: 200, y: 50 },
          ]),
        ],
        [surface],
      );
      const bboxes = collectShapeBoundingBoxes(project);
      expect(bboxes).toHaveLength(3);
      const byId = new Map(bboxes.map((b) => [b.id, b.bbox] as const));
      expect(byId.get('rect:R')).toEqual({ minX: 10, minY: 10, maxX: 30, maxY: 50 });
      expect(byId.get('poly:P')).toEqual({ minX: 200, minY: 0, maxX: 250, maxY: 50 });
      expect(byId.get(`surf:${surface.id}`)).toEqual({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 60,
      });
    });
  });

  describe('snapToBoundingBoxEdge', () => {
    const bboxes = [
      { id: 'a', bbox: { minX: 0, minY: 0, maxX: 100, maxY: 60 } },
    ];

    it('projects a cursor just outside the left edge onto x=minX', () => {
      const p = snapToBoundingBoxEdge({ x: -1.5, y: 30 }, 3, bboxes);
      expect(p).toEqual({ x: 0, y: 30 });
    });

    it('projects a cursor just inside the top edge onto y=minY', () => {
      const p = snapToBoundingBoxEdge({ x: 40, y: 1 }, 3, bboxes);
      expect(p).toEqual({ x: 40, y: 0 });
    });

    it('clamps the projection to the edge segment endpoints', () => {
      // Above the top-left corner area: closest point is the corner (0,0).
      const p = snapToBoundingBoxEdge({ x: -2, y: -2 }, 5, bboxes);
      expect(p).toEqual({ x: 0, y: 0 });
    });

    it('returns null when no edge is within tolerance', () => {
      const p = snapToBoundingBoxEdge({ x: 500, y: 500 }, 3, bboxes);
      expect(p).toBeNull();
    });

    it('picks the nearest bbox edge across multiple bboxes', () => {
      const many = [
        { id: 'a', bbox: { minX: 0, minY: 0, maxX: 10, maxY: 10 } },
        { id: 'b', bbox: { minX: 100, minY: 100, maxX: 110, maxY: 110 } },
      ];
      const p = snapToBoundingBoxEdge({ x: 99.5, y: 105 }, 2, many);
      expect(p).toEqual({ x: 100, y: 105 });
    });
  });

  describe('isDrawingModeActiveSnapshot', () => {
    beforeEach(() => {
      useEditorStore.getState().resetForTests();
      useSelectionStore.getState().resetForTests();
    });
    afterEach(() => {
      useEditorStore.getState().resetForTests();
      useSelectionStore.getState().resetForTests();
    });

    it('is false when the toggle is off and nothing is selected', () => {
      expect(isDrawingModeActiveSnapshot()).toBe(false);
    });

    it('is true when the toolbar toggle is enabled', () => {
      useEditorStore.getState().setDrawingModeEnabled(true);
      expect(isDrawingModeActiveSnapshot()).toBe(true);
    });

    it('is true when any shape is selected, even with the toggle off', () => {
      useSelectionStore.getState().select({ kind: 'line', id: 'L' });
      expect(isDrawingModeActiveSnapshot()).toBe(true);
    });

    it('returns to false when the selection is cleared and the toggle is off', () => {
      useSelectionStore.getState().select({ kind: 'line', id: 'L' });
      useSelectionStore.getState().clear();
      expect(isDrawingModeActiveSnapshot()).toBe(false);
    });
  });
});
