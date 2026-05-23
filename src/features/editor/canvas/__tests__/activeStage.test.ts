import { describe, expect, it } from 'vitest';
import { createEmptyProject, defaultSurfaceStyle } from '@/types';
import { newProjectId, newSurfaceId } from '@/domain/ids';
import { computeThumbnailExportPlan, serializeStageCapture } from '../activeStage';

describe('activeStage thumbnail export plan', () => {
  it('uses a 4:3 export frame and centers project content', () => {
    const now = new Date().toISOString();
    const project = createEmptyProject('Thumb', { id: newProjectId(), now });
    project.surfaces.push({
      id: newSurfaceId(),
      name: 'Surface',
      outerBoundary: [
        { x: 100, y: 200 },
        { x: 300, y: 200 },
        { x: 300, y: 300 },
        { x: 100, y: 300 },
      ],
      holes: [],
      materialId: null,
      placementPatternId: null,
      edgeRules: [],
      connections: [],
      showName: true,
      showDimensions: true,
      showArea: true,
      style: defaultSurfaceStyle(),
      holeMeta: [],
    });

    const plan = computeThumbnailExportPlan(project, { targetWidth: 480 });

    expect(plan.width).toBe(480);
    expect(plan.height).toBe(360);
    expect(plan.viewport).not.toBeNull();
    expect(plan.viewport?.scale).toBeCloseTo(2.16, 6);
    expect(plan.viewport?.offsetXPx).toBeCloseTo(-192, 6);
    expect(plan.viewport?.offsetYPx).toBeCloseTo(-360, 6);
  });

  it('returns no fitted viewport for an empty project', () => {
    const now = new Date().toISOString();
    const project = createEmptyProject('Empty', { id: newProjectId(), now });

    const plan = computeThumbnailExportPlan(project, { targetWidth: 480 });

    expect(plan.width).toBe(480);
    expect(plan.height).toBe(360);
    expect(plan.viewport).toBeNull();
  });

  it('serializes overlapping stage capture work', async () => {
    const steps: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = serializeStageCapture(async () => {
      steps.push('first:start');
      await firstGate;
      steps.push('first:end');
      return 'first';
    });

    const second = serializeStageCapture(async () => {
      steps.push('second:start');
      steps.push('second:end');
      return 'second';
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(steps).toEqual(['first:start']);

    releaseFirst();

    await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second']);
    expect(steps).toEqual(['first:start', 'first:end', 'second:start', 'second:end']);
  });
});
