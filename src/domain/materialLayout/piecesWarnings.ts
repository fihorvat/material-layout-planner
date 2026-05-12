import type { MaterialLayout, Material, MaterialPieceWarning } from '@/types';

export const piecesWarnings = (
  layout: MaterialLayout,
  material: Material,
): { layoutId: string; pieceId: string; warnings: MaterialPieceWarning[] }[] => {
  const out: { layoutId: string; pieceId: string; warnings: MaterialPieceWarning[] }[] = [];
  for (const piece of layout.pieces) {
    const w: MaterialPieceWarning[] = [];
    if (piece.boundingWidthMm < material.minPieceWidthMm) {
      w.push({ code: 'piece.belowMinWidth', messageKey: 'piece.belowMinWidth', severity: 'warning' });
    }
    if (piece.boundingHeightMm < material.minPieceHeightMm) {
      w.push({ code: 'piece.belowMinHeight', messageKey: 'piece.belowMinHeight', severity: 'warning' });
    }
    if (Math.min(piece.boundingWidthMm, piece.boundingHeightMm) < 10) {
      w.push({ code: 'piece.tooThin', messageKey: 'piece.tooThin', severity: 'warning' });
    }
    if (piece.isIrregular) {
      w.push({ code: 'piece.irregular', messageKey: 'piece.irregular', severity: 'info' });
    }
    if (w.length > 0) out.push({ layoutId: layout.id, pieceId: piece.id, warnings: w });
  }
  return out;
};
