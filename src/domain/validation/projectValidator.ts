import type { Project } from '@/types';
import type { Warning } from './warnings';
import { WARNING_MESSAGES } from './warnings';
import { validateSurface } from '@/domain/surfaces/validateSurface';
import { polygonIntersection } from '@/domain/geometry';
import { piecesWarnings } from '@/domain/materialLayout/piecesWarnings';

const mk = (
  id: string,
  code: string,
  severity: Warning['severity'],
  target?: Warning['target'],
): Warning => ({
  id,
  code,
  severity,
  message: WARNING_MESSAGES[code] ?? code,
  target,
});

export const validateProject = (project: Project): Warning[] => {
  const out: Warning[] = [];

  for (const s of project.surfaces) {
    const v = validateSurface(s);
    for (const iss of v.issues) {
      if (iss.code === 'outerSelfIntersecting') {
        out.push(mk(`surface.${s.id}.selfIntersecting`, 'surface.selfIntersecting', 'error', { kind: 'surface', id: s.id }));
      } else if (iss.code === 'holeOutsideOuter') {
        out.push(mk(`surface.${s.id}.hole.${iss.holeIndex}.outside`, 'surface.holeOutside', 'error', { kind: 'opening', surfaceId: s.id, holeIndex: iss.holeIndex ?? 0 }));
      } else if (iss.code === 'holesOverlap') {
        out.push(mk(`surface.${s.id}.hole.${iss.holeIndex}.overlap`, 'surface.holesOverlap', 'error', { kind: 'opening', surfaceId: s.id, holeIndex: iss.holeIndex ?? 0 }));
      }
    }
    if (!s.materialId) {
      out.push(mk(`surface.${s.id}.missingMaterial`, 'surface.missingMaterial', 'warning', { kind: 'surface', id: s.id }));
    }
    if (!s.placementPatternId) {
      out.push(mk(`surface.${s.id}.missingPattern`, 'surface.missingPattern', 'warning', { kind: 'surface', id: s.id }));
    }
  }

  for (const m of project.materials) {
    if (m.thicknessMm <= 0) {
      out.push(mk(`material.${m.id}.thickness`, 'material.thicknessMissing', 'warning', { kind: 'material', id: m.id }));
    }
    if (m.defaultJointMm < 0) {
      out.push(mk(`material.${m.id}.joint`, 'material.invalidJoint', 'warning', { kind: 'material', id: m.id }));
    }
  }

  for (let i = 0; i < project.surfaces.length; i++) {
    for (let j = i + 1; j < project.surfaces.length; j++) {
      const a = project.surfaces[i]!;
      const b = project.surfaces[j]!;
      const overlap = polygonIntersection(
        { outer: a.outerBoundary },
        { outer: b.outerBoundary },
      );
      if (overlap.length > 0) {
        out.push(mk(`surfaces.${a.id}.${b.id}.overlap`, 'surfaces.overlap', 'warning', { kind: 'surface', id: a.id }));
      }
    }
  }

  for (const layout of project.materialLayouts) {
    const material = project.materials.find((m) => m.id === layout.materialId);
    if (!material) continue;
    const pw = piecesWarnings(layout, material);
    for (const entry of pw) {
      for (const w of entry.warnings) {
        out.push(
          mk(
            `${entry.layoutId}.${entry.pieceId}.${w.code}`,
            w.code,
            w.severity,
            { kind: 'piece', layoutId: entry.layoutId, pieceId: entry.pieceId },
          ),
        );
      }
    }
  }

  return out;
};

export const summarizeWarnings = (warnings: Warning[]) => {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  for (const w of warnings) {
    if (w.severity === 'error') errorCount += 1;
    else if (w.severity === 'warning') warningCount += 1;
    else infoCount += 1;
  }
  return { errorCount, warningCount, infoCount };
};
