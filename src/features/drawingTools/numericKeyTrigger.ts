/**
 * Helpers for detecting "the user pressed a digit / dot key" in a way that
 * works regardless of:
 *  - whether Shift is held (e.g. while ortho-locking a line with Shift, the
 *    key event for `5` becomes `%` on US/EU layouts because `e.key` reports
 *    the shifted glyph),
 *  - whether the digit came from the main row or the numeric keypad,
 *  - non-Latin keyboard layouts where digit glyphs may differ from `e.key`.
 *
 * We inspect both `e.key` (semantic char) and `e.code` (physical key) to
 * cover all of those cases. When the prompt is opened we prefer the raw digit
 * character (so it can be prefilled into the input).
 */

const DIGIT_CODE_RE = /^(Digit|Numpad)([0-9])$/;

/**
 * Returns the digit/dot character that should seed the numeric prompt, or
 * `null` if the keydown event does not represent a digit/decimal key.
 *
 * Ignores keystrokes that include Ctrl/Meta/Alt modifiers so the user can
 * still use Cmd/Ctrl + number shortcuts (e.g. browser tab navigation).
 */
export const numericTriggerChar = (e: KeyboardEvent): string | null => {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  // Plain digit/dot via key (no Shift on a Latin layout).
  if (/^[0-9.]$/.test(e.key)) return e.key;
  // Physical digit keys (Digit0..Digit9, Numpad0..Numpad9). Works when Shift
  // is held or when the layout puts other glyphs on these keys.
  const codeMatch = DIGIT_CODE_RE.exec(e.code);
  if (codeMatch) return codeMatch[2]!;
  // Decimal separator keys.
  if (e.code === 'NumpadDecimal' || e.code === 'Period') return '.';
  return null;
};
