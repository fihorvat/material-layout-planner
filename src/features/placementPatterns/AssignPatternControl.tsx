import { useState } from 'react';
import { useProjectStore } from '@/state';
import {
  dispatchCommand,
  assignPlacementPatternCommand,
} from '@/domain/commands';
import { PlacementPatternEditorDialog } from './PlacementPatternEditorDialog';

type AssignPatternControlProps = {
  surfaceId: string;
  value: string | null;
};

const CREATE_VALUE = '__create__';

export const AssignPatternControl = ({ surfaceId, value }: AssignPatternControlProps) => {
  const patterns = useProjectStore((s) => s.project.placementPatterns);
  const [dialogOpen, setDialogOpen] = useState(false);

  const onSelect = (next: string) => {
    if (next === CREATE_VALUE) {
      setDialogOpen(true);
      return;
    }
    dispatchCommand(
      assignPlacementPatternCommand({
        surfaceId,
        patternId: next === '' ? null : next,
      }),
    );
  };

  const onCreated = (id: string) => {
    dispatchCommand(
      assignPlacementPatternCommand({ surfaceId, patternId: id }),
    );
  };

  return (
    <>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span>Pattern</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select
            value={value ?? ''}
            onChange={(e) => onSelect(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">— None —</option>
            {patterns.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value={CREATE_VALUE}>+ Create new…</option>
          </select>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            disabled={!value}
            title={value ? 'Edit assigned pattern' : 'Assign a pattern to edit'}
          >
            Edit
          </button>
        </div>
      </label>

      <PlacementPatternEditorDialog
        open={dialogOpen}
        patternId={value ?? undefined}
        onClose={() => setDialogOpen(false)}
        onCreated={onCreated}
      />
    </>
  );
};
