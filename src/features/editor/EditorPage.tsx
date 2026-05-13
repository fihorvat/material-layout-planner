import { useEffect, useState } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { ToolRail } from './ToolRail';
import { CanvasStage } from './CanvasStage';
import { PropertiesPanel } from './PropertiesPanel';
import { BottomPanel } from './BottomPanel';
import { ResizableDivider } from '@/components';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { ShortcutsHelpDialog } from './ShortcutsHelpDialog';
import { ErrorBoundary } from './ErrorBoundary';
import { ToastContainer } from '@/components/Toast';
import styles from './editor.module.css';

const LS_KEY = 'mlp:layout';

const DEFAULT = {
  propertiesWidth: 320,
  bottomHeight: 220,
  bottomCollapsed: false,
};

const PROP_MIN = 240;
const PROP_MAX = 520;
const BOTTOM_MIN = 120;
const BOTTOM_MAX = 500;

type LayoutPrefs = typeof DEFAULT;

const loadPrefs = (): LayoutPrefs => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<LayoutPrefs>;
    return {
      propertiesWidth: clamp(parsed.propertiesWidth ?? DEFAULT.propertiesWidth, PROP_MIN, PROP_MAX),
      bottomHeight: clamp(parsed.bottomHeight ?? DEFAULT.bottomHeight, BOTTOM_MIN, BOTTOM_MAX),
      bottomCollapsed: Boolean(parsed.bottomCollapsed ?? false),
    };
  } catch {
    return DEFAULT;
  }
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const EditorPage = () => {
  useKeyboardShortcuts();
  const [prefs, setPrefs] = useState<LayoutPrefs>(() => loadPrefs());
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    const onToggle = () => setHelpOpen((v) => !v);
    window.addEventListener('mlp:toggleShortcutsHelp', onToggle);
    return () => window.removeEventListener('mlp:toggleShortcutsHelp', onToggle);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore quota errors
    }
  }, [prefs]);

  const onResizeProperties = (delta: number) => {
    setPrefs((p) => ({ ...p, propertiesWidth: clamp(p.propertiesWidth - delta, PROP_MIN, PROP_MAX) }));
  };
  const onResizeBottom = (delta: number) => {
    setPrefs((p) => ({ ...p, bottomHeight: clamp(p.bottomHeight - delta, BOTTOM_MIN, BOTTOM_MAX) }));
  };
  const toggleCollapsed = () => setPrefs((p) => ({ ...p, bottomCollapsed: !p.bottomCollapsed }));

  return (
    <ErrorBoundary>
    <div
      className={styles.shell}
      style={{
        gridTemplateRows: prefs.bottomCollapsed
          ? `var(--mlp-toolbar-h) 1fr 32px`
          : `var(--mlp-toolbar-h) 1fr auto ${prefs.bottomHeight}px`,
      }}
    >
      <EditorToolbar />
      <div className={styles.main} style={{
        gridTemplateColumns: `var(--mlp-rail-w) 1fr 4px ${prefs.propertiesWidth}px`,
      }}>
        <ToolRail />
        <CanvasStage />
        <ResizableDivider
          orientation="vertical"
          onResize={onResizeProperties}
          ariaLabel="Resize properties panel"
        />
        <PropertiesPanel />
      </div>
      {!prefs.bottomCollapsed ? (
        <ResizableDivider
          orientation="horizontal"
          onResize={onResizeBottom}
          ariaLabel="Resize bottom panel"
        />
      ) : null}
      <BottomPanel collapsed={prefs.bottomCollapsed} onToggleCollapsed={toggleCollapsed} />
      <ShortcutsHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ToastContainer />
    </div>
    </ErrorBoundary>
  );
};
