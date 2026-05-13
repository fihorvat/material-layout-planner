import type { PlacementPattern } from '@/types';

// ---------- Option metadata (label + description) ----------

export const TYPE_META: {
  value: PlacementPattern['type'];
  label: string;
  description: string;
}[] = [
  {
    value: 'stacked',
    label: 'Stacked',
    description: 'Aligned grid — no row offset, all joints line up.',
  },
  {
    value: 'verticalStacked',
    label: 'Vertical',
    description: 'Tall units stacked aligned in columns (no offset).',
  },
  {
    value: 'runningBondHalf',
    label: 'Bond 1/2',
    description: 'Running bond — each row offset by 50% of the unit width.',
  },
  {
    value: 'runningBondThird',
    label: 'Bond 1/3',
    description: 'Running bond — each row offset by 33% of the unit width.',
  },
  {
    value: 'customOffset',
    label: 'Custom offset',
    description: 'Specify a custom row offset (in mm or % of unit width).',
  },
  {
    value: 'diagonal',
    label: 'Diagonal',
    description: 'Units rotated 45° forming a diagonal layout.',
  },
];

export const ORIENTATION_META: {
  value: PlacementPattern['orientation'];
  label: string;
  description: string;
}[] = [
  {
    value: 'horizontal',
    label: 'Horizontal',
    description: 'Units placed with their long side running horizontally.',
  },
  {
    value: 'vertical',
    label: 'Vertical',
    description: 'Units placed with their long side running vertically.',
  },
  {
    value: 'customAngle',
    label: 'Custom angle',
    description: 'Rotate units by a user-defined angle (degrees).',
  },
];

export const ORIGIN_META: {
  value: PlacementPattern['originMode'];
  label: string;
  description: string;
}[] = [
  {
    value: 'surfaceCenter',
    label: 'Center',
    description: 'Pattern is centered on the surface — symmetric edges.',
  },
  {
    value: 'topLeft',
    label: 'Top-left',
    description: 'Pattern starts from the top-left corner of the surface.',
  },
  {
    value: 'bottomLeft',
    label: 'Bottom-left',
    description: 'Pattern starts from the bottom-left corner of the surface.',
  },
  {
    value: 'customPoint',
    label: 'Custom',
    description: 'Specify exact X / Y coordinates where the pattern starts.',
  },
];

export const DIRECTION_META: {
  value: PlacementPattern['direction'];
  label: string;
  description: string;
}[] = [
  {
    value: 'leftToRight',
    label: 'Left → Right',
    description: 'Layout grows from left to right.',
  },
  {
    value: 'rightToLeft',
    label: 'Right → Left',
    description: 'Layout grows from right to left.',
  },
  {
    value: 'topToBottom',
    label: 'Top → Bottom',
    description: 'Layout grows from top to bottom.',
  },
  {
    value: 'bottomToTop',
    label: 'Bottom → Top',
    description: 'Layout grows from bottom to top.',
  },
];

export const SYMMETRY_META: {
  value: PlacementPattern['symmetryMode'];
  label: string;
  description: string;
}[] = [
  {
    value: 'none',
    label: 'None',
    description: 'No symmetry — pattern fills naturally from origin and direction.',
  },
  {
    value: 'verticalAxis',
    label: 'Vertical',
    description: 'Mirror around the vertical center axis (left ↔ right).',
  },
  {
    value: 'horizontalAxis',
    label: 'Horizontal',
    description: 'Mirror around the horizontal center axis (top ↔ bottom).',
  },
  {
    value: 'customAxis',
    label: 'Custom',
    description: 'Mirror around a user-defined axis.',
  },
];
