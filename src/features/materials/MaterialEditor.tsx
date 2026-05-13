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
import { ModalCloseButton } from '@/components';

type MaterialEditorProps = {
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
    color: 'var(--mlp-muted)',
  };
  const inputStyle: React.CSSProperties = {
    padding: '4px 6px',
    background: 'var(--mlp-bg)',
    color: 'var(--mlp-text)',
    border: '1px solid var(--mlp-border-strong)',
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
          background: 'var(--mlp-card)',
          color: 'var(--mlp-text)',
          border: '1px solid var(--mlp-border)',
          boxShadow: 'var(--mlp-shadow-lg)',
          borderRadius: 8,
          padding: 20,
          width: 960,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>
            {material ? 'Edit material' : 'Create material'}
          </h2>
          <ModalCloseButton onClose={onClose} />
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

          <p
            style={{
              gridColumn: '1 / span 2',
              margin: 0,
              padding: '6px 8px',
              background: 'var(--mlp-surface-2)',
              border: '1px solid var(--mlp-border)',
              borderRadius: 4,
              fontSize: 12,
              color: 'var(--mlp-muted)',
            }}
          >
            Dimensions are in <strong>millimeters</strong> by default. You can also type
            <code style={{ margin: '0 4px' }}>600 mm</code>,
            <code style={{ margin: '0 4px' }}>60 cm</code> or
            <code style={{ margin: '0 4px' }}>0.6 m</code>.
          </p>

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

          <div style={{ ...labelStyle, gridColumn: '1 / span 2' }}>
            <span>Default orientation</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <OrientationOption
                value="horizontal"
                selected={form.defaultOrientation === 'horizontal'}
                fillColor={form.fillColor}
                jointColor={form.jointColor}
                onSelect={() => setField('defaultOrientation', 'horizontal')}
              />
              <OrientationOption
                value="vertical"
                selected={form.defaultOrientation === 'vertical'}
                fillColor={form.fillColor}
                jointColor={form.jointColor}
                onSelect={() => setField('defaultOrientation', 'vertical')}
              />
            </div>
          </div>

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
              background: 'transparent',
              color: 'var(--mlp-danger)',
              border: '1px solid var(--mlp-danger)',
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

type OrientationOptionProps = {
  value: 'horizontal' | 'vertical';
  selected: boolean;
  fillColor: string;
  jointColor: string;
  onSelect: () => void;
};

const OrientationOption = ({
  value,
  selected,
  fillColor,
  jointColor,
  onSelect,
}: OrientationOptionProps) => {
  const label = value === 'horizontal' ? 'Horizontal' : 'Vertical';
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${label} orientation`}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: 8,
        border: `2px solid ${selected ? 'var(--mlp-accent)' : 'var(--mlp-border-strong)'}`,
        background: selected ? 'var(--mlp-accent-soft)' : 'var(--mlp-surface)',
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      <OrientationPreview
        orientation={value}
        fillColor={fillColor}
        jointColor={jointColor}
      />
      <span style={{ fontSize: 12, fontWeight: selected ? 600 : 400, color: 'var(--mlp-text)' }}>
        {label}
      </span>
    </button>
  );
};

type OrientationPreviewProps = {
  orientation: 'horizontal' | 'vertical';
  fillColor: string;
  jointColor: string;
};

// Renders a small running-bond preview to make the orientation choice visual.
const OrientationPreview = ({ orientation, fillColor, jointColor }: OrientationPreviewProps) => {
  const W = 100;
  const H = 60;
  const isHorizontal = orientation === 'horizontal';
  // Brick dimensions in preview-units; horizontal = wider than tall.
  const brickW = isHorizontal ? 28 : 14;
  const brickH = isHorizontal ? 12 : 24;
  const gap = 2;
  const stepX = brickW + gap;
  const stepY = brickH + gap;
  const rows = Math.ceil(H / stepY) + 1;
  const cols = Math.ceil(W / stepX) + 2;
  const rects: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 1 ? stepX / 2 : 0;
    for (let c = -1; c < cols; c++) {
      rects.push({ x: c * stepX + offset, y: r * stepY });
    }
  }
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', borderRadius: 3, background: jointColor }}
      aria-hidden
    >
      <clipPath id={`clip-${orientation}`}>
        <rect x={0} y={0} width={W} height={H} />
      </clipPath>
      <g clipPath={`url(#clip-${orientation})`}>
        {rects.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={brickW}
            height={brickH}
            fill={fillColor}
            stroke={jointColor}
            strokeWidth={0.5}
          />
        ))}
      </g>
    </svg>
  );
};
