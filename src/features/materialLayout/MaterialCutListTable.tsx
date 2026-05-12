import { useProjectStore } from '@/state';
import { buildCutList } from '@/domain/materialLayout/materialCutList';

const summarizeCodes = (codes: string[]): string => {
  if (codes.length <= 2) return codes.join(', ');
  return `${codes[0]}, ${codes[1]} +${codes.length - 2}`;
};

export const MaterialCutListTable = () => {
  const project = useProjectStore((s) => s.project);
  const items = buildCutList(project);
  if (items.length === 0) {
    return <p>No cut list yet. Generate a material layout first.</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
          <th>Piece</th>
          <th>Surface</th>
          <th>Material</th>
          <th>Size (mm)</th>
          <th>Qty</th>
          <th>Thickness</th>
          <th>Overlap</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it, i) => (
          <tr key={i}>
            <td>{summarizeCodes(it.pieceCodes)}</td>
            <td>{it.surfaceName}</td>
            <td>{it.materialName}</td>
            <td>{it.widthMm} \u00D7 {it.heightMm}</td>
            <td>{it.quantity}</td>
            <td>{it.thicknessMm}</td>
            <td>{it.overlapIncluded ? 'Yes' : '—'}</td>
            <td>{it.notes.join('; ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
