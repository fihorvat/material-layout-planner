import { describe, expect, it } from 'vitest';
import { getLabelDisplayText, getLabelFontStyle } from '../labelPresentation';

describe('labelPresentation', () => {
  it('uppercases label text when the style flag is enabled', () => {
    expect(getLabelDisplayText('Door note', { uppercase: true })).toBe('DOOR NOTE');
    expect(getLabelDisplayText('Door note', { uppercase: false })).toBe('Door note');
  });

  it('maps bold and italic combinations to Konva fontStyle', () => {
    expect(getLabelFontStyle({ bold: false, italic: false })).toBe('normal');
    expect(getLabelFontStyle({ bold: true, italic: false })).toBe('bold');
    expect(getLabelFontStyle({ bold: false, italic: true })).toBe('italic');
    expect(getLabelFontStyle({ bold: true, italic: true })).toBe('bold italic');
  });
});