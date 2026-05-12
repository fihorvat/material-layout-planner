import { useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '@/state';
import { GridLayer } from './canvas/GridLayer';
import { LayersRoot } from './canvas/LayersRoot';
import { useResizeObserver } from './canvas/useResizeObserver';
import { useViewportInteractions } from './canvas/useViewportInteractions';
import { useSelectTool } from '@/features/drawingTools/SelectTool';
import { ConstructionEntities } from '@/features/drawingTools/ConstructionEntities';
import { SurfaceLayer } from '@/features/surfaces/SurfaceLayer';
import { LabelRenderer } from '@/features/drawingTools/label/LabelRenderer';
import { DimensionRenderer } from '@/features/drawingTools/dimension/DimensionRenderer';
import { MaterialLayoutLayer } from '@/features/materialLayout/MaterialLayoutLayer';
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
  const project = useProjectStore((s) => s.project);

  const isSelect = activeTool === 'select';
  const onMouseDown = (e: { evt: MouseEvent }) => {
    handlers.onMouseDown(e);
    if (isSelect) {
      select.onStagePointerDown(e as unknown as { evt: PointerEvent });
    }
  };
  const onMouseMove = (e: { evt: MouseEvent }) => {
    handlers.onMouseMove(e);
    if (isSelect) {
      select.onStagePointerMove();
    }
  };
  const onMouseUp = (e: { evt: MouseEvent }) => {
    handlers.onMouseUp();
    if (isSelect) {
      select.onStagePointerUp(e as unknown as { evt: PointerEvent });
    }
  };

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
              helpers={select.overlays}
            />
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
};
