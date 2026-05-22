import { useProjectStore, useSelectionStore } from '@/state';
import { dispatchCommand, deleteConnectionCommand } from '@/domain/commands';
import { decodeEdgeId } from '@/domain/surfaces/connectSurfaces';
import editorStyles from '@/features/editor/editor.module.css';

const TYPE_LABEL = {
  outsideCorner: 'Outside corner',
  insideCorner: 'Inside corner',
  flatContinuation: 'Flat continuation',
  mitreCut: 'Mitre cut',
  buttJoint: 'Butt joint',
  custom: 'Custom',
} as const;

export const ConnectionList = () => {
  const connections = useProjectStore((s) => s.project.surfaceConnections);
  const surfaces = useProjectStore((s) => s.project.surfaces);
  const select = useSelectionStore((s) => s.select);

  if (connections.length === 0) {
    return <p>No connections yet. Activate the Connection tool (C) and pick two edges.</p>;
  }

  const surfaceName = (id: string) => surfaces.find((s) => s.id === id)?.name ?? id;
  const edgeLabel = (edgeId: string) => {
    const { edgeIndex } = decodeEdgeId(edgeId);
    return `edge ${edgeIndex + 1}`;
  };

  return (
    <table className={editorStyles.dataTable}>
      <thead>
        <tr>
          <th>Type</th>
          <th>Surface A</th>
          <th>Surface B</th>
          <th>Angle</th>
          <th>Joint (mm)</th>
          <th>Overlap</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {connections.map((c) => (
          <tr
            key={c.id}
            style={{ cursor: 'pointer' }}
            onClick={() => select({ kind: 'connection', id: c.id })}
          >
            <td>{TYPE_LABEL[c.connectionType]}</td>
            <td>
              {surfaceName(c.surfaceAId)} ({edgeLabel(c.edgeAId)})
            </td>
            <td>
              {surfaceName(c.surfaceBId)} ({edgeLabel(c.edgeBId)})
            </td>
            <td>
              {c.angleDeg}
              {'°'}
            </td>
            <td>{c.jointAtConnectionMm}</td>
            <td>{c.allowPhysicalOverlap ? `${c.defaultOverlapMm} mm` : '\u2014'}</td>
            <td>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatchCommand(deleteConnectionCommand({ id: c.id }));
                }}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
