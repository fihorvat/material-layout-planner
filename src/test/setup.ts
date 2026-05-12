import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { vi } from 'vitest';
import React from 'react';

vi.mock('react-konva', () => {
  const passthrough =
    (tag: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, ...props }: any) =>
      React.createElement(tag, props, children);
  return {
    Stage: passthrough('div'),
    Layer: passthrough('div'),
    Group: passthrough('g'),
    Rect: passthrough('div'),
    Line: passthrough('div'),
    Circle: passthrough('div'),
    Text: passthrough('span'),
    Path: passthrough('div'),
    Arrow: passthrough('div'),
    Image: passthrough('div'),
  };
});

if (!('text' in Blob.prototype) || typeof (Blob.prototype as { text?: unknown }).text !== 'function') {
  // jsdom's Blob lacks text()/arrayBuffer(); swap in Node's Blob which has them.
  (globalThis as unknown as { Blob: typeof Blob }).Blob = NodeBlob as unknown as typeof Blob;
}
