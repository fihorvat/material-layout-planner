import { useEffect, useState } from 'react';
import type { Material } from '@/types';
import { defaultMaterialStyle } from '@/types';
import { parseLength, ParseLengthError } from '@/domain/units';
import { useProjectStore } from '@/state';
import {
  dispatchCommand,
  addMaterialCommand,
  updateMaterialCommand,
} from '@/domain/commands';
import { createMaterial } from '@/domain/materials/material';

export type MaterialEditorProps = {
  open: boolean;
  material?: Material;
  onClose: () => void;
};

type Form = {
  name: string;
  unitWidth: string;
  unitHeight: string;
  thickness: string;
  defaultJoint: string;
  minPieceWidth: string;
  minPieceHeight: string;
  defaultOrientation: 'horizontal' | 'vertical';
  fillColor: string;
  labelColor: string;
  jointColor: string;
};

const initialForm = (m?: Material): Form => {
  const style = m?.style ?? defaultMaterialStyle();
  return {
    name: m?.name ?? '',
    unitWidth: m ? String(m.unitWidthMm) : '600',
    unitHeight: m ? String(m.unitHeightMm) : '300',
    thickness: m ? String(m.thicknessMm) : '10',
    defaultJoint: m ? String(m.defaultJointMm) : '3',
    minPieceWidth: m ? String(m.minPieceWidthMm) : '30',
    minPieceHeight: m ? String(m.minPieceHeightMm) : '30',
    defaultOrientation: m?.defaultOrientation ?? 'horizontal',
    fillColor: style.fillColor,
    labelColor: style.labelColor,
    jointColor: style.jointColor,
  };
};

const parseLen = (s: string): number => parseLength(s).mm;

export const MaterialEditor = ({ open, material, onClose }: MaterialEditorProps) => {
  const materials = useProjectStore((s) => s.project.materials);
  const [form, setForm] = useState<Form>(() => initialForm(material));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialForm(material));
      setError(null);
    }
  }, [open, material]);

  if (!open) return null;

  const setField = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = () => {
    setError(null);
    const name = form.name.trim();
    if (!name) {
      setError('Name is required.');
      return;
    }
    const nameConflict = materials.some(
      (m) => m.name.trim().toLowerCase() === name.toLowerCase() && m.id !== material?.id,
    );
    if (nameConflict) {
      setError('A material with this name already exists.');
      return;
    }
    let unitWidthMm: number;
    let unitHeightMm: number;
    let thicknessMm: number;
    let defaultJointMm: number;
    let minPieceWidthMm: number;
    let minPieceHeightMm: number;
    try {
      unitWidthMm = parseLen(form.unitWidth);
      unitHeightMm = parseLen(form.unitHeight);
      thicknessMm = parseLen(form.thickness);
      defaultJointMm = parseLen(form.defaultJoint);
      minPieceWidthMm = parseLen(form.minPieceWidth);
      minPieceHeightMm = parseLen(form.minPieceHeight);
    } catch (e) {
      setError(
        e instanceof ParseLengthError
          ? `Invalid length value (${e.code}).`
          : 'Invalid length value.',
      );
      return;
    }
    if (unitWidthMm <= 0 || unitHeightMm <= 0 || thicknessMm <= 0) {
      setError('Unit width, unit height and thickness must be positive.');
      return;
    }
    if (minPieceWidthMm > unitWidthMm) {
      setError('Minimum piece width cannot exceed unit width.');
      return;
    }
    if (minPieceHeightMm > unitHeightMm) {
      setError('Minimum piece height cannot exceed unit height.');
      return;
    }
    const style = {
      fillColor: form.fillColor,
      labelColor: form.labelColor,
      jointColor: form.jointColor,
    };
    try {
      if (material) {
        dispatchCommand(
          updateMaterialCommand({
            id: material.id,
            patch: {
              name,
              unitWidthMm,
              unitHeightMm,
              thicknessMm,
              defaultJointMm,
              minPieceWidthMm,
              minPieceHeightMm,
              defaultOrientation: form.defaultOrientation,
              style,
            },
          }),
        );
      } else {
        const next = createMaterial({
          name,
          unitWidthMm,
          unitHeightMm,
          thicknessMm,
          defaultJointMm,
          minPieceWidthMm,
          minPieceHeightMm,
          defaultOrientation: form.defaultOrientation,
          style,
        });
        dispatchCommand(addMaterialCommand({ material: next }));
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 12,
    color: '#374151',
  };
  const inputStyle: React.CSSProperties = {
    padding: '4px 6px',
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    fontSize: 13,
  };

  return (
    <div
      role="dialog"
      aria-label={material ? 'Edit material' : 'Create material'}
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
          background: 'white',
          borderRadius: 8,
          padding: 20,
          width: 480,
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>
            {material ? 'Edit material' : 'Create material'}
          </h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginTop: 16,
          }}
        >
          <label style={{ ...labelStyle, gridColumn: '1 / span 2' }}>
            Name
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Unit width
            <input
              value={form.unitWidth}
              onChange={(e) => setField('unitWidth', e.target.value)}
              style={inputStyle}
              placeholder="e.g. 600 mm"
            />
          </label>
          <label style={labelStyle}>
            Unit height
            <input
              value={form.unitHeight}
              onChange={(e) => setField('unitHeight', e.target.value)}
              style={inputStyle}
              placeholder="e.g. 300 mm"
            />
          </label>

          <label style={labelStyle}>
            Thickness
            <input
              value={form.thickness}
              onChange={(e) => setField('thickness', e.target.value)}
              style={inputStyle}
              placeholder="e.g. 20 mm"
            />
          </label>
          <label style={labelStyle}>
            Default joint / gap
            <input
              value={form.defaultJoint}
              onChange={(e) => setField('defaultJoint', e.target.value)}
              style={inputStyle}
              placeholder="e.g. 3 mm"
            />
          </label>

          <label style={labelStyle}>
            Min piece width
            <input
              value={form.minPieceWidth}
              onChange={(e) => setField('minPieceWidth', e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Min piece height
            <input
              value={form.minPieceHeight}
              onChange={(e) => setField('minPieceHeight', e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ ...labelStyle, gridColumn: '1 / span 2' }}>
            Default orientation
            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#111827' }}>
              <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="radio"
                  name="orientation"
                  checked={form.defaultOrientation === 'horizontal'}
                  onChange={() => setField('defaultOrientation', 'horizontal')}
                />
                Horizontal
              </label>
              <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="radio"
                  name="orientation"
                  checked={form.defaultOrientation === 'vertical'}
                  onChange={() => setField('defaultOrientation', 'vertical')}
                />
                Vertical
              </label>
            </div>
          </label>

          <label style={labelStyle}>
            Fill color
            <input
              type="color"
              value={form.fillColor}
              onChange={(e) => setField('fillColor', e.target.value)}
              style={{ ...inputStyle, padding: 2, height: 30 }}
            />
          </label>
          <label style={labelStyle}>
            Label color
            <input
              type="color"
              value={form.labelColor}
              onChange={(e) => setField('labelColor', e.target.value)}
              style={{ ...inputStyle, padding: 2, height: 30 }}
            />
          </label>
          <label style={labelStyle}>
            Joint color
            <input
              type="color"
              value={form.jointColor}
              onChange={(e) => setField('jointColor', e.target.value)}
              style={{ ...inputStyle, padding: 2, height: 30 }}
            />
          </label>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              padding: '6px 10px',
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={onSubmit}>
            {material ? 'Save changes' : 'Create material'}
          </button>
        </div>
      </div>
    </div>
  );
};
