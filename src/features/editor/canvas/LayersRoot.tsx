import { Group } from 'react-konva';
import type { ReactNode } from 'react';

const Placeholder = ({ name, children }: { name: string; children?: ReactNode }) => (
  <Group name={name}>{children}</Group>
);

export type LayersRootProps = {
  backgroundImage?: ReactNode;
  construction?: ReactNode;
  surfaces?: ReactNode;
  openings?: ReactNode;
  materialLayout?: ReactNode;
  overlap?: ReactNode;
  dimensions?: ReactNode;
  labels?: ReactNode;
  helpers?: ReactNode;
};

export const LayersRoot = (props: LayersRootProps) => {
  return (
    <Group>
      <Placeholder name="backgroundImage">{props.backgroundImage}</Placeholder>
      <Placeholder name="construction">{props.construction}</Placeholder>
      <Placeholder name="surfaces">{props.surfaces}</Placeholder>
      <Placeholder name="openings">{props.openings}</Placeholder>
      <Placeholder name="materialLayout">{props.materialLayout}</Placeholder>
      <Placeholder name="overlap">{props.overlap}</Placeholder>
      <Placeholder name="dimensions">{props.dimensions}</Placeholder>
      <Placeholder name="labels">{props.labels}</Placeholder>
      <Placeholder name="helpers">{props.helpers}</Placeholder>
    </Group>
  );
};
