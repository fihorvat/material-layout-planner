import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { EditorPage } from '../EditorPage';
import { useEditorStore } from '@/state';

describe('EditorPage', () => {
  beforeEach(() => {
    useEditorStore.getState().resetForTests();
    if (typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
  });
  afterEach(() => {
    cleanup();
  });

  it('renders toolbar, tool rail, and properties panel', () => {
    render(<EditorPage />);
    expect(screen.getByRole('toolbar', { name: /editor toolbar/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/drawing tools/i)).toBeInTheDocument();
    expect(screen.getByText(/select an object/i)).toBeInTheDocument();
  });

  it('clicking the Line tool button sets active tool to "line"', () => {
    render(<EditorPage />);
    const lineBtn = screen.getByRole('button', { name: /^line$/i });
    fireEvent.click(lineBtn);
    expect(useEditorStore.getState().activeTool).toBe('line');
  });

  it('grid toggle flips store value', () => {
    render(<EditorPage />);
    const before = useEditorStore.getState().gridVisible;
    const btn = screen.getByRole('button', { name: before ? /hide grid/i : /show grid/i });
    fireEvent.click(btn);
    expect(useEditorStore.getState().gridVisible).toBe(!before);
  });
});
