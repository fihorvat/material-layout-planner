import type { ToolId } from '@/state';

export type ToolAvailabilityContext = {
  /** True when at least one surface is currently selected. */
  hasSurfaceSelected: boolean;
};

/**
 * Tools that require a surface to be selected to be usable.
 * These tools target an existing surface (e.g. cutting an opening into it,
 * splitting it, or attaching a connection to one of its edges).
 */
const SURFACE_DEPENDENT_TOOLS: ReadonlySet<ToolId> = new Set<ToolId>([
  'opening',
  'splitSurface',
  'connection',
]);

const SURFACE_REQUIRED_REASON =
  'Select a surface first to use this tool.';

export const isToolEnabled = (
  tool: ToolId,
  ctx: ToolAvailabilityContext,
): boolean => {
  if (SURFACE_DEPENDENT_TOOLS.has(tool)) {
    return ctx.hasSurfaceSelected;
  }
  return true;
};

export const toolDisabledReason = (tool: ToolId): string | undefined => {
  if (SURFACE_DEPENDENT_TOOLS.has(tool)) return SURFACE_REQUIRED_REASON;
  return undefined;
};
