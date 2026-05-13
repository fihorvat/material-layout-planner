import { Group, Line as KLine, Text } from 'react-konva';
import type { Point2D, MaterialLayout, Material } from '@/types';
import { useProjectStore, useEditorStore, useThemeStore, type Theme } from '@/state';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';

const flat = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

const renderPiece = (
  layout: MaterialLayout,
  material: Material,
  pieceIdx: number,
  showLabels: boolean,
  theme: Theme,
) => {
  const piece = layout.pieces[pieceIdx]!;
  const fill = material.style.fillColor;
  const stroke = material.style.jointColor;
  const labelColor = themedShapeColor(material.style.labelColor, theme);
  return (
    <Group key={piece.id} listening>
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
      {showLabels ? (
        <Text
          x={piece.labelPosition.x}
          y={piece.labelPosition.y}
          text={piece.pieceCode}
          fontSize={10}
          fill={labelColor}
          listening={false}
        />
      ) : null}
    </Group>
  );
};

export const MaterialLayoutLayer = () => {
  const project = useProjectStore((s) => s.project);
  const scale = useEditorStore((s) => s.viewport.scale);
  const theme = useThemeStore((s) => s.theme);
  const showLabels = scale > 0.4;
  return (
    <Group>
      {project.materialLayouts.map((layout) => {
        const material = project.materials.find((m) => m.id === layout.materialId);
        if (!material) return null;
        return (
          <Group key={layout.id}>
            {layout.pieces.map((_, i) => renderPiece(layout, material, i, showLabels, theme))}
          </Group>
        );
      })}
    </Group>
  );
};
