import type { Point2D } from '@/types';
import { polygonArea } from './polygon';
import { selfIntersects } from './intersect';
import { GEOMETRY_EPS } from './point';

export type PolygonIssueCode =
  | 'tooFewPoints'
  | 'selfIntersecting'
  | 'degenerate'
  | 'zeroArea';

export type PolygonIssue = { code: PolygonIssueCode; message: string };

export type PolygonValidation = {
  valid: boolean;
  issues: PolygonIssue[];
};

export const validatePolygon = (points: readonly Point2D[]): PolygonValidation => {
  const issues: PolygonIssue[] = [];
  if (points.length < 3) {
    issues.push({ code: 'tooFewPoints', message: 'Polygon must have at least 3 points' });
  } else {
    const area = polygonArea(points);
    if (Math.abs(area) < GEOMETRY_EPS) {
      issues.push({ code: 'zeroArea', message: 'Polygon has zero area' });
    }
    if (selfIntersects(points)) {
      issues.push({ code: 'selfIntersecting', message: 'Polygon edges intersect' });
    }
  }
  return { valid: issues.length === 0, issues };
};
