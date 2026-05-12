import { useProjectStore, useSelectionStore } from '@/state';
import { surfaceArea } from '@/domain/surfaces/surfaceGeometry';

export const SurfaceList = () => {
  const surfaces = useProjectStore((s) => s.project.surfaces);
  const materials = useProjectStore((s) => s.project.materials);
  const patterns = useProjectStore((s) => s.project.placementPatterns);
  const select = useSelectionStore((s) => s.select);
  if (surfaces.length === 0) {
    return <p>No surfaces yet.</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ textAlign: 'left' }}>
          <th>Name</th>
          <th>Material</th>
          <th>Pattern</th>
          <th>Area (m²)</th>
        </tr>
      </thead>
      <tbody>
        {surfaces.map((s) => {
          const mat = materials.find((m) => m.id === s.materialId);
          const pat = patterns.find((p) => p.id === s.placementPatternId);
          return (
            <tr
              key={s.id}
              style={{ cursor: 'pointer' }}
              onClick={() => select({ kind: 'surface', id: s.id })}
            >
              <td>{s.name}</td>
              <td>{mat?.name ?? '—'}</td>
              <td>{pat?.name ?? '—'}</td>
              <td>{(surfaceArea(s) / 1_000_000).toFixed(3)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
