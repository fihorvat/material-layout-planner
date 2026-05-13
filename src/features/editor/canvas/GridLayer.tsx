import { Line, Group } from 'react-konva';
import { useEditorStore, useProjectStore, useThemeStore } from '@/state';
import { visibleWorldBounds } from './coords';

type GridLayerProps = {
  widthPx: number;
  heightPx: number;
};

const MAX_LINES_PER_AXIS = 400;

const GRID_COLORS = {
  light: { minor: '#e5e7eb', major: '#cbd5e1', axis: '#9ca3af' },
  dark: { minor: '#1f2a3d', major: '#334155', axis: '#64748b' },
} as const;

export const GridLayer = ({ widthPx, heightPx }: GridLayerProps) => {
  const viewport = useEditorStore((s) => s.viewport);
  const gridVisible = useEditorStore((s) => s.gridVisible);
  const gridSizeMm = useProjectStore((s) => s.project.settings.gridSizeMm);
  const theme = useThemeStore((s) => s.theme);
  const colors = GRID_COLORS[theme];
  if (!gridVisible || gridSizeMm <= 0) return null;

  const scale = viewport.scale;
  const minorPx = gridSizeMm * scale;
  const majorPx = minorPx * 5;
  const drawMinor = minorPx >= 4;
  const drawMajor = majorPx >= 4;
  if (!drawMinor && !drawMajor) return null;

  const bounds = visibleWorldBounds(viewport, widthPx, heightPx);
  const padding = gridSizeMm * 5;
  const minX = Math.floor((bounds.minX - padding) / gridSizeMm) * gridSizeMm;
  const maxX = Math.ceil((bounds.maxX + padding) / gridSizeMm) * gridSizeMm;
  const minY = Math.floor((bounds.minY - padding) / gridSizeMm) * gridSizeMm;
  const maxY = Math.ceil((bounds.maxY + padding) / gridSizeMm) * gridSizeMm;

  const lines: React.ReactNode[] = [];
  const stepsX = Math.ceil((maxX - minX) / gridSizeMm);
  const stepsY = Math.ceil((maxY - minY) / gridSizeMm);
  if (stepsX > MAX_LINES_PER_AXIS || stepsY > MAX_LINES_PER_AXIS) return null;

  for (let i = 0; i <= stepsX; i++) {
    const x = minX + i * gridSizeMm;
    const isMajor = Math.round(x / gridSizeMm) % 5 === 0;
    if (!isMajor && !drawMinor) continue;
    if (isMajor && !drawMajor) continue;
    lines.push(
      <Line
        key={`vx${i}`}
        points={[x, minY, x, maxY]}
        stroke={isMajor ? colors.major : colors.minor}
        strokeWidth={1}
        strokeScaleEnabled={false}
        listening={false}
      />,
    );
  }
  for (let j = 0; j <= stepsY; j++) {
    const y = minY + j * gridSizeMm;
    const isMajor = Math.round(y / gridSizeMm) % 5 === 0;
    if (!isMajor && !drawMinor) continue;
    if (isMajor && !drawMajor) continue;
    lines.push(
      <Line
        key={`hy${j}`}
        points={[minX, y, maxX, y]}
        stroke={isMajor ? colors.major : colors.minor}
        strokeWidth={1}
        strokeScaleEnabled={false}
        listening={false}
      />,
    );
  }

  return (
    <Group listening={false}>
      {lines}
      <Line
        points={[minX, 0, maxX, 0]}
        stroke={colors.axis}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Line
        points={[0, minY, 0, maxY]}
        stroke={colors.axis}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        listening={false}
      />
    </Group>
  );
};
