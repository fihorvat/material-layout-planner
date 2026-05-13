import type { Surface } from '@/types';
import {
  validatePolygon,
  pointInPolygon,
  aabbsIntersect,
  pointsToAabb,
} from '@/domain/geometry';

type SurfaceIssueCode =
  | 'outerSelfIntersecting'
  | 'outerTooFewPoints'
  | 'outerDegenerate'
  | 'holeOutsideOuter'
  | 'holeSelfIntersecting'
  | 'holesOverlap';

type SurfaceValidation = {
  valid: boolean;
  issues: { code: SurfaceIssueCode; message: string; holeIndex?: number }[];
};

export const validateSurface = (s: Surface): SurfaceValidation => {
  const issues: SurfaceValidation['issues'] = [];

  const outerVal = validatePolygon(s.outerBoundary);
  if (!outerVal.valid) {
    for (const iss of outerVal.issues) {
      if (iss.code === 'selfIntersecting') {
        issues.push({ code: 'outerSelfIntersecting', message: 'Outer boundary self-intersects' });
      } else if (iss.code === 'tooFewPoints') {
        issues.push({ code: 'outerTooFewPoints', message: 'Outer boundary needs 3+ points' });
      } else {
        issues.push({ code: 'outerDegenerate', message: 'Outer boundary is degenerate' });
      }
    }
  }

  for (let i = 0; i < s.holes.length; i++) {
    const hole = s.holes[i]!;
    const hv = validatePolygon(hole);
    if (!hv.valid) {
      issues.push({ code: 'holeSelfIntersecting', message: `Hole ${i} self-intersects`, holeIndex: i });
      continue;
    }
    for (const p of hole) {
      if (!pointInPolygon(p, s.outerBoundary)) {
        issues.push({ code: 'holeOutsideOuter', message: `Hole ${i} extends outside outer boundary`, holeIndex: i });
        break;
      }
    }
  }

  for (let i = 0; i < s.holes.length; i++) {
    const a = s.holes[i]!;
    const aBox = pointsToAabb(a);
    for (let j = i + 1; j < s.holes.length; j++) {
      const b = s.holes[j]!;
      const bBox = pointsToAabb(b);
      if (aabbsIntersect(aBox, bBox)) {
        const overlap = a.some((p) => pointInPolygon(p, b)) || b.some((p) => pointInPolygon(p, a));
        if (overlap) {
          issues.push({ code: 'holesOverlap', message: `Holes ${i} and ${j} overlap`, holeIndex: i });
          break;
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
};
