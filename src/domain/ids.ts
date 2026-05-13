import { factory, type PRNG } from 'ulid';

// ulid's built-in detectPrng() only checks `window`, so in a Web Worker
// (where `window` is undefined) it falls back to `require('crypto')` which
// Vite resolves to an empty browser stub, producing `nodeCrypto.randomBytes
// is not a function`. Provide a PRNG backed by Web Crypto via `globalThis`,
// which is available on the main thread, workers, and Node 20+.
const prng: PRNG = () => {
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const buffer = new Uint8Array(1);
    cryptoObj.getRandomValues(buffer);
    return (buffer[0] ?? 0) / 0xff;
  }
  throw new Error('secure crypto unavailable for ulid');
};

const ulid = factory(prng);

export const newId = (): string => ulid();

export const newProjectId = (): string => `prj_${ulid()}`;
export const newSurfaceId = (): string => `srf_${ulid()}`;
export const newMaterialId = (): string => `mat_${ulid()}`;
export const newPlacementPatternId = (): string => `pat_${ulid()}`;
export const newMaterialLayoutId = (): string => `lay_${ulid()}`;
export const newSurfaceConnectionId = (): string => `con_${ulid()}`;
export const newDrawingEntityId = (): string => `dwg_${ulid()}`;
export const newDimensionId = (): string => `dim_${ulid()}`;
export const newLabelId = (): string => `lbl_${ulid()}`;
export const newOpeningId = (): string => `opn_${ulid()}`;
export const newEdgeRuleId = (): string => `edg_${ulid()}`;
export const newMaterialPieceId = (): string => `pcs_${ulid()}`;
export const newCommandId = (): string => `cmd_${ulid()}`;
export const newBackgroundImageId = (): string => `bgi_${ulid()}`;
