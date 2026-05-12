export type ParsedLength = { mm: number };

export type ParseLengthErrorCode = 'empty' | 'nan' | 'negative' | 'unknownUnit';

export class ParseLengthError extends Error {
  readonly code: ParseLengthErrorCode;
  constructor(code: ParseLengthErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'ParseLengthError';
    this.code = code;
  }
}

type LengthUnit = 'mm' | 'cm' | 'm';

const UNIT_FACTOR: Record<LengthUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
};

const isLengthUnit = (token: string): token is LengthUnit =>
  token === 'mm' || token === 'cm' || token === 'm';

export const parseLength = (
  input: string | number,
  opts?: { defaultUnit?: 'mm' | 'cm' | 'm' },
): ParsedLength => {
  const defaultUnit = opts?.defaultUnit ?? 'mm';

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new ParseLengthError('nan');
    if (input < 0) throw new ParseLengthError('negative');
    return { mm: input * UNIT_FACTOR[defaultUnit satisfies LengthUnit] };
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) throw new ParseLengthError('empty');

  const match = trimmed.match(/^([+-]?\d+(?:[.,]\d+)?|[+-]?[.,]\d+)\s*([a-zA-Z]*)$/);
  if (!match) {
    const unitMatch = trimmed.match(/[a-zA-Z]+$/);
    if (unitMatch && !isLengthUnit(unitMatch[0].toLowerCase())) {
      throw new ParseLengthError('unknownUnit');
    }
    throw new ParseLengthError('nan');
  }

  const numberPart = match[1] ?? '';
  const unitPart = (match[2] ?? '').toLowerCase();

  const rawNumber = numberPart.replace(',', '.');
  const value = Number(rawNumber);
  if (!Number.isFinite(value)) throw new ParseLengthError('nan');
  if (value < 0) throw new ParseLengthError('negative');

  const unit: LengthUnit = unitPart === '' ? defaultUnit : (isLengthUnit(unitPart) ? unitPart : ((): never => { throw new ParseLengthError('unknownUnit'); })());
  return { mm: value * UNIT_FACTOR[unit] };
};
