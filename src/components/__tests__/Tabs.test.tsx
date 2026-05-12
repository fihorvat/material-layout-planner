import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Tabs } from '../Tabs';

const TABS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
];

describe('Tabs', () => {
  afterEach(() => cleanup());

  it('renders all tabs with correct aria-selected', () => {
    render(<Tabs tabs={TABS} active="b" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
  });

  it('arrow keys move active tab', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={TABS} active="a" onChange={onChange} />);
    const first = screen.getByRole('tab', { name: 'A' });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
