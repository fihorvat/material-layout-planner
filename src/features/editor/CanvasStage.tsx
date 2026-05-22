import { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import type { Point2D } from '@/types';
import { useEditorStore } from '@/state';
import { GridLayer } from './canvas/GridLayer';
import { LayersRoot } from './canvas/LayersRoot';
import { useResizeObserver } from './canvas/useResizeObserver';
import { useViewportInteractions } from './canvas/useViewportInteractions';
import { screenToWorld } from './canvas/coords';
import { OrthoMeasureGuides } from '@/features/drawingTools/OrthoMeasureGuides';
import { useSelectTool } from '@/features/drawingTools/SelectTool';
import { useLineTool } from '@/features/drawingTools/LineTool';
import { useRectangleTool } from '@/features/drawingTools/RectangleTool';
import { usePolygonTool } from '@/features/drawingTools/PolygonTool';
import { useOpeningTool } from '@/features/drawingTools/OpeningTool';
import { useCutTool } from '@/features/drawingTools/CutTool';
import { useMeterTool } from '@/features/drawingTools/MeterTool';
import { ConstructionEntities } from '@/features/drawingTools/ConstructionEntities';
import { DrawingModeOverlay } from '@/features/drawingTools/DrawingModeOverlay';
import { useDrawingModeActive } from '@/features/drawingTools/drawingMode';
import { SurfaceLayer } from '@/features/surfaces/SurfaceLayer';
import { useSurfaceTool } from '@/features/surfaces/SurfaceTool';
import { useSplitSurfaceTool } from '@/features/surfaces/SplitSurfaceTool';
import { useConnectionTool } from '@/features/drawingTools/ConnectionTool';
import { ConnectionVisualizer } from '@/features/surfaces/ConnectionVisualizer';
import { SurfaceConnectionDialog } from '@/features/surfaces/SurfaceConnectionDialog';
import { LabelRenderer } from '@/features/drawingTools/label/LabelRenderer';
import { useLabelTool } from '@/features/drawingTools/label/LabelTool';
import { LabelEditor } from '@/features/drawingTools/label/LabelEditor';
import { DimensionRenderer } from '@/features/drawingTools/dimension/DimensionRenderer';
import { useDimensionTool } from '@/features/drawingTools/dimension/useDimensionTool';
import { DimensionLengthPrompt } from '@/features/drawingTools/dimension/DimensionLengthPrompt';
import { MaterialLayoutLayer } from '@/features/materialLayout/MaterialLayoutLayer';
import { PatternOriginLayer } from '@/features/materialLayout/PatternOriginLayer';
import { setActiveStage } from './canvas/activeStage';
import { useProjectStore, useLabelUiStore } from '@/state';
import { dispatchCommand, updateLabelCommand } from '@/domain/commands';
import styles from './editor.module.css';

export const CanvasStage = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const { width, height } = useResizeObserver(containerRef);
  const viewport = useEditorStore((s) => s.viewport);
  const activeTool = useEditorStore((s) => s.activeTool);
  const handlers = useViewportInteractions(stageRef);
  const select = useSelectTool(stageRef);

  useEffect(() => {
    setActiveStage(stageRef.current);
    return () => {
      setActiveStage(null);
    };
  }, [width, height]);
  const line = useLineTool(stageRef);
  const rect = useRectangleTool(stageRef);
  const poly = usePolygonTool(stageRef);
  const surface = useSurfaceTool(stageRef);
  const dimension = useDimensionTool(stageRef);
  const label = useLabelTool(stageRef);
  const opening = useOpeningTool(stageRef);
  const cut = useCutTool(stageRef);
  const meter = useMeterTool(stageRef);
  const splitSurface = useSplitSurfaceTool(stageRef);
  const connection = useConnectionTool(stageRef);
  const project = useProjectStore((s) => s.project);
  const editingLabelId = useLabelUiStore((s) => s.editingLabelId);
  const cancelLabelEdit = useLabelUiStore((s) => s.cancelEdit);
  const drawingModeActive = useDrawingModeActive();
  const [hoverWorld, setHoverWorld] = useState<Point2D | null>(null);
  const editingLabel = editingLabelId
    ? project.labels.find((entry) => entry.id === editingLabelId) ?? null
    : null;

  useEffect(() => {
    if (editingLabelId && !editingLabel) {
      cancelLabelEdit();
    }
  }, [cancelLabelEdit, editingLabel, editingLabelId]);

  const onMouseDown = (e: { evt: MouseEvent }) => {
    handlers.onMouseDown(e);
    if (activeTool === 'select') {
      select.onStagePointerDown(e as unknown as { evt: PointerEvent });
    } else if (activeTool === 'line') {
      line.onStagePointerDown(e as unknown as { evt: PointerEvent });
    } else if (activeTool === 'rectangle') {
      rect.onStagePointerDown(e);
    } else if (activeTool === 'polygon') {
      poly.onStagePointerDown(e);
    } else if (activeTool === 'surface') {
      surface.onStagePointerDown(e);
    } else if (activeTool === 'dimension') {
      dimension.onStagePointerDown(e);
    } else if (activeTool === 'label') {
      label.onStagePointerDown(e);
    } else if (activeTool === 'opening') {
      opening.onStagePointerDown(e);
    } else if (activeTool === 'cut') {
      cut.onStagePointerDown(e as unknown as { evt: PointerEvent });
    } else if (activeTool === 'splitSurface') {
      splitSurface.onStagePointerDown(e);
    } else if (activeTool === 'connection') {
      connection.onStagePointerDown(e);
    } else if (activeTool === 'meter') {
      meter.onStagePointerDown(e as unknown as { evt: PointerEvent });
    }
  };
  const onMouseMove = (e: { evt: MouseEvent }) => {
    handlers.onMouseMove(e);
    const stage = stageRef.current;
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        const v = useEditorStore.getState().viewport;
        setHoverWorld(screenToWorld(pos.x, pos.y, v));
      }
    }
    if (activeTool === 'select') {
      select.onStagePointerMove();
    } else if (activeTool === 'line') {
      line.onStagePointerMove(e as unknown as { evt: PointerEvent });
    } else if (activeTool === 'rectangle') {
      rect.onStagePointerMove(e);
    } else if (activeTool === 'polygon') {
      poly.onStagePointerMove(e);
    } else if (activeTool === 'surface') {
      surface.onStagePointerMove(e);
    } else if (activeTool === 'opening') {
      opening.onStagePointerMove(e);
    } else if (activeTool === 'cut') {
      cut.onStagePointerMove(e as unknown as { evt: PointerEvent });
    } else if (activeTool === 'splitSurface') {
      splitSurface.onStagePointerMove(e);
    } else if (activeTool === 'connection') {
      connection.onStagePointerMove(e);
    } else if (activeTool === 'meter') {
      meter.onStagePointerMove(e as unknown as { evt: PointerEvent });
    }
  };
  const onMouseUp = (e: { evt: MouseEvent }) => {
    handlers.onMouseUp();
    if (activeTool === 'select') {
      select.onStagePointerUp(e as unknown as { evt: PointerEvent });
    }
  };
  const onDblClick = (e: { evt: MouseEvent }) => {
    if (activeTool === 'select') {
      select.onStageDblClick(e);
    }
  };
  const onMouseLeave = () => {
    setHoverWorld(null);
  };

  const toolOverlay =
    activeTool === 'select'
      ? select.overlays
      : activeTool === 'line'
        ? line.overlays
        : activeTool === 'rectangle'
          ? rect.overlays
          : activeTool === 'polygon'
            ? poly.overlays
            : activeTool === 'surface'
              ? surface.overlays
              : activeTool === 'opening'
                ? opening.overlays
                : activeTool === 'cut'
                  ? cut.overlays
                  : activeTool === 'splitSurface'
                    ? splitSurface.overlays
                    : activeTool === 'connection'
                      ? connection.overlays
                      : activeTool === 'meter'
                        ? meter.overlays
                        : null;

  const domOverlay =
    activeTool === 'line'
      ? line.domOverlay
      : activeTool === 'rectangle'
        ? rect.domOverlay
        : activeTool === 'polygon'
          ? poly.domOverlay
          : activeTool === 'surface'
            ? surface.domOverlay
            : activeTool === 'opening'
              ? opening.domOverlay
              : activeTool === 'splitSurface'
                ? splitSurface.domOverlay
                : null;

  const labelEditor = label.pending ? (
    <LabelEditor onSubmit={label.commit} onCancel={label.cancel} />
  ) : editingLabel ? (
    <LabelEditor
      initialText={editingLabel.text}
      title="Edit label text"
      submitLabel="Save"
      onSubmit={(text) => {
        dispatchCommand(
          updateLabelCommand({
            id: editingLabel.id,
            patch: { text },
          }),
        );
        cancelLabelEdit();
      }}
      onCancel={cancelLabelEdit}
    />
  ) : null;

  // Drawing tools that benefit from the orthogonal distance-to-surface
  // preview at the hover position before any vertex has been placed.
  // The dimension tool toggles labels per-click and has no preview, so it
  // also benefits from seeing distances while hovering.
  const DRAWING_TOOLS_FOR_HOVER_GUIDES: ReadonlyArray<string> = [
    'line',
    'rectangle',
    'polygon',
    'surface',
    'opening',
    'splitSurface',
    'dimension',
    'meter',
  ];
  const showIdleHoverGuides =
    hoverWorld !== null &&
    toolOverlay === null &&
    DRAWING_TOOLS_FOR_HOVER_GUIDES.includes(activeTool);

  return (
    <div ref={containerRef} className={styles.canvasArea} role="region" aria-label="Drawing canvas">
      {width > 0 && height > 0 ? (
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onWheel={handlers.onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onDblClick={onDblClick}
        >
          <Layer
            name="world"
            x={viewport.offsetXPx}
            y={viewport.offsetYPx}
            scaleX={viewport.scale}
            scaleY={viewport.scale}
          >
            <GridLayer widthPx={width} heightPx={height} />
            <LayersRoot
              construction={<ConstructionEntities />}
              surfaces={
                <>
                  <SurfaceLayer />
                  <ConnectionVisualizer />
                </>
              }
              materialLayout={<MaterialLayoutLayer />}
              dimensions={<DimensionRenderer dimensions={project.dimensions} project={project} />}
              labels={<LabelRenderer labels={project.labels} project={project} />}
              helpers={
                <>
                  {drawingModeActive ? <DrawingModeOverlay /> : null}
                  {showIdleHoverGuides && hoverWorld ? (
                    <OrthoMeasureGuides cursor={hoverWorld} />
                  ) : null}
                  {toolOverlay}
                  <PatternOriginLayer />
                </>
              }
            />
          </Layer>
        </Stage>
      ) : null}
      {domOverlay}
      {labelEditor}
      <DimensionLengthPrompt />
      <SurfaceConnectionDialog />
    </div>
  );
};
