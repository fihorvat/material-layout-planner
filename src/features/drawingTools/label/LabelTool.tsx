import { useCallback, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, LabelEntity } from '@/types';
import { defaultTextStyle } from '@/types';
import { useEditorStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { dispatchCommand, addLabelCommand } from '@/domain/commands';
import { newLabelId } from '@/domain/ids';

type PendingLabel = { position: Point2D };

export const useLabelTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const [pending, setPending] = useState<PendingLabel | null>(null);

  const onStagePointerDown = useCallback(
    (e: { evt: MouseEvent }) => {
      if (e.evt.button !== 0) return;
      const s = stageRef.current;
      if (!s) return;
      const pos = s.getPointerPosition();
      if (!pos) return;
      const v = useEditorStore.getState().viewport;
      const world = screenToWorld(pos.x, pos.y, v);
      setPending({ position: world });
    },
    [stageRef],
  );

  const commit = useCallback((text: string) => {
    if (!pending) return;
    if (text.length === 0) {
      setPending(null);
      return;
    }
    const label: LabelEntity = {
      id: newLabelId(),
      text,
      anchorType: 'free',
      position: pending.position,
      rotationDeg: 0,
      style: defaultTextStyle(),
    };
    dispatchCommand(addLabelCommand({ label }));
    setPending(null);
  }, [pending]);

  const cancel = useCallback(() => setPending(null), []);

  return { pending, onStagePointerDown, commit, cancel };
};
