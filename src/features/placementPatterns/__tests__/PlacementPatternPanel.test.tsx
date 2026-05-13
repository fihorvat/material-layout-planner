import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useProjectStore, useHistoryStore } from '@/state';
import { dispatchCommand, addPlacementPatternCommand } from '@/domain/commands';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';
import { PlacementPatternPanel } from '../PlacementPatternPanel';

describe('PlacementPatternPanel', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });
  afterEach(() => cleanup());

  it('updates name immediately via updatePlacementPatternCommand', () => {
    const p = createPlacementPattern({ name: 'P' });
    dispatchCommand(addPlacementPatternCommand({ pattern: p }));

    render(<PlacementPatternPanel patternId={p.id} />);
    const nameInput = screen.getByDisplayValue('P');
    fireEvent.change(nameInput, { target: { value: 'Renamed' } });

    expect(useProjectStore.getState().project.placementPatterns[0]?.name).toBe('Renamed');
  });

  it('changing type dispatches update', () => {
    const p = createPlacementPattern({ name: 'P' });
    dispatchCommand(addPlacementPatternCommand({ pattern: p }));

    render(<PlacementPatternPanel patternId={p.id} />);
    const bondHalfButton = screen.getByRole('button', { name: /Bond 1\/2\./i });
    fireEvent.click(bondHalfButton);

    expect(useProjectStore.getState().project.placementPatterns[0]?.type).toBe(
      'runningBondHalf',
    );
  });

  it('joint length input commits on blur', () => {
    const p = createPlacementPattern({ name: 'P', jointMm: 3 });
    dispatchCommand(addPlacementPatternCommand({ pattern: p }));

    render(<PlacementPatternPanel patternId={p.id} />);
    const jointInput = screen.getByDisplayValue('3');
    fireEvent.change(jointInput, { target: { value: '5 mm' } });
    // still 3 before blur
    expect(useProjectStore.getState().project.placementPatterns[0]?.jointMm).toBe(3);
    fireEvent.blur(jointInput);
    expect(useProjectStore.getState().project.placementPatterns[0]?.jointMm).toBe(5);
  });

  it('manualOffsetLocked toggle updates priority', () => {
    const p = createPlacementPattern({ name: 'P' });
    dispatchCommand(addPlacementPatternCommand({ pattern: p }));

    render(<PlacementPatternPanel patternId={p.id} />);
    const lockToggle = screen.getByRole('checkbox', { name: /lock manual offset/i });
    fireEvent.click(lockToggle);
    expect(
      useProjectStore.getState().project.placementPatterns[0]?.optimizationPriority
        .manualOffsetLocked,
    ).toBe(true);
  });
});
