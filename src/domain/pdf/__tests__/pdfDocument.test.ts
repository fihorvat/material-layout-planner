import { describe, expect, it } from 'vitest';
import { buildPdfDocument } from '../pdfDocument';
import { createEmptyProject, defaultPdfSettings } from '@/types';
import { computeProjectStats } from '@/domain/materialLayout/layoutStats';

describe('buildPdfDocument', () => {
  it('produces a valid PDF byte stream', async () => {
    const project = createEmptyProject('Test');
    const bytes = await buildPdfDocument({
      project,
      settings: defaultPdfSettings(),
      layouts: [],
      cutList: [],
      cuttingDiagrams: [],
      projectStats: computeProjectStats(project),
    });
    expect(bytes.byteLength).toBeGreaterThan(500);
    const header = String.fromCharCode(...Array.from(bytes.slice(0, 4)));
    expect(header).toBe('%PDF');
  });
});
