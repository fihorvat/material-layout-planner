import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createEmptyProject, defaultDrawingStyle } from '@/types';
import { useHistoryStore, useProjectStore, useSelectionStore } from '@/state';
import { useSelectionClipboardStore } from '../selectionClipboard';
import { EditorPage } from '../EditorPage';

describe('editor copy paste integration', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useSelectionStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
    useSelectionClipboardStore.getState().resetForTests();
    if (typeof localStorage.clear === 'function') {
      localStorage.clear();
    }

    const project = createEmptyProject('Editor', {
      id: 'prj_editor',
      now: '2026-05-22T00:00:00.000Z',
    });
    project.drawingEntities = [
      {
        id: 'dwg_1',
        type: 'line',
        start: { x: 0, y: 0 },
        end: { x: 25, y: 0 },
        showDimension: false,
        style: defaultDrawingStyle(),
      },
    ];
    useProjectStore.getState().replaceProject(project);
  });

  it('shows copy and paste in the toolbar with the correct enabled state and pastes via Ctrl+V', () => {
    useSelectionStore.getState().select({ kind: 'line', id: 'dwg_1' });

    render(<EditorPage />);

    const copyButton = screen.getByRole('button', { name: /copy selection/i });
    const pasteButton = screen.getByRole('button', { name: /paste selection/i });
    expect(copyButton).toBeEnabled();
    expect(pasteButton).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(copyButton);
    expect(screen.getByRole('button', { name: /paste selection/i })).not.toHaveAttribute(
      'aria-disabled',
    );

    fireEvent.keyDown(window, { key: 'v', ctrlKey: true });

    const drawingEntities = useProjectStore.getState().project.drawingEntities;
    const selected = useSelectionStore.getState().selected;
    expect(drawingEntities).toHaveLength(2);
    expect(selected).toHaveLength(1);
    expect(selected[0]?.kind).toBe('line');
    expect(selected[0]?.id).not.toBe('dwg_1');
  });
});
