export type FormatAreaUnit = 'mm2' | 'cm2' | 'm2' | 'auto';
export type FormatAreaOptions = { unit?: FormatAreaUnit; decimals?: number };

const pickAuto = (mm2: number): 'mm2' | 'cm2' | 'm2' => {
  const abs = Math.abs(mm2);
  if (abs >= 1_000_000) return 'm2';
  if (abs >= 1_000) return 'cm2';
  return 'mm2';
};

export const formatArea = (mm2: number, opts?: FormatAreaOptions): string => {
  const unit = opts?.unit ?? 'auto';
  const resolved = unit === 'auto' ? pickAuto(mm2) : unit;
  const decimals = opts?.decimals ?? (resolved === 'm2' ? 3 : resolved === 'cm2' ? 1 : 0);
  let value = mm2;
  let suffix = 'mm\u00B2';
  if (resolved === 'cm2') {
    value = mm2 / 100;
    suffix = 'cm\u00B2';
  } else if (resolved === 'm2') {
    value = mm2 / 1_000_000;
    suffix = 'm\u00B2';
  }
  return `${value.toFixed(decimals)} ${suffix}`;
};
