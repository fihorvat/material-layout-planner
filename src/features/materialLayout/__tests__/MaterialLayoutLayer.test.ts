import { describe, expect, it } from 'vitest';
import { shouldEnableMaterialPieceHitTargets } from '../MaterialLayoutLayer';

describe('MaterialLayoutLayer', () => {
  it('disables material piece hit targets while a surface is selected in select mode', () => {
    expect(shouldEnableMaterialPieceHitTargets('select', [{ kind: 'surface', id: 'srf_1' }])).toBe(
      false,
    );
  });

  it('disables material piece hit targets while an opening is selected in select mode', () => {
    expect(shouldEnableMaterialPieceHitTargets('select', [{ kind: 'opening', id: 'opn_1' }])).toBe(
      false,
    );
  });

  it('keeps material piece hit targets enabled for material-piece selection', () => {
    expect(
      shouldEnableMaterialPieceHitTargets('select', [{ kind: 'materialPiece', id: 'pcs_1' }]),
    ).toBe(true);
  });

  it('keeps material piece hit targets enabled outside select mode', () => {
    expect(
      shouldEnableMaterialPieceHitTargets('patternOrigin', [{ kind: 'surface', id: 'srf_1' }]),
    ).toBe(true);
  });
});
