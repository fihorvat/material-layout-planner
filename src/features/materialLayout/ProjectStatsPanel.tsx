import { useProjectStore } from '@/state';
import { computeProjectStats } from '@/domain/materialLayout/layoutStats';
import { formatArea } from '@/domain/units';
import editorStyles from '@/features/editor/editor.module.css';

export const ProjectStatsPanel = () => {
  const project = useProjectStore((s) => s.project);
  const stats = computeProjectStats(project);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
      <section>
        <h4 style={{ margin: '4px 0' }}>Project summary</h4>
        <div>Total visible area: {formatArea(stats.totalVisibleAreaMm2)}</div>
        <div>Total physical area: {formatArea(stats.totalPhysicalAreaMm2)}</div>
        <div>Total purchased area: {formatArea(stats.totalPurchasedAreaMm2)}</div>
        <div>Total waste: {formatArea(stats.totalWasteAreaMm2)} ({stats.totalWastePercent.toFixed(1)} %)</div>
        <div>Pieces: {stats.totalPieces} (full: {stats.totalFullUnits}, cut: {stats.totalCutPieces})</div>
      </section>
      {stats.perMaterial.length > 0 ? (
        <section>
          <h4 style={{ margin: '4px 0' }}>Per material</h4>
          <table className={editorStyles.dataTable}>
            <thead>
              <tr>
                <th>Material</th>
                <th>Full</th>
                <th>Cut</th>
                <th>Purchased</th>
                <th>Waste %</th>
              </tr>
            </thead>
            <tbody>
              {stats.perMaterial.map((m) => (
                <tr key={m.materialId}>
                  <td>{m.materialName}</td>
                  <td>{m.fullUnits}</td>
                  <td>{m.cutPieces}</td>
                  <td>{formatArea(m.purchasedAreaMm2)}</td>
                  <td>{m.wastePercent.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
};
