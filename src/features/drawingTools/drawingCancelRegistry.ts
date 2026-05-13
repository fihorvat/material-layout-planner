/**
 * Registry of "cancel" callbacks for active drawing tools.
 *
 * Each tool (line, rectangle, polygon, surface, …) registers its `cancel`
 * function while its hook is mounted. The global Escape keyboard handler
 * calls every registered cancel so an in-progress drawing is always
 * discarded — regardless of which DOM element currently has focus.
 */

type CancelFn = () => void;

const handlers: Set<CancelFn> = new Set();

export const registerDrawingCancel = (fn: CancelFn): (() => void) => {
  handlers.add(fn);
  return () => {
    handlers.delete(fn);
  };
};

export const cancelAllDrawings = (): void => {
  for (const fn of handlers) {
    try {
      fn();
    } catch {
      // Ignore individual cancel failures so one bad handler can't break others.
    }
  }
};
