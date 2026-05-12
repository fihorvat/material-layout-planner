import { ulid } from 'ulid';

export const newId = (): string => ulid();

export const newProjectId = (): string => `prj_${ulid()}`;
export const newSurfaceId = (): string => `srf_${ulid()}`;
export const newMaterialId = (): string => `mat_${ulid()}`;
export const newPlacementPatternId = (): string => `pat_${ulid()}`;
export const newMaterialLayoutId = (): string => `lay_${ulid()}`;
export const newSurfaceConnectionId = (): string => `con_${ulid()}`;
export const newDrawingEntityId = (): string => `dwg_${ulid()}`;
export const newDimensionId = (): string => `dim_${ulid()}`;
export const newLabelId = (): string => `lbl_${ulid()}`;
export const newOpeningId = (): string => `opn_${ulid()}`;
export const newEdgeRuleId = (): string => `edg_${ulid()}`;
export const newMaterialPieceId = (): string => `pcs_${ulid()}`;
export const newCommandId = (): string => `cmd_${ulid()}`;
export const newBackgroundImageId = (): string => `bgi_${ulid()}`;
