import { useMemo } from 'react';
import type { MaterialLayout } from '@/types';
import { useProjectStore } from '@/state';
import { generateLayoutsForProject } from '@/domain/materialLayout/generateLayoutsForProject';
import { computeLayoutStats } from '@/domain/materialLayout/layoutStats';
import { formatArea } from '@/domain/units';
import editorStyles from '@/features/editor/editor.module.css';
import { useGenerateLayout } from './useGenerateLayout';

type Row = { layout: MaterialLayout; status: 'optimized' | 'preview' };

/**
 * Lists every surface that has both a material and a placement pattern
 * assigned. For each such surface we either show the persisted/optimized
 * layout (when the snapshot still matches the current assignment) or a
 * live, non-optimized preview computed from the current project state.
 *
 * This keeps the panel in lock-step with what's drawn on the canvas by
 * `MaterialLayoutLayer`, so the user immediately sees the consequence of
 * assigning a material/pattern to a surface even before pressing the
 * optimize button.
 */
export const LayoutsListPanel = () => {
  const project = useProjectStore((s) => s.project);
  const { generateAndPersist, running } = useGenerateLayout();

  const rows = useMemo<Row[]>(() => {
    const live = generateLayoutsForProject(project);
    const persistedBySurface = new Map<string, MaterialLayout>();
    for (const l of project.materialLayouts) persistedBySurface.set(l.surfaceId, l);
    return live.map((l) => {
      const persisted = persistedBySurface.get(l.surfaceId);
      // Match `MaterialLayoutLayer`: the persisted optimizer result is only
      // still valid when its snapshot (material / pattern / edgeRules)
      // hasn't been edited. The store replaces those object references on
      // every patch, so reference equality detects stale snapshots cheaply.
      if (
        persisted &&
        persisted.materialId === l.materialId &&
        persisted.placementPatternId === l.placementPatternId &&
        persisted.settingsSnapshot.material === l.settingsSnapshot.material &&
        persisted.settingsSnapshot.placementPattern === l.settingsSnapshot.placementPattern &&
        persisted.settingsSnapshot.edgeRules === l.settingsSnapshot.edgeRules
      ) {
        return { layout: persisted, status: 'optimized' as const };
      }
      return { layout: l, status: 'preview' as const };
    });
  }, [project]);

  if (rows.length === 0) {
    return (
      <p style={{ margin: 0, color: 'var(--mlp-muted)', fontSize: 13 }}>
        No layouts yet. Assign a material and a placement pattern to a surface
        to see its layout here.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <strong style={{ fontSize: 13 }}>Layouts</strong>
        <button
          type="button"
          disabled={running}
          onClick={() => void generateAndPersist()}
        >
          {running ? 'Optimizing\u2026' : 'Optimize all'}
        </button>
      </div>
      <table className={editorStyles.dataTable}>
        <thead>
          <tr>
            <th>Surface</th>
            <th>Material</th>
            <th>Pattern</th>
            <th>Pieces</th>
            <th>Full</th>
            <th>Cut</th>
            <th>Purchased</th>
            <th>Waste</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ layout, status }) => {
            const surface = project.surfaces.find(
              (s) => s.id === layout.surfaceId,
            );
            const material = project.materials.find(
              (m) => m.id === layout.materialId,
            );
            const pattern = project.placementPatterns.find(
              (p) => p.id === layout.placementPatternId,
            );
            if (!surface || !material || !pattern) return null;
            const stats = computeLayoutStats(layout, material);
            return (
              <tr
                key={`${layout.surfaceId}:${layout.materialId}:${layout.placementPatternId}`}
              >
                <td>{surface.name}</td>
                <td>
                  <span
                    aria-hidden
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: material.style.fillColor,
                      border: '1px solid var(--mlp-border-strong)',
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                  {material.name}
                </td>
                <td>{pattern.name}</td>
                <td>{stats.totalPieceCount}</td>
                <td>{stats.fullUnitCount}</td>
                <td>{stats.cutPieceCount}</td>
                <td>{formatArea(stats.purchasedMaterialAreaMm2)}</td>
                <td>{stats.wastePercent.toFixed(1)}%</td>
                <td>
                  {status === 'optimized'
                    ? `Optimized ${new Date(layout.generatedAt).toLocaleTimeString()}`
                    : 'Live preview'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
