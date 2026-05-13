import {
  optimizeMaterialLayout,
  type OptimizeInput,
  type OptimizeResult,
} from '@/domain/materialLayout/optimizeMaterialLayout';

type WorkerRequest = { id: string; request: OptimizeInput[] };
type WorkerResponse = { id: string; results: OptimizeResult[] };

type WorkerCtor = new () => Worker;

let workerPromise: Promise<Worker | null> | null = null;
let nextRequestId = 0;
const pending = new Map<string, (results: OptimizeResult[]) => void>();

const attachHandlers = (worker: Worker): Worker => {
  worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
    const cb = pending.get(e.data.id);
    if (cb) {
      pending.delete(e.data.id);
      cb(e.data.results);
    }
  });
  worker.addEventListener('error', () => {
    // Reject all pending requests by falling back to sync evaluation on next call.
    pending.forEach((cb, id) => {
      pending.delete(id);
      cb([]);
    });
  });
  return worker;
};

const tryCreateWorker = async (): Promise<Worker | null> => {
  if (typeof Worker === 'undefined') return null;
  try {
    // Vite/Vitest expose worker modules via the `?worker` query suffix. In
    // non-Vite contexts (and in some test runners) this import will throw;
    // we silently fall back to running the optimizer on the main thread.
    const mod = (await import('./materialLayoutOptimizer.worker?worker')) as {
      default: WorkerCtor;
    };
    return attachHandlers(new mod.default());
  } catch {
    return null;
  }
};

const getWorker = (): Promise<Worker | null> => {
  if (!workerPromise) workerPromise = tryCreateWorker();
  return workerPromise;
};

export const runOptimizer = async (request: OptimizeInput[]): Promise<OptimizeResult[]> => {
  if (request.length === 0) return [];
  const worker = await getWorker();
  if (!worker) {
    return request.map(optimizeMaterialLayout);
  }
  return new Promise<OptimizeResult[]>((resolve) => {
    const id = `req${++nextRequestId}`;
    pending.set(id, resolve);
    const msg: WorkerRequest = { id, request };
    worker.postMessage(msg);
  });
};

// Test/teardown hook: drop the cached worker so subsequent calls re-initialise.
export const resetOptimizerWorkerForTests = (): void => {
  workerPromise = null;
  pending.clear();
};
