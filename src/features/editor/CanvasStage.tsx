import { useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '@/state';
import { GridLayer } from './canvas/GridLayer';
import { LayersRoot } from './canvas/LayersRoot';
import { useResizeObserver } from './canvas/useResizeObserver';
import { useViewportInteractions } from './canvas/useViewportInteractions';
import styles from './editor.module.css';

export const CanvasStage = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const { width, height } = useResizeObserver(containerRef);
  const viewport = useEditorStore((s) => s.viewport);
  const handlers = useViewportInteractions(stageRef);

  return (
    <div ref={containerRef} className={styles.canvasArea} role="region" aria-label="Drawing canvas">
      {width > 0 && height > 0 ? (
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onWheel={handlers.onWheel}
          onMouseDown={handlers.onMouseDown}
          onMouseMove={handlers.onMouseMove}
          onMouseUp={handlers.onMouseUp}
        >
          <Layer
            name="world"
            x={viewport.offsetXPx}
            y={viewport.offsetYPx}
            scaleX={viewport.scale}
            scaleY={viewport.scale}
          >
            <GridLayer widthPx={width} heightPx={height} />
            <LayersRoot />
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
};
