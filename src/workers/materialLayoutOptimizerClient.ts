import { optimizeMaterialLayout, type OptimizeInput, type OptimizeResult } from '@/domain/materialLayout/optimizeMaterialLayout';

// MVP: synchronous fallback. The Vite-based Worker can be wired in by switching
// this implementation to dynamic-import the .worker?worker module. We keep the
// API Promise-based so the caller does not need to change.
export const runOptimizer = async (request: OptimizeInput[]): Promise<OptimizeResult[]> => {
  return Promise.resolve(request.map(optimizeMaterialLayout));
};
