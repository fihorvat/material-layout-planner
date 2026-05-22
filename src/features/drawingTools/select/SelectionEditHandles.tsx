import { useRef, useState } from 'react';
import { Circle, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  useProjectStore,
  useSelectionStore,
  useEditorStore,
  useSelectedVertexStore,
  sameSelectedVertex,
  type SelectedVertex,
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
  updateOpeningCommand,
  findOpeningSurface,
} from '@/domain/commands';
import type { Command } from '@/domain/commands';
import { constrainAngle } from '@/domain/geometry';
import { snap } from '@/features/editor/canvas/snap';
import { snapDroppedLineEndpoint } from './endpointSnap';
import { OrthoMeasureGuides } from '@/features/drawingTools/OrthoMeasureGuides';
import { useSelectionMovePreviewStore } from './SelectionMoveGuides';

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
  | { kind: 'surfaceVertex'; surfaceId: string; index: number }
  | { kind: 'openingVertex'; surfaceId: string; openingId: string; index: number };

type HandleSpec = {
  key: string;
  position: Point2D;
  drag: DragKey;
};

const toSelectedVertex = (drag: DragKey): SelectedVertex | null => {
  if (drag.kind === 'rectCorner') {
    return { kind: 'rectCorner', entityId: drag.entityId, corner: drag.corner };
  }
  if (drag.kind === 'polygonVertex') {
    return { kind: 'polygonVertex', entityId: drag.entityId, index: drag.index };
  }
  if (drag.kind === 'surfaceVertex') {
    return { kind: 'surfaceVertex', surfaceId: drag.surfaceId, index: drag.index };
  }
  if (drag.kind === 'openingVertex') {
    return {
      kind: 'openingVertex',
      surfaceId: drag.surfaceId,
      openingId: drag.openingId,
      index: drag.index,
    };
  }
  return null;
};

// Collect every vertex point in the project that the user might want to
// snap onto when dragging a handle, while excluding the entity / vertex
// currently being dragged so it can't snap to itself.
const collectVertexSnapCandidates = (project: Project, exclude: DragKey): Point2D[] => {
  const pts: Point2D[] = [];
  for (const e of project.drawingEntities) {
    if (e.type === 'line') {
      const excludeStart =
        exclude.kind === 'lineEnd' && exclude.entityId === e.id && exclude.which === 'start';
      const excludeEnd =
        exclude.kind === 'lineEnd' && exclude.entityId === e.id && exclude.which === 'end';
      const inJoint =
        exclude.kind === 'lineJoint' &&
        exclude.endpoints.some((ep) => ep.entityId === e.id);
      if (!excludeStart && !(inJoint && exclude.kind === 'lineJoint' && exclude.endpoints.some((ep) => ep.entityId === e.id && ep.which === 'start'))) {
        pts.push(e.start);
      }
      if (!excludeEnd && !(inJoint && exclude.kind === 'lineJoint' && exclude.endpoints.some((ep) => ep.entityId === e.id && ep.which === 'end'))) {
        pts.push(e.end);
      }
    } else if (e.type === 'rectangle') {
      const isSelf = exclude.kind === 'rectCorner' && exclude.entityId === e.id;
      if (!isSelf) {
        pts.push(
          { x: e.origin.x, y: e.origin.y },
          { x: e.origin.x + e.widthMm, y: e.origin.y },
          { x: e.origin.x + e.widthMm, y: e.origin.y + e.heightMm },
          { x: e.origin.x, y: e.origin.y + e.heightMm },
        );
      }
    } else if (e.type === 'polygon') {
      const isSelf = exclude.kind === 'polygonVertex' && exclude.entityId === e.id;
      if (!isSelf) pts.push(...e.points);
    }
  }
  for (const s of project.surfaces) {
    const skipOuter = exclude.kind === 'surfaceVertex' && exclude.surfaceId === s.id;
    if (!skipOuter) pts.push(...s.outerBoundary);
    for (let i = 0; i < s.holes.length; i++) {
      const meta = s.holeMeta[i];
      const skipHole =
        exclude.kind === 'openingVertex' &&
        exclude.surfaceId === s.id &&
        meta?.id === exclude.openingId;
      if (!skipHole) pts.push(...(s.holes[i] ?? []));
    }
  }
  return pts;
};

// Resolve a dragged handle's raw cursor position onto a snap target
// (endpoint / vertex / grid) so resize gestures align with surrounding
// geometry. `Alt` disables snap, `Shift` is reserved for ortho-snap which
// the caller applies separately.
const resolveVertexSnap = (world: Point2D, drag: DragKey, mods: DragMods): Point2D => {
  if (mods.alt) return world;
  const editor = useEditorStore.getState();
  if (!editor.snapEnabled) return world;
  const project = useProjectStore.getState().project;
  const candidates = collectVertexSnapCandidates(project, drag);
  const result = snap({
    worldPoint: world,
    tolerancePx: editor.snapTolerancePx,
    scale: editor.viewport.scale,
    gridSizeMm: project.settings.gridSizeMm,
    snapEnabled: true,
    snapModes: ['point', 'grid'],
    candidatePoints: candidates,
  });
  return result.point;
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
  isActive,
  onActivate,
  onPreview,
  onCommit,
  onDragVisualChange,
}: {
  spec: HandleSpec;
  scale: number;
  isActive: boolean;
  onActivate: (vertex: SelectedVertex) => void;
  onPreview: (drag: DragKey, world: Point2D, mods: DragMods) => Point2D | null;
  onCommit: (
    drag: DragKey,
    world: Point2D,
    mods: DragMods,
    startProject: Project | null,
  ) => Point2D | null;
  /** Notify the parent of the in-flight handle position so it can render
   *  live distance guides. Pass null on drag-end to clear them. */
  onDragVisualChange: (pos: Point2D | null) => void;
}) => {
  const startProjectRef = useRef<Project | null>(null);
  const isJoint = spec.drag.kind === 'lineJoint';
  const r = (isJoint ? HANDLE_RADIUS_PX + 1 : HANDLE_RADIUS_PX) / scale;
  const vertexSelection = toSelectedVertex(spec.drag);
  const fill = isActive ? '#fef3c7' : isJoint ? '#fef3c7' : '#ffffff';
  const stroke = isActive ? '#d97706' : isJoint ? '#d97706' : '#2563eb';
  return (
    <Circle
      x={spec.position.x}
      y={spec.position.y}
      radius={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={1.5}
      strokeScaleEnabled={false}
      draggable
      onMouseDown={(e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        if (vertexSelection) onActivate(vertexSelection);
      }}
      onDragStart={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        if (vertexSelection) onActivate(vertexSelection);
        startProjectRef.current = useProjectStore.getState().project;
        onDragVisualChange({ x: e.target.x(), y: e.target.y() });
      }}
      onDragMove={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const visual = onPreview(
          spec.drag,
          { x: e.target.x(), y: e.target.y() },
          readMods(e.evt),
        );
        // Override the konva-driven cursor position with the resolved
        // snap point so the handle (and rubber-banded shape) visibly
        // snap together while Shift is held.
        if (visual && (visual.x !== e.target.x() || visual.y !== e.target.y())) {
          e.target.position(visual);
        }
        onDragVisualChange(visual ?? { x: e.target.x(), y: e.target.y() });
      }}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const visual = onCommit(
          spec.drag,
          { x: e.target.x(), y: e.target.y() },
          readMods(e.evt),
          startProjectRef.current,
        );
        if (visual && (visual.x !== e.target.x() || visual.y !== e.target.y())) {
          e.target.position(visual);
        }
        startProjectRef.current = null;
        onDragVisualChange(null);
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
  const selectedVertex = useSelectedVertexStore((s) => s.selectedVertex);
  const selectVertex = useSelectedVertexStore((s) => s.selectVertex);
  const preview = useSelectionMovePreviewStore((s) => s.preview);
  // Position of the currently-dragging handle, used to render live
  // distance guides (OrthoMeasureGuides) while the user resizes a shape.
  // `null` when no handle is being dragged.
  const [dragPos, setDragPos] = useState<Point2D | null>(null);

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
    } else if (entry.kind === 'opening') {
      const found = findOpeningSurface(project, entry.id);
      if (!found) continue;
      const hole = found.surface.holes[found.index];
      if (!hole) continue;
      hole.forEach((p, i) =>
        specs.push({
          key: `ov:${found.surface.id}:${entry.id}:${i}`,
          position: p,
          drag: {
            kind: 'openingVertex',
            surfaceId: found.surface.id,
            openingId: entry.id,
            index: i,
          },
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
  const allSpecs = [...otherSpecs, ...mergedSpecs].map((spec) => ({
    ...spec,
    position: preview
      ? { x: spec.position.x + preview.dx, y: spec.position.y + preview.dy }
      : spec.position,
  }));

  // Build the Command that represents the move described by `drag`+`world`,
  // without applying it. Also returns the resolved world-space position the
  // dragged handle should visually snap to, so the konva Circle can be moved
  // onto that point during the drag (otherwise it would keep tracking the
  // raw cursor and the ortho snap would look broken).
  // Returns null when nothing should change.
  const buildCommand = (
    drag: DragKey,
    world: Point2D,
    mods: DragMods,
  ): { command: Command; visualPosition: Point2D } | null => {
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
      return {
        command: updateDrawingEntityCommand(
          { id: e.id, patch },
          'Move line endpoint',
        ),
        visualPosition: resolved,
      };
    } else if (drag.kind === 'lineJoint') {
      // Shift = ortho-snap the joint relative to the first member line's far
      // end. Vertex-snap is skipped while Shift is held to keep the two
      // snaps from fighting each other.
      let resolved: Point2D;
      if (mods.shift) {
        const firstEp = drag.endpoints[0];
        const firstLine = firstEp
          ? proj.drawingEntities.find((x) => x.id === firstEp.entityId)
          : undefined;
        if (firstEp && firstLine && firstLine.type === 'line') {
          const anchor =
            firstEp.which === 'start' ? firstLine.end : firstLine.start;
          resolved = constrainAngle(anchor, world);
        } else {
          resolved = world;
        }
      } else {
        const editor = useEditorStore.getState();
        const excluded = new Set<string>(
          drag.endpoints.map((ep) => `${ep.entityId}.${ep.which}`),
        );
        resolved = snapDroppedLineEndpoint({
          worldPoint: world,
          project: proj,
          excludedLineEndpoints: excluded,
          snapEnabled: editor.snapEnabled,
          snapTolerancePx: editor.snapTolerancePx,
          viewportScale: editor.viewport.scale,
        });
      }
      const patches = drag.endpoints
        .map((ep) => {
          const e = proj.drawingEntities.find((x) => x.id === ep.entityId);
          if (!e || e.type !== 'line') return null;
          const patch: Partial<LineEntity> =
            ep.which === 'start' ? { start: resolved } : { end: resolved };
          return { id: ep.entityId, patch };
        })
        .filter((p): p is { id: string; patch: Partial<LineEntity> } => p !== null);
      if (patches.length === 0) return null;
      return {
        command: updateDrawingEntitiesCommand({ patches }, 'Move line joint'),
        visualPosition: resolved,
      };
    } else if (drag.kind === 'rectCorner') {
      const e = proj.drawingEntities.find((x) => x.id === drag.entityId);
      if (!e || e.type !== 'rectangle') return null;
      // Shift = ortho-snap relative to the opposite corner, otherwise let
      // the corner snap onto a nearby vertex / grid intersection so the
      // resized rectangle can be aligned with surrounding geometry.
      const resolved = mods.shift
        ? world
        : resolveVertexSnap(world, drag, mods);
      const next = computeRectAfterCornerMove(e, drag.corner, resolved);
      if (!next) return null;
      const patch: Partial<RectangleEntity> = {
        origin: next.origin,
        widthMm: next.widthMm,
        heightMm: next.heightMm,
      };
      return {
        command: updateDrawingEntityCommand(
          { id: e.id, patch },
          'Resize rectangle',
        ),
        visualPosition: resolved,
      };
    } else if (drag.kind === 'polygonVertex') {
      const e = proj.drawingEntities.find((x) => x.id === drag.entityId);
      if (!e || e.type !== 'polygon') return null;
      // Anchor ortho-snap to the previous vertex in the polygon ring so the
      // edge entering this corner becomes axis-aligned, matching the
      // dashed-line preview behavior used while drawing. Without Shift,
      // fall through to point / grid snap so the vertex can align with
      // surrounding geometry.
      let resolved: Point2D;
      if (mods.shift && e.points.length >= 2) {
        const n = e.points.length;
        const prev = e.points[(drag.index - 1 + n) % n]!;
        resolved = constrainAngle(prev, world);
      } else {
        resolved = resolveVertexSnap(world, drag, mods);
      }
      const nextPts = e.points.map((p, i) => (i === drag.index ? resolved : p));
      const patch: Partial<PolygonEntity> = { points: nextPts };
      return {
        command: updateDrawingEntityCommand(
          { id: e.id, patch },
          'Move polygon vertex',
        ),
        visualPosition: resolved,
      };
    } else if (drag.kind === 'surfaceVertex') {
      const s = proj.surfaces.find((x) => x.id === drag.surfaceId);
      if (!s) return null;
      let resolved: Point2D;
      if (mods.shift && s.outerBoundary.length >= 2) {
        const n = s.outerBoundary.length;
        const prev = s.outerBoundary[(drag.index - 1 + n) % n]!;
        resolved = constrainAngle(prev, world);
      } else {
        resolved = resolveVertexSnap(world, drag, mods);
      }
      const nextPts = s.outerBoundary.map((p, i) =>
        i === drag.index ? resolved : p,
      );
      const patch: Partial<Surface> = { outerBoundary: nextPts };
      return {
        command: updateSurfaceCommand(
          { id: s.id, patch },
          'Move surface vertex',
        ),
        visualPosition: resolved,
      };
    } else if (drag.kind === 'openingVertex') {
      const found = findOpeningSurface(proj, drag.openingId);
      if (!found || found.surface.id !== drag.surfaceId) return null;
      const hole = found.surface.holes[found.index];
      if (!hole) return null;
      // Ortho-snap to the previous vertex in the hole ring so the edge
      // entering this corner becomes axis-aligned, mirroring the polygon
      // / surface vertex behavior. Without Shift, fall through to point /
      // grid snap so the opening corner can align with surrounding
      // geometry (e.g. another opening, a surface vertex, or the grid).
      let resolved: Point2D;
      if (mods.shift && hole.length >= 2) {
        const n = hole.length;
        const prev = hole[(drag.index - 1 + n) % n]!;
        resolved = constrainAngle(prev, world);
      } else {
        resolved = resolveVertexSnap(world, drag, mods);
      }
      const nextHole = hole.map((p, i) => (i === drag.index ? resolved : p));
      return {
        command: updateOpeningCommand(
          {
            surfaceId: drag.surfaceId,
            openingId: drag.openingId,
            patch: { hole: nextHole },
          },
          'Move opening vertex',
        ),
        visualPosition: resolved,
      };
    }
    return null;
  };

  // Apply the in-progress drag to the project store WITHOUT pushing a history
  // entry. This lets the entity follow the drag handle visually while keeping
  // undo as a single step back to the pre-drag state. Returns the world-space
  // position the handle's Circle should be visually moved to (so ortho-snap
  // is reflected on the handle itself, not just on the underlying geometry).
  const onPreview = (
    drag: DragKey,
    world: Point2D,
    mods: DragMods,
  ): Point2D | null => {
    const built = buildCommand(drag, world, mods);
    if (!built) return null;
    useProjectStore.setState((s) => ({
      ...s,
      project: built.command.apply(s.project),
      isDirty: true,
    }));
    return built.visualPosition;
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
  ): Point2D | null => {
    if (startProject) {
      useProjectStore.setState((s) => ({ ...s, project: startProject }));
    }
    const built = buildCommand(drag, world, mods);
    if (!built) return null;
    dispatchCommand(built.command);
    return built.visualPosition;
  };

  return (
    <Group listening>
      {/* Live ortho distance + alignment guides anchored at the current
          drag position. Rendered only while a handle is being dragged so
          static selection state stays uncluttered. */}
      {dragPos ? <OrthoMeasureGuides cursor={dragPos} /> : null}
      {allSpecs.map((spec) => (
        (() => {
          const vertex = toSelectedVertex(spec.drag);
          const isActive = !!(vertex && selectedVertex && sameSelectedVertex(vertex, selectedVertex));
          return (
        <DraggableHandle
          key={spec.key}
          spec={spec}
          scale={scale}
          isActive={isActive}
          onActivate={selectVertex}
          onPreview={onPreview}
          onCommit={onCommit}
          onDragVisualChange={setDragPos}
        />
          );
        })()
      ))}
    </Group>
  );
};
