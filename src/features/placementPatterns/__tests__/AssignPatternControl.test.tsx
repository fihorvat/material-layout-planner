import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { useProjectStore, useHistoryStore } from '@/state';
import { dispatchCommand, addPlacementPatternCommand } from '@/domain/commands';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';
import { AssignPatternControl } from '../AssignPatternControl';

const seedSurface = (id = 'S1') => {
  useProjectStore.setState((st) => ({
    ...st,
    project: {
      ...st.project,
      surfaces: [
        {
          id,
          name: 'S',
          outerBoundary: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
          holes: [],
          materialId: null,
          placementPatternId: null,
          edgeRules: [],
          connections: [],
          showName: false,
          showDimensions: false,
          showArea: false,
          style: { strokeColor: '#000', strokeWidthPx: 1, fillColor: '#fff', fillOpacity: 1, textColor: '#000' },
        },
      ],
    },
  }));
};

describe('AssignPatternControl', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
    seedSurface();
  });
  afterEach(() => cleanup());

  it('selecting an existing pattern assigns it', () => {
    const p = createPlacementPattern({ name: 'Bond' });
    dispatchCommand(addPlacementPatternCommand({ pattern: p }));

    render(<AssignPatternControl surfaceId="S1" value={null} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: p.id } });

    const surface = useProjectStore.getState().project.surfaces[0];
    expect(surface?.placementPatternId).toBe(p.id);
  });

  it('"Create new..." opens dialog and the created pattern is assigned', () => {
    render(<AssignPatternControl surfaceId="S1" value={null} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '__create__' } });

    const dialog = screen.getByRole('dialog', { name: /create pattern/i });
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'New P' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /^create$/i }));

    const patterns = useProjectStore.getState().project.placementPatterns;
    expect(patterns).toHaveLength(1);
    expect(useProjectStore.getState().project.surfaces[0]?.placementPatternId).toBe(patterns[0]?.id);
  });
});
