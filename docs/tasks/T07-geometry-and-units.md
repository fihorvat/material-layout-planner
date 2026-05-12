# T07 — Geometry utilities & unit parser

- **Milestone**: M2
- **Depends on**: T02
- **Status**: todo

## Goal

Build the pure geometry math used by every drawing tool, surface, opening, and the layout engine — plus the unit parser that turns user strings like "60 cm" into millimeters. All code lives in `src/domain/` and must be framework-free.

## Files

```
src/domain/units/parseLength.ts
src/domain/units/formatLength.ts
src/domain/units/__tests__/parseLength.test.ts
src/domain/units/__tests__/formatLength.test.ts

src/domain/geometry/point.ts
src/domain/geometry/line.ts
src/domain/geometry/polygon.ts
src/domain/geometry/rectangle.ts
src/domain/geometry/boundingBox.ts
src/domain/geometry/transform.ts
src/domain/geometry/clipping.ts
src/domain/geometry/polygonBoolean.ts
src/domain/geometry/offsetPolygon.ts
src/domain/geometry/validation.ts
src/domain/geometry/intersect.ts
src/domain/geometry/index.ts
src/domain/geometry/__tests__/*.test.ts (one per module above except index)
```

## Unit parser — `parseLength`

Signature:

```ts
export type ParsedLength = { mm: number };
export const parseLength = (
  input: string | number,
  opts?: { defaultUnit?: 'mm' | 'cm' | 'm' }
): ParsedLength;       // throws ParseLengthError on invalid input

export class ParseLengthError extends Error { code: 'empty' | 'nan' | 'negative' | 'unknownUnit' }
```

Accepts:

| Input | Internal value |
|---|---|
| `600` | `600` |
| `"600"` | `600` |
| `"600 mm"` | `600` |
| `"600mm"` | `600` |
| `"60 cm"` | `600` |
| `"0.6 m"` | `600` |
| `"2.3cm"` | `23` |
| `"3 mm"` | `3` |
| `" 1,5 m "` | `1500` (comma decimal allowed) |

Rules:

- Strip whitespace; reject empty string.
- Allow `,` or `.` as decimal separator.
- Allowed units: `mm`, `cm`, `m`. Case-insensitive.
- Default unit (when number-only) is `mm` unless `opts.defaultUnit` overrides.
- Negative numbers → throw `ParseLengthError('negative')`.
- Non-finite → throw `ParseLengthError('nan')`.
- Unknown unit (e.g., `in`) → throw `ParseLengthError('unknownUnit')`.

## `formatLength`

```ts
export const formatLength = (
  mm: number,
  opts?: { unit?: 'mm' | 'cm' | 'm' | 'auto'; decimals?: number }
): string;
```

- `auto`: pick the unit so the magnitude is ≥ 1 (e.g., `2300` → `2.3 m`; `230` → `23 cm`; `23` → `23 mm`).
- Default `decimals = 1` for mm/cm and `2` for m.
- Trailing zeroes trimmed.

## Geometry modules

### `point.ts`

- `add`, `sub`, `scale`, `dot`, `cross`, `length`, `lengthSq`, `distance`, `distanceSq`, `lerp(a,b,t)`, `equals(a,b, eps?)`, `rotate(p, angleDeg, origin?)`.

### `line.ts`

- `lineLength(line)`, `lineAngleDeg(line)`, `lineDirection(line)` (unit vector), `pointToLineDistance`, `closestPointOnSegment`, `segmentMidpoint`.

### `polygon.ts`

- `polygonArea(points)` (signed; positive = CCW).
- `polygonCentroid`.
- `polygonPerimeter`.
- `isClosed(points, eps?)` — true if first/last are within eps.
- `closePolygon(points)` — ensure last !== first.
- `pointInPolygon(p, points)` — ray casting, treats on-edge as inside.
- `polygonOrientation(points)` → `'cw' | 'ccw'`.
- `ensureCCW(points)` / `ensureCW(points)`.

### `rectangle.ts`

- `rectangleToPoints(origin, w, h, rotationDeg)` — returns 4 CCW points.
- `pointsToAabb(points)`.

### `boundingBox.ts`

- `Aabb = { minX, minY, maxX, maxY }`.
- `unionAabb`, `intersectAabb`, `aabbContainsPoint`, `aabbsIntersect`, `expandAabb(aabb, mm)`.

### `transform.ts`

- `Mat3 = readonly [number, number, number, number, number, number, number, number, number]` (row-major).
- `identity`, `translate`, `scale`, `rotate`, `multiply`, `applyTo(point)`.

### `intersect.ts`

- `segmentsIntersect(a1, a2, b1, b2)` returning `null | Point2D`.
- `selfIntersects(points)` — O(n²) acceptable for MVP polygon sizes.

### `validation.ts`

- `validatePolygon(points)` returns
  ```ts
  type PolygonValidation = {
    valid: boolean;
    issues: { code: 'tooFewPoints' | 'selfIntersecting' | 'degenerate' | 'zeroArea'; message: string }[];
  };
  ```

### `clipping.ts`

- Sutherland–Hodgman polygon clipping against a *convex* clip polygon (rectangles are sufficient for axis-aligned material rectangles): `clipPolygonToConvex(subject, clip)`.

### `polygonBoolean.ts`

- General polygon boolean ops (intersection, difference, union) for arbitrary simple polygons with holes.
- **Implementation**: use [`polygon-clipping`](https://www.npmjs.com/package/polygon-clipping) (MIT, ~12 KB). Install as a production dep.
- Wrap the library behind our types:

```ts
export const polygonIntersection = (a: Polygon, b: Polygon): Polygon[];
export const polygonDifference = (a: Polygon, b: Polygon): Polygon[];
export const polygonUnion = (a: Polygon, b: Polygon): Polygon[];

type Polygon = { outer: Point2D[]; holes?: Point2D[][] };
```

The MaterialLayout engine (T23) uses `polygonDifference` (visible = material ∩ surface; overlap = material − visible) and `polygonIntersection`.

### `offsetPolygon.ts`

- `offsetPolygon(points, distanceMm)` — positive distance inflates, negative deflates. Use the Clipper-style offset from `polygon-clipping`'s sibling `polygon-offset` or implement a simple miter-only offset for MVP (rectangles + simple polygons). Document the limitation.

## Implementation steps

1. Install dependency: `npm i polygon-clipping`. Add to T01's dep list retroactively.
2. Implement modules in order: `point` → `line` → `rectangle` → `polygon` → `boundingBox` → `transform` → `intersect` → `validation` → `clipping` → `polygonBoolean` → `offsetPolygon`.
3. Test exhaustively. Use `1e-6 mm` tolerance for floating comparisons.

## Decisions

- **Why a third-party clipper**: writing a correct general polygon boolean library is a multi-week project; `polygon-clipping` is small, MIT-licensed, well-tested, and used by Turf.js.
- **`polygonArea` is signed**: caller decides whether to take absolute value. Sign is also used to detect orientation.
- **Tolerance constant** `GEOMETRY_EPS = 1e-6` exported from `geometry/index.ts`; reuse in tests.
- **Angles in degrees** throughout the public API. Internal helpers may use radians; conversion via `degToRad`/`radToDeg` in `point.ts`.

## Open questions

_(none)_

## Required tests (must pass)

- `parseLength`: all rows in the parsing table + every error case.
- `formatLength`: `auto` picks correctly; rounding boundaries.
- `polygonArea`: square 100×100 → 10 000 mm².
- `pointInPolygon`: classic L-shape with a concave point.
- `selfIntersects`: bowtie returns true; convex polygon returns false.
- `clipPolygonToConvex`: rectangle clipped to itself returns the same rectangle (within EPS).
- `polygonDifference`: large rectangle minus smaller centered rectangle returns a polygon with a hole.
- `offsetPolygon`: 100×100 square offset by +10 → 120×120 centered.

## Acceptance criteria

- [ ] All required tests pass.
- [ ] No imports from React or any UI module.
- [ ] All functions documented in JSDoc with units and side-effect notes (these are the only JSDoc comments allowed by `conventions.md` §9 — they document *why* units matter, not *what* code does).
- [ ] `npm run lint`, `npm run typecheck`, `npm test -- src/domain` green.

## Verification

```
npm test -- src/domain/units src/domain/geometry
```

## Progress Log

### 2026-05-12 19:22 — Cascade
- status: review
- summary: implemented parseLength/formatLength and full geometry suite (point/line/polygon/rectangle/boundingBox/transform/intersect/validation/clipping/polygonBoolean via polygon-clipping/offsetPolygon); 72 tests pass
- commits: uncommitted
- next: tools T09-T14 will consume these
- blockers: none
