import { useMemo } from 'react';
import { Group, Line as KLine, Text } from 'react-konva';
import type { Point2D, MaterialLayout, Material } from '@/types';
import { useProjectStore, useEditorStore, useThemeStore, type Theme } from '@/state';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { generateLayoutsForProject } from '@/domain/materialLayout/generateLayoutsForProject';

const flat = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

const NAME_FONT_PX = 16;
const DIM_FONT_PX = 13;
const LINE_GAP_PX = 18;
const APPROX_CHAR_WIDTH = 0.62;
const FIT_PADDING = 0.9;

const renderPiece = (
  layout: MaterialLayout,
  material: Material,
  pieceIdx: number,
  showLabels: boolean,
  theme: Theme,
  scale: number,
) => {
  const piece = layout.pieces[pieceIdx]!;
  const fill = material.style.fillColor;
  const stroke = material.style.jointColor;
  const labelColor = themedShapeColor(material.style.labelColor, theme);
  // fontSize on a scaled Konva stage is interpreted in world (mm) units.
  // Divide by viewport scale so labels render at a constant pixel size.
  const nameFont = NAME_FONT_PX / scale;
  const dimFont = DIM_FONT_PX / scale;
  const lineGap = LINE_GAP_PX / scale;

  const nameText = piece.pieceCode;
  const dimText = `${Math.round(piece.boundingWidthMm)} \u00D7 ${Math.round(piece.boundingHeightMm)} mm`;
  const nameWidthMm = nameText.length * nameFont * APPROX_CHAR_WIDTH;
  const dimWidthMm = dimText.length * dimFont * APPROX_CHAR_WIDTH;
  const availW = piece.boundingWidthMm * FIT_PADDING;
  const availH = piece.boundingHeightMm * FIT_PADDING;

  const fitsName = showLabels && nameWidthMm <= availW && nameFont <= availH;
  const fitsBoth =
    fitsName && dimWidthMm <= availW && nameFont + lineGap + dimFont / 2 <= availH;

  // Vertically center the label block at labelPosition.
  const cx = piece.labelPosition.x;
  const cy = piece.labelPosition.y;
  const nameY = fitsBoth ? cy - lineGap / 2 - nameFont / 2 : cy - nameFont / 2;
  const dimY = cy + lineGap / 2 - dimFont / 2;

  return (
    <Group key={`${layout.surfaceId}:${pieceIdx}`} listening>
      <KLine
        points={flat(piece.visiblePolygon)}
        closed
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        strokeScaleEnabled={false}
      />
      {piece.overlapPolygons.map((poly, i) => (
        <KLine
          key={`o${i}`}
          points={flat(poly)}
          closed
          fill={fill}
          opacity={0.25}
          stroke={stroke}
          strokeWidth={1}
          strokeScaleEnabled={false}
          dash={[3, 3]}
          dashEnabled
        />
      ))}
      {fitsName ? (
        <Text
          x={cx - nameWidthMm / 2}
          y={nameY}
          width={nameWidthMm}
          text={nameText}
          align="center"
          wrap="none"
          fontSize={nameFont}
          fontStyle="bold"
          fill={labelColor}
          listening={false}
        />
      ) : null}
      {fitsBoth ? (
        <Text
          x={cx - dimWidthMm / 2}
          y={dimY}
          width={dimWidthMm}
          text={dimText}
          align="center"
          wrap="none"
          fontSize={dimFont}
          fill={labelColor}
          listening={false}
        />
      ) : null}
    </Group>
  );
};

/**
 * Renders material pieces on top of surfaces. Layouts are auto-computed on
 * the fly for any surface that has both a material and a placement pattern
 * assigned, so the user sees the material laid out on the surface in real
 * time as soon as they assign one. When the optimizer has produced a
 * persisted layout that still matches the current surface/material/pattern
 * pair the persisted (optimized) version is preferred, otherwise a fresh
 * non-optimized preview is shown.
 */
export const MaterialLayoutLayer = () => {
  const project = useProjectStore((s) => s.project);
  const scale = useEditorStore((s) => s.viewport.scale);
  const theme = useThemeStore((s) => s.theme);
  const showLabels = scale > 0.4;

  const layouts = useMemo<MaterialLayout[]>(() => {
    const live = generateLayoutsForProject(project);
    const persistedBySurface = new Map<string, MaterialLayout>();
    for (const l of project.materialLayouts) persistedBySurface.set(l.surfaceId, l);
    return live.map((l) => {
      const persisted = persistedBySurface.get(l.surfaceId);
      // Prefer the optimizer-produced persisted layout, but only when its
      // snapshot still matches the live material / pattern / edge rules.
      // Comparing snapshot references (not just ids) lets the canvas refresh
      // immediately when the user edits pattern.type, material dimensions,
      // edge rules, etc. — the store produces new objects on every patch,
      // so a stale snapshot is detectable by referential inequality.
      if (
        persisted &&
        persisted.materialId === l.materialId &&
        persisted.placementPatternId === l.placementPatternId &&
        persisted.settingsSnapshot.material === l.settingsSnapshot.material &&
        persisted.settingsSnapshot.placementPattern === l.settingsSnapshot.placementPattern &&
        persisted.settingsSnapshot.edgeRules === l.settingsSnapshot.edgeRules
      ) {
        return persisted;
      }
      return l;
    });
  }, [project]);

  return (
    <Group>
      {layouts.map((layout) => {
        const material = project.materials.find((m) => m.id === layout.materialId);
        if (!material) return null;
        return (
          <Group key={`${layout.surfaceId}:${layout.materialId}:${layout.placementPatternId}`}>
            {layout.pieces.map((_, i) => renderPiece(layout, material, i, showLabels, theme, scale))}
          </Group>
        );
      })}
    </Group>
  );
};
