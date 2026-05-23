import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EditorToolbar } from '../EditorToolbar';
import { useEditorStore, useHistoryStore, useProjectStore, useSelectionStore } from '@/state';

const mockGenerateAndPersist = vi.fn<() => Promise<boolean>>();
const mockExportPdf = vi.fn<() => Promise<void>>();
const mockResolveCurrentMaterialLayoutEntries = vi.fn();

vi.mock('@/features/materialLayout/useGenerateLayout', () => ({
  useGenerateLayout: () => ({
    generateAndPersist: mockGenerateAndPersist,
    running: false,
  }),
}));

vi.mock('../useExportPdf', () => ({
  useExportPdf: () => ({
    exportPdf: mockExportPdf,
    exporting: false,
  }),
}));

vi.mock('../useSaveProject', () => ({
  useSaveProject: () => ({
    saveProject: vi.fn().mockResolvedValue(undefined),
    saving: false,
  }),
}));

vi.mock('@/domain/materialLayout/resolveCurrentMaterialLayouts', () => ({
  resolveCurrentMaterialLayoutEntries: (...args: unknown[]) =>
    mockResolveCurrentMaterialLayoutEntries(...args),
}));

describe('EditorToolbar', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useEditorStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
    useSelectionStore.getState().resetForTests();
    mockGenerateAndPersist.mockReset();
    mockExportPdf.mockReset();
    mockResolveCurrentMaterialLayoutEntries.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('generates layouts before exporting when preview layouts are pending', async () => {
    mockResolveCurrentMaterialLayoutEntries.mockReturnValue([{ layout: {}, status: 'preview' }]);
    mockGenerateAndPersist.mockResolvedValue(true);
    mockExportPdf.mockResolvedValue(undefined);

    render(<EditorToolbar />);

    fireEvent.click(screen.getByRole('button', { name: /export pdf/i }));

    await waitFor(() => {
      expect(mockGenerateAndPersist).toHaveBeenCalledTimes(1);
      expect(mockExportPdf).toHaveBeenCalledTimes(1);
    });
  });

  it('does not export when layout generation fails', async () => {
    mockResolveCurrentMaterialLayoutEntries.mockReturnValue([{ layout: {}, status: 'preview' }]);
    mockGenerateAndPersist.mockResolvedValue(false);

    render(<EditorToolbar />);

    fireEvent.click(screen.getByRole('button', { name: /export pdf/i }));

    await waitFor(() => {
      expect(mockGenerateAndPersist).toHaveBeenCalledTimes(1);
    });
    expect(mockExportPdf).not.toHaveBeenCalled();
  });
});
