import { memo } from 'react';
import { Group, Line as KLine } from 'react-konva';
import {
  useConnectionToolStore,
  useEditorStore,
  useProjectStore,
  useSelectionStore,
} from '@/state';
import type { SurfaceConnection } from '@/types';
import { decodeEdgeId } from '@/domain/surfaces/connectSurfaces';

const COLORS: Record<SurfaceConnection['connectionType'], string> = {
  outsideCorner: '#2563eb',
  insideCorner: '#16a34a',
  flatContinuation: '#a855f7',
  mitreCut: '#dc2626',
  buttJoint: '#f97316',
  custom: '#64748b',
};

type EdgeGeom = { ax: number; ay: number; bx: number; by: number };

const edgeGeom = (
  surfaces: ReturnType<typeof useProjectStore.getState>['project']['surfaces'],
  edgeId: string,
): EdgeGeom | null => {
  const { surfaceId, edgeIndex } = decodeEdgeId(edgeId);
  const s = surfaces.find((x) => x.id === surfaceId);
  if (!s) return null;
  const a = s.outerBoundary[edgeIndex];
  const b = s.outerBoundary[(edgeIndex + 1) % s.outerBoundary.length];
  if (!a || !b) return null;
  return { ax: a.x, ay: a.y, bx: b.x, by: b.y };
};

export const shouldEnableConnectionHitTargets = (
  activeTool: ReturnType<typeof useEditorStore.getState>['activeTool'],
  selectionEntries: ReturnType<typeof useSelectionStore.getState>['selected'],
): boolean => {
  if (activeTool !== 'select') return true;
  return !selectionEntries.some((entry) => entry.kind === 'surface' || entry.kind === 'opening');
};

/**
 * Build a closed-triangle chevron centered on the edge midpoint, pointing
 * perpendicular to the edge. Returned points are in world coordinates;
 * Konva line scaling is disabled so size stays visually consistent on screen.
 */
const chevronPoints = (edge: EdgeGeom, sizeWorld: number): number[] => {
  const mx = (edge.ax + edge.bx) / 2;
  const my = (edge.ay + edge.by) / 2;
  const dx = edge.bx - edge.ax;
  const dy = edge.by - edge.ay;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return [];
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular pointing outward (rotated 90deg CCW).
  const nx = -uy;
  const ny = ux;
  const half = sizeWorld;
  // Tip away from the edge along the perpendicular, base flush to the edge.
  const tipX = mx + nx * half * 1.4;
  const tipY = my + ny * half * 1.4;
  const baseL = { x: mx + ux * half - nx * 0.2 * half, y: my + uy * half - ny * 0.2 * half };
  const baseR = { x: mx - ux * half - nx * 0.2 * half, y: my - uy * half - ny * 0.2 * half };
  return [tipX, tipY, baseL.x, baseL.y, baseR.x, baseR.y];
};

export const ConnectionVisualizer = memo(function ConnectionVisualizer() {
  const connections = useProjectStore((s) => s.project.surfaceConnections);
  const surfaces = useProjectStore((s) => s.project.surfaces);
  const scale = useEditorStore((s) => s.viewport.scale);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectionEntries = useSelectionStore((s) => s.selected);
  const selectConnection = useConnectionToolStore((s) => s.selectConnection);
  const setSelection = useSelectionStore((s) => s.select);
  const interactive = shouldEnableConnectionHitTargets(activeTool, selectionEntries);

  const selectedIds = new Set(
    selectionEntries.filter((e) => e.kind === 'connection').map((e) => e.id),
  );

  // Render chevrons ~10px tall regardless of zoom.
  const sizeWorld = 8 / Math.max(scale, 1e-9);

  return (
    <Group>
      {connections.map((c) => {
        const ea = edgeGeom(surfaces, c.edgeAId);
        const eb = edgeGeom(surfaces, c.edgeBId);
        if (!ea && !eb) return null;
        const color = COLORS[c.connectionType] ?? '#64748b';
        const selected = selectedIds.has(c.id);
        const onSelect = () => {
          setSelection({ kind: 'connection', id: c.id });
          selectConnection(c.id);
        };
        const elements: React.ReactNode[] = [];
        if (ea && eb) {
          elements.push(
            <KLine
              key={`link:${c.id}`}
              points={[
                (ea.ax + ea.bx) / 2,
                (ea.ay + ea.by) / 2,
                (eb.ax + eb.bx) / 2,
                (eb.ay + eb.by) / 2,
              ]}
              stroke="#dc2626"
              strokeWidth={selected ? 2.5 : 1.75}
              strokeScaleEnabled={false}
              dash={[7, 5]}
              dashEnabled
              lineCap="round"
              lineJoin="round"
              listening
              hitStrokeWidth={16}
              onClick={onSelect}
              onTap={onSelect}
            />,
          );
        }
        for (const [key, edge] of [
          ['a', ea],
          ['b', eb],
        ] as const) {
          if (!edge) continue;
          const pts = chevronPoints(edge, sizeWorld);
          if (pts.length === 0) continue;
          elements.push(
            <KLine
              key={`${key}:${c.id}`}
              points={pts}
              closed
              fill={color}
              stroke={selected ? '#dc2626' : '#0f172a'}
              strokeWidth={selected ? 2 : 0.75}
              strokeScaleEnabled={false}
              listening={interactive}
              onClick={onSelect}
              onTap={onSelect}
            />,
          );
        }
        return <Group key={c.id}>{elements}</Group>;
      })}
    </Group>
  );
});
