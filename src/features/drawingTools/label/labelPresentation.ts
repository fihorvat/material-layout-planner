import type { TextStyle } from '@/types';

export const getLabelDisplayText = (
  text: string,
  style: Pick<TextStyle, 'uppercase'>,
): string => (style.uppercase ? text.toUpperCase() : text);

export const getLabelFontStyle = (
  style: Pick<TextStyle, 'bold' | 'italic'>,
): 'normal' | 'bold' | 'italic' | 'bold italic' => {
  if (style.bold && style.italic) return 'bold italic';
  if (style.bold) return 'bold';
  if (style.italic) return 'italic';
  return 'normal';
};