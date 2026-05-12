import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { Project, PdfExportSettings } from '@/types';
import type { MaterialLayout } from '@/types';
import type { MaterialCutListItem } from '@/domain/materialLayout/materialCutList';
import type { CuttingDiagram } from '@/domain/materialLayout/cuttingDiagram';
import type { ProjectStats } from '@/domain/materialLayout/layoutStats';
import type { Fonts, PageContext } from './layout';
import { drawFooter } from './layout';
import { renderSummaryPage } from './renderSummaryPage';
import { renderInstructionsPage } from './renderInstructionsPage';
import {
  renderTechnicalDrawingPage,
  renderMaterialLayoutPage,
  renderFinalAppearancePage,
} from './renderDrawingPages';
import { renderCutListPage, renderCuttingDiagramPages } from './renderCutListPages';

export type PdfBuildInput = {
  project: Project;
  settings: PdfExportSettings;
  layouts: MaterialLayout[];
  cutList: MaterialCutListItem[];
  cuttingDiagrams: CuttingDiagram[];
  projectStats: ProjectStats;
};

export type PdfBuildContext = PdfBuildInput & {
  doc: PDFDocument;
  fonts: Fonts;
  contexts: PageContext[];
};

export const buildPdfDocument = async (input: PdfBuildInput): Promise<Uint8Array> => {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fonts: Fonts = { regular, bold };
  const build: PdfBuildContext = { ...input, doc, fonts, contexts: [] };

  renderSummaryPage(build);
  if (input.settings.includeFinalAppearance) renderFinalAppearancePage(build);
  if (input.settings.includeTechnicalDrawing) renderTechnicalDrawingPage(build);
  if (input.settings.includeMaterialLayout) renderMaterialLayoutPage(build);
  if (input.settings.includeCutList) renderCutListPage(build);
  if (input.settings.includeCuttingDiagrams) renderCuttingDiagramPages(build);
  if (input.settings.includeInstallationInstructions) renderInstructionsPage(build);

  const total = build.contexts.length;
  build.contexts.forEach((ctx, idx) => {
    drawFooter(ctx, input.project.name, idx + 1, total);
  });

  return doc.save();
};
