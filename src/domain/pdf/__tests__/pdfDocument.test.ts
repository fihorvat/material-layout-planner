import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { buildPdfDocument } from '../pdfDocument';
import { createEmptyProject, defaultPdfSettings } from '@/types';
import { computeProjectStats } from '@/domain/materialLayout/layoutStats';
import { createSurface } from '@/domain/surfaces/createSurface';

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

  it('renders technical drawings one surface per page', async () => {
    const project = createEmptyProject('Test');
    project.surfaces.push(
      createSurface({
        name: 'S1',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 1200, y: 0 },
          { x: 1200, y: 800 },
          { x: 0, y: 800 },
        ],
      }),
      createSurface({
        name: 'S2',
        outerBoundary: [
          { x: 3000, y: 0 },
          { x: 4200, y: 0 },
          { x: 4200, y: 800 },
          { x: 3000, y: 800 },
        ],
      }),
    );

    const settings = {
      ...defaultPdfSettings(),
      includeFinalAppearance: false,
      includeTechnicalDrawing: true,
      includeMaterialLayout: false,
      includeCutList: false,
      includeCuttingDiagrams: false,
      includeInstallationInstructions: false,
    };

    const bytes = await buildPdfDocument({
      project,
      settings,
      layouts: [],
      cutList: [],
      cuttingDiagrams: [],
      projectStats: computeProjectStats(project),
    });

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(3);
  });

  it('renders a wide project overview in landscape', async () => {
    const project = createEmptyProject('Wide');
    project.surfaces.push(
      createSurface({
        name: 'Wide Surface',
        outerBoundary: [
          { x: 0, y: 0 },
          { x: 4000, y: 0 },
          { x: 4000, y: 800 },
          { x: 0, y: 800 },
        ],
      }),
    );
    const settings = {
      ...defaultPdfSettings(),
      includeFinalAppearance: true,
      includeTechnicalDrawing: false,
      includeMaterialLayout: false,
      includeCutList: false,
      includeCuttingDiagrams: false,
      includeInstallationInstructions: false,
    };

    const bytes = await buildPdfDocument({
      project,
      settings,
      layouts: [],
      cutList: [],
      cuttingDiagrams: [],
      projectStats: computeProjectStats(project),
    });

    const pdf = await PDFDocument.load(bytes);
    const page = pdf.getPage(1);
    const size = page.getSize();
    expect(size.width).toBeGreaterThan(size.height);
  });
});
