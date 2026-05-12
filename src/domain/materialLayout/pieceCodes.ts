export const buildSurfaceLetter = (surfaceIndex: number): string => {
  let n = surfaceIndex;
  let out = '';
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
};

export const buildPieceCode = (params: { surfaceLetter: string; index: number }): string => {
  const idx = String(params.index + 1).padStart(2, '0');
  return `${params.surfaceLetter}-${idx}`;
};
