import { describe, expect, it } from 'vitest';
import { screenToWorld, worldToScreen, screenDeltaToWorld } from '../coords';

describe('coords', () => {
  const v = { offsetXPx: 50, offsetYPx: 30, scale: 2 };

  it('worldToScreen and screenToWorld are inverses', () => {
    const p = { x: 100, y: 50 };
    const s = worldToScreen(p, v);
    const back = screenToWorld(s.x, s.y, v);
    expect(back.x).toBeCloseTo(p.x, 9);
    expect(back.y).toBeCloseTo(p.y, 9);
  });

  it('screenDeltaToWorld divides by scale', () => {
    const d = screenDeltaToWorld(10, 20, v);
    expect(d.dx).toBeCloseTo(5);
    expect(d.dy).toBeCloseTo(10);
  });

  it('zoom invariant: point under cursor stays put', () => {
    const cursor = { x: 200, y: 150 };
    const wBefore = screenToWorld(cursor.x, cursor.y, v);
    const newScale = v.scale * 1.5;
    const newOffsetX = cursor.x - (cursor.x - v.offsetXPx) * (newScale / v.scale);
    const newOffsetY = cursor.y - (cursor.y - v.offsetYPx) * (newScale / v.scale);
    const v2 = { offsetXPx: newOffsetX, offsetYPx: newOffsetY, scale: newScale };
    const wAfter = screenToWorld(cursor.x, cursor.y, v2);
    expect(wAfter.x).toBeCloseTo(wBefore.x);
    expect(wAfter.y).toBeCloseTo(wBefore.y);
  });
});
