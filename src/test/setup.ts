import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';

if (!('text' in Blob.prototype) || typeof (Blob.prototype as { text?: unknown }).text !== 'function') {
  // jsdom's Blob lacks text()/arrayBuffer(); swap in Node's Blob which has them.
  (globalThis as unknown as { Blob: typeof Blob }).Blob = NodeBlob as unknown as typeof Blob;
}
