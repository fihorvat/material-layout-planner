/// <reference lib="webworker" />
import { optimizeMaterialLayout, type OptimizeInput, type OptimizeResult } from '@/domain/materialLayout/optimizeMaterialLayout';

type WorkerRequest = { id: string; request: OptimizeInput[] };
type WorkerResponse = { id: string; results: OptimizeResult[] };

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, request } = e.data;
  const results: OptimizeResult[] = request.map(optimizeMaterialLayout);
  const response: WorkerResponse = { id, results };
  (self as unknown as { postMessage: (msg: WorkerResponse) => void }).postMessage(response);
};
