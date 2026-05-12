export type FormatLengthOptions = {
  unit?: 'mm' | 'cm' | 'm' | 'auto';
  decimals?: number;
};

const trimZeros = (s: string): string => {
  if (!s.includes('.')) return s;
  return s.replace(/0+$/, '').replace(/\.$/, '');
};

const round = (n: number, decimals: number): string => {
  if (!Number.isFinite(n)) return String(n);
  const factor = 10 ** decimals;
  const rounded = Math.round(n * factor) / factor;
  return trimZeros(rounded.toFixed(decimals));
};

const pickAutoUnit = (mm: number): 'mm' | 'cm' | 'm' => {
  const abs = Math.abs(mm);
  if (abs >= 1000) return 'm';
  if (abs >= 100) return 'cm';
  return 'mm';
};

export const formatLength = (mm: number, opts?: FormatLengthOptions): string => {
  const unit = opts?.unit ?? 'mm';
  const resolvedUnit = unit === 'auto' ? pickAutoUnit(mm) : unit;
  const decimals = opts?.decimals ?? (resolvedUnit === 'm' ? 2 : 1);

  let value: number;
  switch (resolvedUnit) {
    case 'mm':
      value = mm;
      break;
    case 'cm':
      value = mm / 10;
      break;
    case 'm':
      value = mm / 1000;
      break;
  }
  return `${round(value, decimals)} ${resolvedUnit}`;
};
