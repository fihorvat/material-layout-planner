import { describe, expect, it } from 'vitest';
import { makeConnection, validateConnection, encodeEdgeId, decodeEdgeId } from '../connectSurfaces';
import { createSurface } from '../createSurface';

const s = (id: string) => ({
  ...createSurface({
    name: id,
    outerBoundary: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
  }),
  id,
});

describe('connectSurfaces', () => {
  it('encode/decode edge id roundtrips', () => {
    const id = encodeEdgeId('srf_X', 2);
    expect(decodeEdgeId(id)).toEqual({ surfaceId: 'srf_X', edgeIndex: 2 });
  });

  it('makeConnection sets defaults', () => {
    const c = makeConnection({
      surfaceAId: 'A',
      edgeAIndex: 0,
      surfaceBId: 'B',
      edgeBIndex: 0,
      connectionType: 'outsideCorner',
    });
    expect(c.angleDeg).toBe(90);
    expect(c.allowPatternContinuation).toBe(false);
  });

  it('validates same-surface connection rejection', () => {
    const v = validateConnection([s('A')], [], {
      surfaceAId: 'A',
      edgeAIndex: 0,
      surfaceBId: 'A',
      edgeBIndex: 1,
      connectionType: 'outsideCorner',
    });
    expect(v.valid).toBe(false);
    expect(v.issues.some((i) => i.code === 'sameSurface')).toBe(true);
  });

  it('detects edge length mismatch warning', () => {
    const A = s('A');
    const B = {
      ...createSurface({
        name: 'B',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 200, y: 0 },
          { x: 200, y: 100 },
          { x: 0, y: 100 },
        ],
      }),
      id: 'B',
    };
    const v = validateConnection([A, B], [], {
      surfaceAId: 'A',
      edgeAIndex: 0,
      surfaceBId: 'B',
      edgeBIndex: 0,
      connectionType: 'outsideCorner',
    });
    expect(v.valid).toBe(true);
    expect(v.warnings.some((w) => w.code === 'edgeLengthMismatch')).toBe(true);
  });
});
