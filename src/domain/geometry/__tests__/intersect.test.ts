import { describe, it, expect } from 'vitest';
import { segmentsIntersect, selfIntersects } from '../intersect';

describe('intersect', () => {
  it('crossing segments meet at center', () => {
    const hit = segmentsIntersect(
      { x: 0, y: 0 }, { x: 10, y: 10 },
      { x: 0, y: 10 }, { x: 10, y: 0 },
    );
    expect(hit).not.toBeNull();
    expect(hit!.x).toBeCloseTo(5, 9);
    expect(hit!.y).toBeCloseTo(5, 9);
  });

  it('non-crossing returns null', () => {
    const miss = segmentsIntersect(
      { x: 0, y: 0 }, { x: 10, y: 0 },
      { x: 0, y: 5 }, { x: 10, y: 5 },
    );
    expect(miss).toBeNull();
  });

  it('bowtie polygon self-intersects', () => {
    const bowtie = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ];
    expect(selfIntersects(bowtie)).toBe(true);
  });

  it('simple square does not self-intersect', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(selfIntersects(square)).toBe(false);
  });
});
