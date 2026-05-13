import { Group, Line as KLine, Circle, Text } from 'react-konva';
import { useProjectStore } from '@/state';
import type { ConnectionHover, UseConnectionDrawReturn } from './useConnectionDraw';

const flatPair = (a: { x: number; y: number }, b: { x: number; y: number }): number[] =>
  [a.x, a.y, b.x, b.y];

const HIGHLIGHT_A = '#2563eb';
const HIGHLIGHT_B = '#16a34a';
const HOVER = '#a855f7';

const edgeEnds = (surfaceId: string, edgeIndex: number) => {
  const project = useProjectStore.getState().project;
  const s = project.surfaces.find((s2) => s2.id === surfaceId);
  if (!s) return null;
  const a = s.outerBoundary[edgeIndex];
  const b = s.outerBoundary[(edgeIndex + 1) % s.outerBoundary.length];
  if (!a || !b) return null;
  return { a, b };
};

type ConnectionEdgePreviewProps = {
  phase: UseConnectionDrawReturn['phase'];
  hover: ConnectionHover;
};

export const ConnectionEdgePreview = ({ phase, hover }: ConnectionEdgePreviewProps) => {
  const nodes: React.ReactNode[] = [];

  if (phase.kind !== 'pickA') {
    const ends = edgeEnds(phase.surfaceAId, phase.edgeAIndex);
    if (ends) {
      nodes.push(
        <KLine
          key="a"
          points={flatPair(ends.a, ends.b)}
          stroke={HIGHLIGHT_A}
          strokeWidth={4}
          strokeScaleEnabled={false}
          listening={false}
        />,
      );
      nodes.push(
        <Text
          key="a-label"
          x={(ends.a.x + ends.b.x) / 2}
          y={(ends.a.y + ends.b.y) / 2 - 14}
          text="A"
          fontSize={12}
          fill={HIGHLIGHT_A}
          listening={false}
        />,
      );
    }
  }

  if (phase.kind === 'dialog') {
    const ends = edgeEnds(phase.surfaceBId, phase.edgeBIndex);
    if (ends) {
      nodes.push(
        <KLine
          key="b"
          points={flatPair(ends.a, ends.b)}
          stroke={HIGHLIGHT_B}
          strokeWidth={4}
          strokeScaleEnabled={false}
          listening={false}
        />,
      );
      nodes.push(
        <Text
          key="b-label"
          x={(ends.a.x + ends.b.x) / 2}
          y={(ends.a.y + ends.b.y) / 2 - 14}
          text="B"
          fontSize={12}
          fill={HIGHLIGHT_B}
          listening={false}
        />,
      );
    }
  }

  if (hover && phase.kind !== 'dialog') {
    const ends = edgeEnds(hover.surfaceId, hover.edgeIndex);
    if (ends) {
      nodes.push(
        <KLine
          key="hover"
          points={flatPair(ends.a, ends.b)}
          stroke={HOVER}
          strokeWidth={2}
          strokeScaleEnabled={false}
          dash={[6, 4]}
          dashEnabled
          listening={false}
        />,
      );
      nodes.push(
        <Circle
          key="hover-mid"
          x={hover.midpoint.x}
          y={hover.midpoint.y}
          radius={4}
          stroke={HOVER}
          strokeWidth={1.5}
          strokeScaleEnabled={false}
          listening={false}
        />,
      );
    }
  }

  return <Group listening={false}>{nodes}</Group>;
};
