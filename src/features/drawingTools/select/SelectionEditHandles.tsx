import { useRef } from 'react';
import { Circle, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  useProjectStore,
  useSelectionStore,
  useEditorStore,
} from '@/state';
import type {
  Point2D,
  LineEntity,
  RectangleEntity,
  PolygonEntity,
  Surface,
  Project,
} from '@/types';
import {
  dispatchCommand,
  updateDrawingEntityCommand,
  updateDrawingEntitiesCommand,
  updateSurfaceCommand,
} from '@/domain/commands';
import type { Command } from '@/domain/commands';
import { constrainAngle } from '@/domain/geometry';
import { snapDroppedLineEndpoint } from './endpointSnap';

type DragMods = { shift: boolean; alt: boolean; ctrl: boolean };

const readMods = (evt: MouseEvent | DragEvent | undefined): DragMods => ({
  shift: !!evt?.shiftKey,
  alt: !!evt?.altKey,
  ctrl: !!evt?.ctrlKey,
});

const HANDLE_RADIUS_PX = 6;
const JOINT_EPSILON_MM = 1e-3;

type LineEndRef = { entityId: string; which: 'start' | 'end' };

type DragKey =
  | { kind: 'lineEnd'; entityId: string; which: 'start' | 'end' }
  | { kind: 'lineJoint'; endpoints: LineEndRef[] }
  | { kind: 'rectCorner'; entityId: string; corner: 0 | 1 | 2 | 3 }
  | { kind: 'polygonVertex'; entityId: string; index: number }
  | { kind: 'surfaceVertex'; surfaceId: string; index: number };

type HandleSpec = {
  key: string;
  position: Point2D;
  drag: DragKey;
};

const computeRectAfterCornerMove = (
  rect: RectangleEntity,
  corner: 0 | 1 | 2 | 3,
  np: Point2D,
): { origin: Point2D; widthMm: number; heightMm: number } | null => {
  const x0 = rect.origin.x;
  const y0 = rect.origin.y;
  const x1 = x0 + rect.widthMm;
  const y1 = y0 + rect.heightMm;
  // corner: 0=topLeft, 1=topRight, 2=bottomRight, 3=bottomLeft
  let nx0 = x0;
  let ny0 = y0;
  let nx1 = x1;
  let ny1 = y1;
  if (corner === 0) {
    nx0 = np.x;
    ny0 = np.y;
  } else if (corner === 1) {
    nx1 = np.x;
    ny0 = np.y;
  } else if (corner === 2) {
    nx1 = np.x;
    ny1 = np.y;
  } else {
    nx0 = np.x;
    ny1 = np.y;
  }
  const minX = Math.min(nx0, nx1);
  const maxX = Math.max(nx0, nx1);
  const minY = Math.min(ny0, ny1);
  const maxY = Math.max(ny0, ny1);
  const w = maxX - minX;
  const h = maxY - minY;
  if (w <= 0 || h <= 0) return null;
  return { origin: { x: minX, y: minY }, widthMm: w, heightMm: h };
};

const DraggableHandle = ({
  spec,
  scale,
  onPreview,
  onCommit,
}: {
  spec: HandleSpec;
  scale: number;
  onPreview: (drag: DragKey, world: Point2D, mods: DragMods) => void;
  onCommit: (
    drag: DragKey,
    world: Point2D,
    mods: DragMods,
    startProject: Project | null,
  ) => void;
}) => {
  const startProjectRef = useRef<Project | null>(null);
  const isJoint = spec.drag.kind === 'lineJoint';
  const r = (isJoint ? HANDLE_RADIUS_PX + 1 : HANDLE_RADIUS_PX) / scale;
  return (
    <Circle
      x={spec.position.x}
      y={spec.position.y}
      radius={r}
      fill={isJoint ? '#fef3c7' : '#ffffff'}
      stroke={isJoint ? '#d97706' : '#2563eb'}
      strokeWidth={1.5}
      strokeScaleEnabled={false}
      draggable
      onMouseDown={(e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
      }}
      onDragStart={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        startProjectRef.current = useProjectStore.getState().project;
      }}
      onDragMove={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        onPreview(
          spec.drag,
          { x: e.target.x(), y: e.target.y() },
          readMods(e.evt),
        );
      }}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        onCommit(
          spec.drag,
          { x: e.target.x(), y: e.target.y() },
          readMods(e.evt),
          startProjectRef.current,
        );
        startProjectRef.current = null;
      }}
      onMouseEnter={(e: KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'grab';
      }}
      onMouseLeave={(e: KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = '';
      }}
    />
  );
};

export const SelectionEditHandles = () => {
  const selected = useSelectionStore((s) => s.selected);
  const project = useProjectStore((s) => s.project);
  const activeTool = useEditorStore((s) => s.activeTool);
  const scale = useEditorStore((s) => s.viewport.scale);

  if (activeTool !== 'select' || selected.length === 0) return null;

  const specs: HandleSpec[] = [];
  for (const entry of selected) {
    if (entry.kind === 'surface') {
      const s = project.surfaces.find((x) => x.id === entry.id);
      if (!s) continue;
      s.outerBoundary.forEach((p, i) =>
        specs.push({
          key: `sv:${s.id}:${i}`,
          position: p,
          drag: { kind: 'surfaceVertex', surfaceId: s.id, index: i },
        }),
      );
    } else if (entry.kind === 'line' || entry.kind === 'rectangle' || entry.kind === 'polygon') {
      const e = project.drawingEntities.find((x) => x.id === entry.id);
      if (!e) continue;
      if (e.type === 'line') {
        specs.push({
          key: `ls:${e.id}`,
          position: e.start,
          drag: { kind: 'lineEnd', entityId: e.id, which: 'start' },
        });
        specs.push({
          key: `le:${e.id}`,
          position: e.end,
          drag: { kind: 'lineEnd', entityId: e.id, which: 'end' },
        });
      } else if (e.type === 'rectangle') {
        const x0 = e.origin.x;
        const y0 = e.origin.y;
        const x1 = x0 + e.widthMm;
        const y1 = y0 + e.heightMm;
        const corners: Point2D[] = [
          { x: x0, y: y0 },
          { x: x1, y: y0 },
          { x: x1, y: y1 },
          { x: x0, y: y1 },
        ];
        corners.forEach((p, i) =>
          specs.push({
            key: `rc:${e.id}:${i}`,
            position: p,
            drag: { kind: 'rectCorner', entityId: e.id, corner: i as 0 | 1 | 2 | 3 },
          }),
        );
      } else {
        e.points.forEach((p, i) =>
          specs.push({
            key: `pv:${e.id}:${i}`,
            position: p,
            drag: { kind: 'polygonVertex', entityId: e.id, index: i },
          }),
        );
      }
    }
  }

  if (specs.length === 0) return null;

  // Merge coincident line endpoints (within JOINT_EPSILON_MM) into a single
  // 'lineJoint' handle that moves all linked endpoints together when dragged.
  const lineEndSpecs: HandleSpec[] = [];
  const otherSpecs: HandleSpec[] = [];
  for (const s of specs) {
    if (s.drag.kind === 'lineEnd') lineEndSpecs.push(s);
    else otherSpecs.push(s);
  }
  const usedLineEnd = new Set<number>();
  const mergedSpecs: HandleSpec[] = [];
  for (let i = 0; i < lineEndSpecs.length; i++) {
    if (usedLineEnd.has(i)) continue;
    const a = lineEndSpecs[i]!;
    const group: LineEndRef[] = [];
    const aDrag = a.drag as Extract<DragKey, { kind: 'lineEnd' }>;
    group.push({ entityId: aDrag.entityId, which: aDrag.which });
    for (let j = i + 1; j < lineEndSpecs.length; j++) {
      if (usedLineEnd.has(j)) continue;
      const b = lineEndSpecs[j]!;
      const dx = a.position.x - b.position.x;
      const dy = a.position.y - b.position.y;
      if (Math.hypot(dx, dy) <= JOINT_EPSILON_MM) {
        usedLineEnd.add(j);
        const bDrag = b.drag as Extract<DragKey, { kind: 'lineEnd' }>;
        group.push({ entityId: bDrag.entityId, which: bDrag.which });
      }
    }
    if (group.length > 1) {
      mergedSpecs.push({
        key: `lj:${group.map((g) => `${g.entityId}.${g.which}`).join(',')}`,
        position: a.position,
        drag: { kind: 'lineJoint', endpoints: group },
      });
    } else {
      mergedSpecs.push(a);
    }
  }
  const allSpecs = [...otherSpecs, ...mergedSpecs];

  // Build the Command that represents the move described by `drag`+`world`,
  // without applying it. Returns null when nothing should change.
  const buildCommand = (
    drag: DragKey,
    world: Point2D,
    mods: DragMods,
  ): Command | null => {
    const proj = useProjectStore.getState().project;
    if (drag.kind === 'lineEnd') {
      const e = proj.drawingEntities.find((x) => x.id === drag.entityId);
      if (!e || e.type !== 'line') return null;
      // Shift = ortho-snap the dragged endpoint relative to the fixed end
      // of the same line, matching the dashed-line preview shown during
      // initial drawing. Skip vertex-snap when Shift is held so the two
      // snaps don't fight each other.
      let resolved: Point2D;
      if (mods.shift) {
        const anchor = drag.which === 'start' ? e.end : e.start;
        resolved = constrainAngle(anchor, world);
      } else {
        const editor = useEditorStore.getState();
        resolved = snapDroppedLineEndpoint({
          worldPoint: world,
          project: proj,
          excludedLineEndpoints: new Set([`${drag.entityId}.${drag.which}`]),
          snapEnabled: editor.snapEnabled,
          snapTolerancePx: editor.snapTolerancePx,
          viewportScale: editor.viewport.scale,
        });
      }
      const patch: Partial<LineEntity> =
        drag.which === 'start' ? { start: resolved } : { end: resolved };
      return updateDrawingEntityCommand(
        { id: e.id, patch },
        'Move line endpoint',
      );
    } else if (drag.kind === 'lineJoint') {
      const editor = useEditorStore.getState();
      const excluded = new Set<string>(
        drag.endpoints.map((ep) => `${ep.entityId}.${ep.which}`),
      );
      const snapped = snapDroppedLineEndpoint({
        worldPoint: world,
        project: proj,
        excludedLineEndpoints: excluded,
        snapEnabled: editor.snapEnabled,
        snapTolerancePx: editor.snapTolerancePx,
        viewportScale: editor.viewport.scale,
      });
      const patches = drag.endpoints
        .map((ep) => {
          const e = proj.drawingEntities.find((x) => x.id === ep.entityId);
          if (!e || e.type !== 'line') return null;
          const patch: Partial<LineEntity> =
            ep.which === 'start' ? { start: snapped } : { end: snapped };
          return { id: ep.entityId, patch };
        })
        .filter((p): p is { id: string; patch: Partial<LineEntity> } => p !== null);
      if (patches.length === 0) return null;
      return updateDrawingEntitiesCommand({ patches }, 'Move line joint');
    } else if (drag.kind === 'rectCorner') {
      const e = proj.drawingEntities.find((x) => x.id === drag.entityId);
      if (!e || e.type !== 'rectangle') return null;
      const next = computeRectAfterCornerMove(e, drag.corner, world);
      if (!next) return null;
      const patch: Partial<RectangleEntity> = {
        origin: next.origin,
        widthMm: next.widthMm,
        heightMm: next.heightMm,
      };
      return updateDrawingEntityCommand(
        { id: e.id, patch },
        'Resize rectangle',
      );
    } else if (drag.kind === 'polygonVertex') {
      const e = proj.drawingEntities.find((x) => x.id === drag.entityId);
      if (!e || e.type !== 'polygon') return null;
      const nextPts = e.points.map((p, i) => (i === drag.index ? world : p));
      const patch: Partial<PolygonEntity> = { points: nextPts };
      return updateDrawingEntityCommand(
        { id: e.id, patch },
        'Move polygon vertex',
      );
    } else if (drag.kind === 'surfaceVertex') {
      const s = proj.surfaces.find((x) => x.id === drag.surfaceId);
      if (!s) return null;
      const nextPts = s.outerBoundary.map((p, i) =>
        i === drag.index ? world : p,
      );
      const patch: Partial<Surface> = { outerBoundary: nextPts };
      return updateSurfaceCommand({ id: s.id, patch }, 'Move surface vertex');
    }
    return null;
  };

  // Apply the in-progress drag to the project store WITHOUT pushing a history
  // entry. This lets the entity follow the drag handle visually while keeping
  // undo as a single step back to the pre-drag state.
  const onPreview = (drag: DragKey, world: Point2D, mods: DragMods) => {
    const cmd = buildCommand(drag, world, mods);
    if (!cmd) return;
    useProjectStore.setState((s) => ({
      ...s,
      project: cmd.apply(s.project),
      isDirty: true,
    }));
  };

  // Finalize the drag: first restore the project to the snapshot taken at
  // drag start so that dispatchCommand computes the inverse against the
  // original state, then dispatch a single command. This way undo reverts
  // the full move instead of only the last per-pixel preview step.
  const onCommit = (
    drag: DragKey,
    world: Point2D,
    mods: DragMods,
    startProject: Project | null,
  ) => {
    if (startProject) {
      useProjectStore.setState((s) => ({ ...s, project: startProject }));
    }
    const cmd = buildCommand(drag, world, mods);
    if (!cmd) return;
    dispatchCommand(cmd);
  };

  return (
    <Group listening>
      {allSpecs.map((spec) => (
        <DraggableHandle
          key={spec.key}
          spec={spec}
          scale={scale}
          onPreview={onPreview}
          onCommit={onCommit}
        />
      ))}
    </Group>
  );
};
