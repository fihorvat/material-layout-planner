import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { useProjectStore, useHistoryStore } from '@/state';
import { PatternList } from '../PatternList';

describe('PatternList', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });
  afterEach(() => cleanup());

  it('shows empty state when no patterns', () => {
    render(<PatternList />);
    expect(screen.getByText(/No patterns yet/i)).toBeInTheDocument();
  });

  it('clicking Add pattern opens dialog and Create dispatches addPlacementPattern', () => {
    render(<PatternList />);
    fireEvent.click(screen.getByRole('button', { name: /add pattern/i }));

    const dialog = screen.getByRole('dialog', { name: /create pattern/i });
    const nameInput = within(dialog).getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'Bond 1/2' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /^create$/i }));

    const patterns = useProjectStore.getState().project.placementPatterns;
    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.name).toBe('Bond 1/2');
  });

  it('rejects duplicate names', () => {
    render(<PatternList />);
    fireEvent.click(screen.getByRole('button', { name: /add pattern/i }));
    const dialog = screen.getByRole('dialog', { name: /create pattern/i });
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'X' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /^create$/i }));
    expect(useProjectStore.getState().project.placementPatterns).toHaveLength(1);

    cleanup();
    render(<PatternList />);
    fireEvent.click(screen.getByRole('button', { name: /add pattern/i }));
    const dialog2 = screen.getByRole('dialog', { name: /create pattern/i });
    fireEvent.change(within(dialog2).getByRole('textbox'), { target: { value: 'X' } });
    fireEvent.click(within(dialog2).getByRole('button', { name: /^create$/i }));
    expect(useProjectStore.getState().project.placementPatterns).toHaveLength(1);
    expect(within(dialog2).getByRole('alert').textContent).toMatch(/already exists/i);
  });
});
