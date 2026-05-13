import { describe, expect, it } from 'vitest';
import { numericTriggerChar } from '../numericKeyTrigger';

// Helper to build minimal KeyboardEvent-like shapes for the function under
// test without depending on JSDOM's full KeyboardEvent constructor.
const ev = (overrides: Partial<KeyboardEvent>): KeyboardEvent =>
  ({
    key: '',
    code: '',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  }) as KeyboardEvent;

describe('numericTriggerChar', () => {
  it('returns the digit for a plain digit key', () => {
    expect(numericTriggerChar(ev({ key: '5', code: 'Digit5' }))).toBe('5');
    expect(numericTriggerChar(ev({ key: '0', code: 'Digit0' }))).toBe('0');
  });

  it('returns "." for a decimal key', () => {
    expect(numericTriggerChar(ev({ key: '.', code: 'Period' }))).toBe('.');
  });

  it('still returns the digit when Shift is held (e.key may be a shifted glyph)', () => {
    // Shift+5 on US/EU layouts produces "%" — we should still treat it as 5.
    expect(numericTriggerChar(ev({ key: '%', code: 'Digit5', shiftKey: true }))).toBe('5');
    // Shift+0 produces ")" on US.
    expect(numericTriggerChar(ev({ key: ')', code: 'Digit0', shiftKey: true }))).toBe('0');
  });

  it('returns the digit for numeric keypad keys', () => {
    expect(numericTriggerChar(ev({ key: '7', code: 'Numpad7' }))).toBe('7');
    expect(numericTriggerChar(ev({ key: '.', code: 'NumpadDecimal' }))).toBe('.');
  });

  it('returns null for non-digit keys', () => {
    expect(numericTriggerChar(ev({ key: 'a', code: 'KeyA' }))).toBeNull();
    expect(numericTriggerChar(ev({ key: 'Enter', code: 'Enter' }))).toBeNull();
    expect(numericTriggerChar(ev({ key: 'Shift', code: 'ShiftLeft' }))).toBeNull();
  });

  it('ignores digits combined with Ctrl/Meta/Alt so browser shortcuts still work', () => {
    expect(numericTriggerChar(ev({ key: '5', code: 'Digit5', ctrlKey: true }))).toBeNull();
    expect(numericTriggerChar(ev({ key: '5', code: 'Digit5', metaKey: true }))).toBeNull();
    expect(numericTriggerChar(ev({ key: '5', code: 'Digit5', altKey: true }))).toBeNull();
  });
});
