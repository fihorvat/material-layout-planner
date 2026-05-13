import { useEffect, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '@/state';
import { GridLayer } from './canvas/GridLayer';
import { LayersRoot } from './canvas/LayersRoot';
import { useResizeObserver } from './canvas/useResizeObserver';
import { useViewportInteractions } from './canvas/useViewportInteractions';
import { useSelectTool } from '@/features/drawingTools/SelectTool';
import { useLineTool } from '@/features/drawingTools/LineTool';
import { useRectangleTool } from '@/features/drawingTools/RectangleTool';
import { usePolygonTool } from '@/features/drawingTools/PolygonTool';
import { useOpeningTool } from '@/features/drawingTools/OpeningTool';
import { useCutTool } from '@/features/drawingTools/CutTool';
import { ConstructionEntities } from '@/features/drawingTools/ConstructionEntities';
import { DrawingModeOverlay } from '@/features/drawingTools/DrawingModeOverlay';
import { useDrawingModeActive } from '@/features/drawingTools/drawingMode';
import { SurfaceLayer } from '@/features/surfaces/SurfaceLayer';
import { useSurfaceTool } from '@/features/surfaces/SurfaceTool';
import { LabelRenderer } from '@/features/drawingTools/label/LabelRenderer';
import { useLabelTool } from '@/features/drawingTools/label/LabelTool';
import { LabelEditor } from '@/features/drawingTools/label/LabelEditor';
import { DimensionRenderer } from '@/features/drawingTools/dimension/DimensionRenderer';
import { useDimensionTool } from '@/features/drawingTools/dimension/useDimensionTool';
import { DimensionLengthPrompt } from '@/features/drawingTools/dimension/DimensionLengthPrompt';
import { MaterialLayoutLayer } from '@/features/materialLayout/MaterialLayoutLayer';
import { PatternOriginLayer } from '@/features/materialLayout/PatternOriginLayer';
import { setActiveStage } from './canvas/activeStage';
import { useProjectStore } from '@/state';
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
  const project = useProjectStore((s) => s.project);
  const drawingModeActive = useDrawingModeActive();

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
    }
  };
  const onMouseMove = (e: { evt: MouseEvent }) => {
    handlers.onMouseMove(e);
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
                  : null;

  const domOverlay =
    activeTool === 'line'
      ? line.domOverlay
      : activeTool === 'rectangle'
        ? rect.domOverlay
        : activeTool === 'polygon'
          ? poly.domOverlay
          : null;

  const labelEditor = label.pending ? (
    <LabelEditor onSubmit={label.commit} onCancel={label.cancel} />
  ) : null;

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
              surfaces={<SurfaceLayer />}
              materialLayout={<MaterialLayoutLayer />}
              dimensions={<DimensionRenderer dimensions={project.dimensions} project={project} />}
              labels={<LabelRenderer labels={project.labels} project={project} />}
              helpers={
                <>
                  {drawingModeActive ? <DrawingModeOverlay /> : null}
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
    </div>
  );
};
