import { Group } from 'react-konva';
import type Konva from 'konva';
import { MarqueeOverlay } from './select/MarqueeOverlay';
import { SelectionOverlay } from './select/SelectionOverlay';
import { SelectionEditHandles } from './select/SelectionEditHandles';
import { useSelectInteractions } from './select/useSelectInteractions';

export type SelectToolProps = {
  stageRef: React.RefObject<Konva.Stage | null>;
};

export const useSelectTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const inter = useSelectInteractions(stageRef);
  const overlays = (
    <Group>
      <SelectionOverlay />
      <SelectionEditHandles />
      {inter.marquee ? (
        <MarqueeOverlay start={inter.marquee.startWorld} end={inter.marquee.cursor} />
      ) : null}
    </Group>
  );
  return { ...inter, overlays };
};
