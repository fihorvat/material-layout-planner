export {
  GEOMETRY_EPS,
  degToRad,
  radToDeg,
  add,
  sub,
  scale,
  dot,
  cross,
  length,
  distance,
  lerp,
  equals,
  rotate,
  normalize,
  constrainAngle,
} from './point';

export {
  lineLength,
  lineAngleDeg,
  lineDirection,
  segmentMidpoint,
  closestPointOnSegment,
  pointToLineDistance,
  closestEdgeOfPoints,
  type Segment,
  type ClosestEdgeResult,
} from './line';

export {
  polygonArea,
  polygonPerimeter,
  polygonCentroid,
  isClosed,
  closePolygon,
  pointInPolygon,
  polygonOrientation,
  ensureCCW,
  ensureCW,
} from './polygon';

export { rectangleToPoints, pointsToAabb } from './rectangle';

export {
  unionAabb,
  intersectAabb,
  aabbContainsPoint,
  aabbsIntersect,
  expandAabb,
  type Aabb,
} from './boundingBox';

export {
  identity,
  translate,
  scaleMat,
  rotateMat,
  multiply,
  applyTo,
  type Mat3,
} from './transform';

export { segmentsIntersect, selfIntersects } from './intersect';

export {
  validatePolygon,
  type PolygonValidation,
  type PolygonIssue,
  type PolygonIssueCode,
} from './validation';

export { clipPolygonToConvex } from './clipping';

export {
  polygonIntersection,
  polygonDifference,
  polygonUnion,
  type Polygon,
} from './polygonBoolean';

export { offsetPolygon } from './offsetPolygon';
