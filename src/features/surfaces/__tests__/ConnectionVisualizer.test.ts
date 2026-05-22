import { describe, expect, it } from 'vitest';
import { shouldEnableConnectionHitTargets } from '../ConnectionVisualizer';

describe('ConnectionVisualizer', () => {
  it('disables connection hit targets while a surface is selected in select mode', () => {
    expect(shouldEnableConnectionHitTargets('select', [{ kind: 'surface', id: 'srf_1' }])).toBe(
      false,
    );
  });

  it('disables connection hit targets while an opening is selected in select mode', () => {
    expect(shouldEnableConnectionHitTargets('select', [{ kind: 'opening', id: 'opn_1' }])).toBe(
      false,
    );
  });

  it('keeps connection hit targets enabled for connection-only selection', () => {
    expect(shouldEnableConnectionHitTargets('select', [{ kind: 'connection', id: 'con_1' }])).toBe(
      true,
    );
  });

  it('keeps connection hit targets enabled outside select mode', () => {
    expect(shouldEnableConnectionHitTargets('connection', [{ kind: 'surface', id: 'srf_1' }])).toBe(
      true,
    );
  });
});
