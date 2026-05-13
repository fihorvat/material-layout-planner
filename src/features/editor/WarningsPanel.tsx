import { useMemo } from 'react';
import { useProjectStore, useSelectionStore } from '@/state';
import { validateProject } from '@/domain/validation/projectValidator';
import type { Warning } from '@/domain/validation/warnings';
import type { Project } from '@/types';
import styles from './editor.module.css';

const severityColor: Record<Warning['severity'], string> = {
  error: 'var(--mlp-danger)',
  warning: 'var(--mlp-warning)',
  info: 'var(--mlp-info)',
};

type TargetLookups = {
  surfaceNameById: Map<string, string>;
  materialNameById: Map<string, string>;
  patternNameById: Map<string, string>;
  connectionLabelById: Map<string, string>;
  pieceCodeById: Map<string, string>;
};

const buildTargetLookups = (project: Project): TargetLookups => {
  const surfaceNameById = new Map<string, string>();
  for (const s of project.surfaces) surfaceNameById.set(s.id, s.name);

  const materialNameById = new Map<string, string>();
  for (const m of project.materials) materialNameById.set(m.id, m.name);

  const patternNameById = new Map<string, string>();
  for (const p of project.placementPatterns) patternNameById.set(p.id, p.name);

  const connectionLabelById = new Map<string, string>();
  for (const c of project.surfaceConnections) {
    const a = surfaceNameById.get(c.surfaceAId);
    const b = surfaceNameById.get(c.surfaceBId);
    connectionLabelById.set(c.id, a && b ? `${a} ↔ ${b}` : c.id);
  }

  const pieceCodeById = new Map<string, string>();
  for (const layout of project.materialLayouts) {
    for (const piece of layout.pieces) pieceCodeById.set(piece.id, piece.pieceCode);
  }

  return { surfaceNameById, materialNameById, patternNameById, connectionLabelById, pieceCodeById };
};

const labelForTarget = (t: Warning['target'], lk: TargetLookups): string => {
  if (!t) return '';
  switch (t.kind) {
    case 'surface':
      return `Surface ${lk.surfaceNameById.get(t.id) ?? t.id}`;
    case 'opening': {
      const surfaceName = lk.surfaceNameById.get(t.surfaceId) ?? t.surfaceId;
      return `Opening ${surfaceName} #${t.holeIndex + 1}`;
    }
    case 'piece':
      return `Piece ${lk.pieceCodeById.get(t.pieceId) ?? t.pieceId}`;
    case 'connection':
      return `Connection ${lk.connectionLabelById.get(t.id) ?? t.id}`;
    case 'material':
      return `Material ${lk.materialNameById.get(t.id) ?? t.id}`;
    case 'pattern':
      return `Pattern ${lk.patternNameById.get(t.id) ?? t.id}`;
    default:
      return '';
  }
};

export const WarningsPanel = () => {
  const project = useProjectStore((s) => s.project);
  const select = useSelectionStore((s) => s.select);
  const warnings = useMemo(() => validateProject(project), [project]);
  const lookups = useMemo(() => buildTargetLookups(project), [project]);
  if (warnings.length === 0) {
    return <p>No warnings.</p>;
  }
  return (
    <table className={styles.dataTable}>
      <thead>
        <tr>
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
            <td>{labelForTarget(w.target, lookups)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
