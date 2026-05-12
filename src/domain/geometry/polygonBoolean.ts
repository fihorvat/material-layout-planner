import type { Point2D } from '@/types';
import polygonClipping from 'polygon-clipping';

export type Polygon = { outer: Point2D[]; holes?: Point2D[][] };

type PCPair = [number, number];
type PCRing = PCPair[];
type PCPolygon = PCRing[];
type PCMultiPolygon = PCPolygon[];

const toPCRing = (points: readonly Point2D[]): PCRing => {
  const ring: PCRing = points.map((p) => [p.x, p.y] as PCPair);
  if (ring.length > 0) {
    const first = ring[0]!;
    const last = ring[ring.length - 1]!;
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]]);
    }
  }
  return ring;
};

const toPCPolygon = (poly: Polygon): PCPolygon => {
  const rings: PCRing[] = [toPCRing(poly.outer)];
  if (poly.holes) {
    for (const h of poly.holes) rings.push(toPCRing(h));
  }
  return rings;
};

const fromPCRing = (ring: PCRing): Point2D[] => {
  const out: Point2D[] = [];
  for (let i = 0; i < ring.length; i++) {
    if (i === ring.length - 1 && ring.length > 1) {
      const first = ring[0]!;
      const last = ring[i]!;
      if (first[0] === last[0] && first[1] === last[1]) break;
    }
    const p = ring[i]!;
    out.push({ x: p[0], y: p[1] });
  }
  return out;
};

const fromPCMulti = (multi: PCMultiPolygon): Polygon[] => {
  const out: Polygon[] = [];
  for (const poly of multi) {
    const rings = poly;
    if (rings.length === 0) continue;
    const outer = fromPCRing(rings[0]!);
    const holes = rings.slice(1).map(fromPCRing);
    out.push({ outer, holes: holes.length > 0 ? holes : undefined });
  }
  return out;
};

export const polygonIntersection = (a: Polygon, b: Polygon): Polygon[] => {
  const result = polygonClipping.intersection(toPCPolygon(a), toPCPolygon(b)) as PCMultiPolygon;
  return fromPCMulti(result);
};

export const polygonDifference = (a: Polygon, b: Polygon): Polygon[] => {
  const result = polygonClipping.difference(toPCPolygon(a), toPCPolygon(b)) as PCMultiPolygon;
  return fromPCMulti(result);
};

export const polygonUnion = (a: Polygon, b: Polygon): Polygon[] => {
  const result = polygonClipping.union(toPCPolygon(a), toPCPolygon(b)) as PCMultiPolygon;
  return fromPCMulti(result);
};
