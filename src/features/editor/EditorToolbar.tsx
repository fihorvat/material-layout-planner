import { useEffect, useState } from 'react';
import { IconButton, ThemeToggle } from '@/components';
import {
  useEditorStore,
  useProjectStore,
  useHistoryStore,
  clampZoom,
} from '@/state';
import { undo, redo } from '@/domain/commands';
import { useGenerateLayout } from '@/features/materialLayout/useGenerateLayout';
import { useSaveProject } from './useSaveProject';
import { FileMenu } from './FileMenu';
import styles from './editor.module.css';

export const EditorToolbar = () => {
  const viewport = useEditorStore((s) => s.viewport);
  const setViewport = useEditorStore((s) => s.setViewport);
  const zoomAt = useEditorStore((s) => s.zoomAt);
  const resetViewport = useEditorStore((s) => s.resetViewport);
  const gridVisible = useEditorStore((s) => s.gridVisible);
  const setGridVisible = useEditorStore((s) => s.setGridVisible);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const setSnap = useEditorStore((s) => s.setSnap);
  const drawingModeEnabled = useEditorStore((s) => s.drawingModeEnabled);
  const toggleDrawingMode = useEditorStore((s) => s.toggleDrawingMode);

  const project = useProjectStore((s) => s.project);
  const isDirty = useProjectStore((s) => s.isDirty);
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);
  const patchProject = useProjectStore((s) => s.patchProject);

  const past = useHistoryStore((s) => s.past);
  const future = useHistoryStore((s) => s.future);

  const { generateAndPersist, running: generating } = useGenerateLayout();
  const { saveProject, saving } = useSaveProject();

  const [name, setName] = useState(project.name);
  useEffect(() => {
    setName(project.name);
  }, [project.name]);

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed === project.name) {
      setName(project.name);
      return;
    }
    patchProject((d) => {
      d.name = trimmed;
    });
  };

  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const zoomPercent = Math.round(viewport.scale * 100);

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Editor toolbar">
      <FileMenu />
      <span className={styles.toolbarSep} aria-hidden />
      <IconButton label="Undo" shortcut="Ctrl+Z" disabled={past.length === 0} onClick={() => undo()}>
        <span aria-hidden>{'\u21B6'}</span>
      </IconButton>
      <IconButton label="Redo" shortcut="Ctrl+Shift+Z" disabled={future.length === 0} onClick={() => redo()}>
        <span aria-hidden>{'\u21B7'}</span>
      </IconButton>
      <IconButton
        label={saving ? 'Saving\u2026' : 'Save project'}
        shortcut="Ctrl+S"
        disabled={saving}
        onClick={() => void saveProject()}
      >
        <span aria-hidden>{'\u{1F4BE}'}</span>
      </IconButton>
      <span className={styles.toolbarSep} aria-hidden />
      <IconButton label="Zoom out" shortcut="-" onClick={() => zoomAt(center, 1 / 1.2)}>
        <span aria-hidden>-</span>
      </IconButton>
      <span className={styles.zoomValue} aria-label="Zoom percent">{zoomPercent}%</span>
      <IconButton label="Zoom in" shortcut="+" onClick={() => zoomAt(center, 1.2)}>
        <span aria-hidden>+</span>
      </IconButton>
      <IconButton label="Fit to content" shortcut="F" onClick={() => resetViewport()}>
        <span aria-hidden>{'\u26F6'}</span>
      </IconButton>
      <IconButton label="Reset zoom" shortcut="0" onClick={() => setViewport({ ...viewport, scale: clampZoom(1) })}>
        <span aria-hidden>1:1</span>
      </IconButton>
      <span className={styles.toolbarSep} aria-hidden />
      <IconButton label={gridVisible ? 'Hide grid' : 'Show grid'} shortcut="G" active={gridVisible} onClick={() => setGridVisible(!gridVisible)}>
        <span aria-hidden>#</span>
      </IconButton>
      <IconButton label={snapEnabled ? 'Disable snap' : 'Enable snap'} shortcut="S" active={snapEnabled} onClick={() => setSnap(!snapEnabled)}>
        <span aria-hidden>{'\u25C7'}</span>
      </IconButton>
      <IconButton
        label={drawingModeEnabled ? 'Disable drawing aids' : 'Enable drawing aids'}
        shortcut=""
        active={drawingModeEnabled}
        onClick={() => toggleDrawingMode()}
      >
        <span aria-hidden>{'\u25A3'}</span>
      </IconButton>
      <span className={styles.toolbarSep} aria-hidden />
      <IconButton
        label={generating ? 'Generating layout\u2026' : 'Generate material layout'}
        shortcut=""
        disabled={generating}
        onClick={() => void generateAndPersist()}
      >
        <span aria-hidden>{generating ? '\u29D7' : '\u25A6'}</span>
      </IconButton>
      <IconButton label="Export PDF" shortcut="" onClick={() => {}}>
        <span aria-hidden>PDF</span>
      </IconButton>
      <span className={styles.toolbarSpacer} />
      <ThemeToggle />
      <span className={styles.toolbarSep} aria-hidden />
      <div className={styles.toolbarRight}>
        <input
          aria-label="Project name"
          className={styles.projectNameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setName(project.name);
              e.currentTarget.blur();
            }
          }}
        />
        {isDirty ? <span className={styles.dirty} title="Unsaved changes">{'\u2022'}</span> : null}
        <span title={lastSavedAt ?? 'never'}>
          {lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Not saved'}
        </span>
      </div>
    </div>
  );
};
