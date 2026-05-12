import type { Material, MaterialLayout, MaterialPiece } from '@/types';

export type CuttingUnit = {
  unitIndex: number;
  materialId: string;
  pieces: { pieceCode: string; pieceId: string; widthMm: number; heightMm: number; xMm: number; yMm: number }[];
};

export type CuttingDiagram = {
  materialId: string;
  units: CuttingUnit[];
  utilizationPercent: number;
};

const round01 = (n: number): number => Math.round(n * 10) / 10;

const fitsInUnit = (
  unit: CuttingUnit,
  material: Material,
  piece: { widthMm: number; heightMm: number },
): { xMm: number; yMm: number } | null => {
  if (piece.widthMm > material.unitWidthMm || piece.heightMm > material.unitHeightMm) return null;
  if (unit.pieces.length === 0) return { xMm: 0, yMm: 0 };
  // Naive row-based packing: stack pieces left-to-right, wrap rows.
  const sorted = [...unit.pieces].sort((a, b) => a.yMm - b.yMm || a.xMm - b.xMm);
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  for (const p of sorted) {
    if (p.yMm + p.heightMm > rowHeight) rowHeight = p.yMm + p.heightMm;
  }
  // Find rightmost used in bottom row.
  for (const p of sorted) {
    if (Math.abs(p.yMm - y) < 1e-6) {
      x = Math.max(x, p.xMm + p.widthMm);
    }
  }
  if (x + piece.widthMm <= material.unitWidthMm && y + piece.heightMm <= material.unitHeightMm) {
    return { xMm: x, yMm: y };
  }
  y = rowHeight;
  if (y + piece.heightMm <= material.unitHeightMm) {
    return { xMm: 0, yMm: y };
  }
  return null;
};

export const buildCuttingDiagram = (
  layout: MaterialLayout,
  material: Material,
): CuttingDiagram => {
  const sorted: MaterialPiece[] = [...layout.pieces].sort(
    (a, b) => b.boundingWidthMm * b.boundingHeightMm - a.boundingWidthMm * a.boundingHeightMm,
  );
  const units: CuttingUnit[] = [];
  for (const piece of sorted) {
    const w = round01(piece.boundingWidthMm);
    const h = round01(piece.boundingHeightMm);
    let placed = false;
    for (const unit of units) {
      const slot = fitsInUnit(unit, material, { widthMm: w, heightMm: h });
      if (slot) {
        unit.pieces.push({
          pieceCode: piece.pieceCode,
          pieceId: piece.id,
          widthMm: w,
          heightMm: h,
          xMm: slot.xMm,
          yMm: slot.yMm,
        });
        placed = true;
        break;
      }
    }
    if (!placed) {
      const newUnit: CuttingUnit = {
        unitIndex: units.length,
        materialId: material.id,
        pieces: [
          {
            pieceCode: piece.pieceCode,
            pieceId: piece.id,
            widthMm: w,
            heightMm: h,
            xMm: 0,
            yMm: 0,
          },
        ],
      };
      units.push(newUnit);
    }
  }
  const used = layout.pieces.reduce((acc, p) => acc + p.boundingWidthMm * p.boundingHeightMm, 0);
  const total = units.length * material.unitWidthMm * material.unitHeightMm;
  const utilizationPercent = total > 0 ? (used / total) * 100 : 0;
  return {
    materialId: material.id,
    units,
    utilizationPercent,
  };
};
