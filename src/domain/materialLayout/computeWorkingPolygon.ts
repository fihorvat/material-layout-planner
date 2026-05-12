import type { Surface, SurfaceConnection, Point2D } from '@/types';
import type { Polygon } from '@/domain/geometry';
import { polygonUnion } from '@/domain/geometry';
import { getEffectiveEdgeRule } from '@/domain/surfaces/edgeRules';

export type WorkingPolygonResult = { visible: Polygon; physical: Polygon };

export const computeWorkingPolygon = (input: {
  surface: Surface;
  connections: SurfaceConnection[];
}): WorkingPolygonResult => {
  const { surface, connections } = input;
  const visible: Polygon = {
    outer: surface.outerBoundary,
    holes: surface.holes.length > 0 ? surface.holes : undefined,
  };
  const pts = surface.outerBoundary;
  const expansions: Polygon[] = [];
  for (let i = 0; i < pts.length; i++) {
    const rule = getEffectiveEdgeRule(surface, i, connections);
    if (
      (rule.ruleType !== 'physicalOverlap' && rule.ruleType !== 'connectedOverlap') ||
      rule.maxOverlapMm <= 0
    ) {
      continue;
    }
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    // Outward normal for CCW polygon (y-down): rotate edge dir by -90deg.
    const nx = dy / len;
    const ny = -dx / len;
    const off = rule.maxOverlapMm;
    const quad: Point2D[] = [
      a,
      b,
      { x: b.x + nx * off, y: b.y + ny * off },
      { x: a.x + nx * off, y: a.y + ny * off },
    ];
    expansions.push({ outer: quad });
  }

  let physical: Polygon = visible;
  for (const exp of expansions) {
    const merged = polygonUnion(physical, exp);
    if (merged[0]) physical = merged[0];
  }
  return { visible, physical };
};
