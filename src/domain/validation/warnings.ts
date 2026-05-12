export type WarningSeverity = 'info' | 'warning' | 'error';

export type WarningTarget =
  | { kind: 'surface'; id: string }
  | { kind: 'opening'; surfaceId: string; holeIndex: number }
  | { kind: 'piece'; layoutId: string; pieceId: string }
  | { kind: 'connection'; id: string }
  | { kind: 'material'; id: string }
  | { kind: 'pattern'; id: string };

export type Warning = {
  id: string;
  code: string;
  severity: WarningSeverity;
  message: string;
  target?: WarningTarget;
};

export const WARNING_MESSAGES: Record<string, string> = {
  'surface.notClosed': 'Surface boundary is not closed',
  'surface.selfIntersecting': 'Surface boundary self-intersects',
  'surface.holeOutside': 'Surface hole extends outside outer boundary',
  'surface.holesOverlap': 'Surface holes overlap',
  'surface.missingMaterial': 'Surface has no assigned material',
  'surface.missingPattern': 'Surface has no assigned placement pattern',
  'material.thicknessMissing': 'Material thickness must be greater than 0',
  'material.invalidJoint': 'Material default joint must be non-negative',
  'edge.overlapExceedsMax': 'Overlap may exceed material half-unit',
  'piece.belowMinWidth': 'Piece bounding width is below material minimum',
  'piece.belowMinHeight': 'Piece bounding height is below material minimum',
  'piece.tooThin': 'Piece smallest dimension is less than 10 mm',
  'piece.irregular': 'Piece has irregular shape',
  'connection.edgeLengthMismatch': 'Connected edges differ in length',
  'surfaces.overlap': 'Two surfaces overlap',
};
