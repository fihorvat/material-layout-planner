import { useCallback, useState } from 'react';
import { useProjectStore } from '@/state';
import { useToastStore } from '@/state/toastStore';
import { buildPdfDocument } from '@/domain/pdf';
import { buildCutList } from '@/domain/materialLayout/materialCutList';
import { buildCuttingDiagram, type CuttingDiagram } from '@/domain/materialLayout/cuttingDiagram';
import { computeProjectStats } from '@/domain/materialLayout/layoutStats';
import { resolveCurrentMaterialLayouts } from '@/domain/materialLayout/resolveCurrentMaterialLayouts';

const sanitizeFileName = (name: string): string => {
  const trimmed = name.trim() || 'project';
  return trimmed.replace(/[\\/:*?"<>|]+/g, '_');
};

const triggerDownload = (bytes: Uint8Array, fileName: string): void => {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const blob = new Blob([buf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke so the browser has a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const useExportPdf = () => {
  const [exporting, setExporting] = useState(false);

  const exportPdf = useCallback(async () => {
    const pushToast = useToastStore.getState().pushToast;
    if (exporting) return;
    setExporting(true);
    try {
      const project = useProjectStore.getState().project;
      const layouts = resolveCurrentMaterialLayouts(project);
      const projectForExport = { ...project, materialLayouts: layouts };

      const cutList = buildCutList(projectForExport);

      const cuttingDiagrams: CuttingDiagram[] = [];
      const diagramsByLayoutId: Record<string, CuttingDiagram> = {};
      for (const layout of layouts) {
        const material = project.materials.find((m) => m.id === layout.materialId);
        if (!material) continue;
        const diagram = buildCuttingDiagram(layout, material, {
          bladeKerfMm: project.settings.bladeKerfMm,
        });
        cuttingDiagrams.push(diagram);
        diagramsByLayoutId[layout.id] = diagram;
      }

      const projectStats = computeProjectStats(projectForExport, diagramsByLayoutId);

      const bytes = await buildPdfDocument({
        project: projectForExport,
        settings: project.pdfSettings,
        layouts,
        cutList,
        cuttingDiagrams,
        projectStats,
      });

      triggerDownload(bytes, `${sanitizeFileName(project.name)}.pdf`);
      pushToast('PDF exported.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      useToastStore.getState().pushToast(`PDF export failed: ${message}`, 'error');
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  return { exportPdf, exporting };
};
