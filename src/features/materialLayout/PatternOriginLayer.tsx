import { useMemo, useRef } from 'react';
import { Group, Circle, Line as KLine } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useProjectStore, useEditorStore } from '@/state';
import { dispatchCommand, updatePlacementPatternCommand } from '@/domain/commands';
import { computeEffectivePatternOrigin, snapOffset } from '@/domain/placementPatterns/manualOffset';
import type { PlacementPattern, Surface, Point2D } from '@/types';

type Handle = {
  surface: Surface;
  pattern: PlacementPattern;
  origin: Point2D;
  materialId: string | null;
};

const HANDLE_RADIUS_PX = 8;
const CROSSHAIR_LEN_PX = 14;

const PatternOriginHandle = ({ handle, scale }: { handle: Handle; scale: number }) => {
  const groupRef = useRef<Konva.Group | null>(null);
  const startRef = useRef<Point2D | null>(null);
  const draggable = useEditorStore((s) => s.activeTool === 'patternOrigin');
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const project = useProjectStore.getState();

  // Convert handle visual sizes from px to mm so they stay visually constant at any zoom.
  const r = HANDLE_RADIUS_PX / scale;
  const ch = CROSSHAIR_LEN_PX / scale;
  const strokeWidth = 1.5 / scale;

  const commit = (rawDelta: Point2D, persist: boolean) => {
    const material = project.project.materials.find((m) => m.id === handle.materialId) ?? null;
    const snapped = snapOffset(
      rawDelta,
      snapEnabled ? '5mm' : 'none',
      handle.pattern,
      material,
    );
    const nextOffsetX = handle.pattern.offsetXmm + snapped.x;
    const nextOffsetY = handle.pattern.offsetYmm + snapped.y;
    if (persist) {
      if (nextOffsetX === handle.pattern.offsetXmm && nextOffsetY === handle.pattern.offsetYmm) {
        return;
      }
      dispatchCommand(
        updatePlacementPatternCommand(
          {
            id: handle.pattern.id,
            patch: { offsetXmm: nextOffsetX, offsetYmm: nextOffsetY },
          },
          `Move pattern origin (${handle.pattern.name})`,
        ),
      );
    } else if (groupRef.current) {
      // Live preview: snap the visual handle to the snapped position without dispatching.
      const baseX = handle.origin.x - handle.pattern.offsetXmm;
      const baseY = handle.origin.y - handle.pattern.offsetYmm;
      groupRef.current.position({ x: baseX + nextOffsetX, y: baseY + nextOffsetY });
    }
  };

  return (
    <Group
      ref={groupRef}
      x={handle.origin.x}
      y={handle.origin.y}
      draggable={draggable}
      listening={draggable}
      onDragStart={(e: KonvaEventObject<DragEvent>) => {
        startRef.current = { x: e.target.x(), y: e.target.y() };
      }}
      onDragMove={(e: KonvaEventObject<DragEvent>) => {
        if (!startRef.current) return;
        commit({ x: e.target.x() - startRef.current.x, y: e.target.y() - startRef.current.y }, false);
      }}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        if (!startRef.current) return;
        commit(
          { x: e.target.x() - startRef.current.x, y: e.target.y() - startRef.current.y },
          true,
        );
        startRef.current = null;
      }}
    >
      <Circle
        radius={r}
        fill="#fef3c7"
        stroke="#b45309"
        strokeWidth={strokeWidth}
        strokeScaleEnabled={false}
        opacity={draggable ? 1 : 0.7}
      />
      <KLine
        points={[-ch, 0, ch, 0]}
        stroke="#b45309"
        strokeWidth={strokeWidth}
        strokeScaleEnabled={false}
      />
      <KLine
        points={[0, -ch, 0, ch]}
        stroke="#b45309"
        strokeWidth={strokeWidth}
        strokeScaleEnabled={false}
      />
    </Group>
  );
};

export const PatternOriginLayer = () => {
  const surfaces = useProjectStore((s) => s.project.surfaces);
  const patterns = useProjectStore((s) => s.project.placementPatterns);
  const activeTool = useEditorStore((s) => s.activeTool);
  const scale = useEditorStore((s) => s.viewport.scale);

  const handles = useMemo<Handle[]>(() => {
    const out: Handle[] = [];
    for (const surface of surfaces) {
      if (!surface.placementPatternId) continue;
      const pattern = patterns.find((p) => p.id === surface.placementPatternId);
      if (!pattern) continue;
      out.push({
        surface,
        pattern,
        origin: computeEffectivePatternOrigin(pattern, surface),
        materialId: surface.materialId,
      });
    }
    return out;
  }, [surfaces, patterns]);

  if (activeTool !== 'patternOrigin' || handles.length === 0) return null;

  return (
    <Group listening>
      {handles.map((h) => (
        <PatternOriginHandle key={`${h.surface.id}:${h.pattern.id}`} handle={h} scale={scale} />
      ))}
    </Group>
  );
};
