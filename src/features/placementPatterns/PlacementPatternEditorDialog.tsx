import { useEffect, useState } from 'react';
import { useProjectStore } from '@/state';
import {
  dispatchCommand,
  addPlacementPatternCommand,
} from '@/domain/commands';
import { createPlacementPattern } from '@/domain/placementPatterns/placementPattern';
import { PlacementPatternPanel } from './PlacementPatternPanel';
import { ModalCloseButton } from '@/components';

type PlacementPatternEditorDialogProps = {
  open: boolean;
  /** When provided, edits an existing pattern. When omitted, creates a new one. */
  patternId?: string;
  onClose: () => void;
  /** Called with the new pattern id after creation. */
  onCreated?: (id: string) => void;
};

export const PlacementPatternEditorDialog = ({
  open,
  patternId,
  onClose,
  onCreated,
}: PlacementPatternEditorDialogProps) => {
  const patterns = useProjectStore((s) => s.project.placementPatterns);
  const [createName, setCreateName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCreateName('');
      setCreateError(null);
      setCreatedId(null);
    }
  }, [open, patternId]);

  if (!open) return null;

  const isEdit = !!patternId;
  const editId = patternId ?? createdId;

  const submitCreate = () => {
    setCreateError(null);
    const name = createName.trim();
    if (!name) {
      setCreateError('Name is required.');
      return;
    }
    const conflict = patterns.some(
      (p) => p.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (conflict) {
      setCreateError('A pattern with this name already exists.');
      return;
    }
    const next = createPlacementPattern({ name });
    dispatchCommand(addPlacementPatternCommand({ pattern: next }));
    setCreatedId(next.id);
    onCreated?.(next.id);
  };

  return (
    <div
      role="dialog"
      aria-label={isEdit ? 'Edit pattern' : 'Create pattern'}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.4)',
        zIndex: 8000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--mlp-card)',
          color: 'var(--mlp-text)',
          border: '1px solid var(--mlp-border)',
          boxShadow: 'var(--mlp-shadow-lg)',
          borderRadius: 8,
          padding: 20,
          width: editId ? 640 : 460,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>
            {isEdit ? 'Edit pattern' : editId ? 'New pattern' : 'Create pattern'}
          </h2>
          <ModalCloseButton onClose={onClose} />
        </div>

        {editId ? (
          <div style={{ marginTop: 16 }}>
            <PlacementPatternPanel patternId={editId} onDeleted={onClose} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--mlp-muted)' }}>
              Give the pattern a name. You can edit all other fields next.
            </p>
            <label
              style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--mlp-muted)' }}
            >
              <span>Name</span>
              <input
                autoFocus
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitCreate();
                }}
                placeholder="e.g. Running bond — half"
                style={{
                  padding: '4px 6px',
                  background: 'var(--mlp-bg)',
                  color: 'var(--mlp-text)',
                  border: '1px solid var(--mlp-border-strong)',
                  borderRadius: 4,
                  fontSize: 13,
                }}
              />
            </label>
            {createError && (
              <div
                role="alert"
                style={{
                  padding: '6px 10px',
                  background: 'transparent',
                  color: 'var(--mlp-danger)',
                  border: '1px solid var(--mlp-danger)',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                {createError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={onClose}>
                Cancel
              </button>
              <button type="button" onClick={submitCreate}>
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
