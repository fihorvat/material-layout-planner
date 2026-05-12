import { useMemo } from 'react';
import { useProjectStore, useSelectionStore } from '@/state';
import { validateProject } from '@/domain/validation/projectValidator';
import type { Warning } from '@/domain/validation/warnings';

const severityColor: Record<Warning['severity'], string> = {
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
};

const labelForTarget = (t: Warning['target']): string => {
  if (!t) return '';
  switch (t.kind) {
    case 'surface':
      return `Surface ${t.id}`;
    case 'opening':
      return `Opening ${t.surfaceId}#${t.holeIndex}`;
    case 'piece':
      return `Piece ${t.pieceId}`;
    case 'connection':
      return `Connection ${t.id}`;
    case 'material':
      return `Material ${t.id}`;
    case 'pattern':
      return `Pattern ${t.id}`;
    default:
      return '';
  }
};

export const WarningsPanel = () => {
  const project = useProjectStore((s) => s.project);
  const select = useSelectionStore((s) => s.select);
  const warnings = useMemo(() => validateProject(project), [project]);
  if (warnings.length === 0) {
    return <p>No warnings.</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ textAlign: 'left' }}>
          <th>Sev</th>
          <th>Code</th>
          <th>Message</th>
          <th>Target</th>
        </tr>
      </thead>
      <tbody>
        {warnings.map((w) => (
          <tr
            key={w.id}
            onClick={() => {
              if (w.target?.kind === 'surface') {
                select({ kind: 'surface', id: w.target.id });
              }
            }}
            style={{ cursor: w.target?.kind === 'surface' ? 'pointer' : 'default' }}
          >
            <td>
              <span style={{ color: severityColor[w.severity], fontWeight: 600 }}>
                {w.severity.toUpperCase()}
              </span>
            </td>
            <td>{w.code}</td>
            <td>{w.message}</td>
            <td>{labelForTarget(w.target)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
