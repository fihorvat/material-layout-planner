import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '@/components';
import {
  createProjectRepository,
  downloadProjectJson,
  pickAndImportProjectJson,
  ProjectImportError,
} from '@/storage';
import { useProjectStore } from '@/state';
import { useToastStore } from '@/state/toastStore';
import { useSaveProject } from './useSaveProject';
import styles from './editor.module.css';

const repo = createProjectRepository();

type MenuItem = {
  label: string;
  shortcut?: string;
  onSelect: () => void | Promise<void>;
  disabled?: boolean;
};

const VIEWPORT_PAD = 4;

export const FileMenu = () => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const menuId = useId();

  const project = useProjectStore((s) => s.project);
  const replaceProject = useProjectStore((s) => s.replaceProject);
  const pushToast = useToastStore((s) => s.pushToast);
  const { saveProject } = useSaveProject();

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const btn = buttonRef.current;
      const menu = menuRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const menuW = menu?.offsetWidth ?? 0;
      const menuH = menu?.offsetHeight ?? 0;
      let top = r.bottom + 4;
      if (top + menuH > window.innerHeight - VIEWPORT_PAD) {
        top = Math.max(VIEWPORT_PAD, r.top - menuH - 4);
      }
      let left = r.left;
      const maxLeft = window.innerWidth - VIEWPORT_PAD - menuW;
      if (left > maxLeft) left = Math.max(VIEWPORT_PAD, maxLeft);
      if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
      setPos({ top, left });
    };
    place();
    const raf = window.requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (menuRef.current?.contains(t)) return;
      if (buttonRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const goDashboard = () => {
    window.location.hash = '#/';
  };

  const saveNow = () => saveProject();

  const exportJson = () => {
    try {
      downloadProjectJson(project);
      pushToast('Exported project JSON', 'success');
    } catch (err) {
      pushToast(
        err instanceof Error ? `Export failed: ${err.message}` : 'Export failed',
        'error',
      );
    }
  };

  const importJson = async () => {
    try {
      const next = await pickAndImportProjectJson();
      if (!next) return;
      await repo.saveProject(next);
      replaceProject(next);
      window.location.hash = `#/project/${next.id}`;
      pushToast(`Imported "${next.name}"`, 'success');
    } catch (err) {
      const msg =
        err instanceof ProjectImportError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Import failed';
      pushToast(`Import failed: ${msg}`, 'error');
    }
  };

  const items: MenuItem[] = [
    { label: 'Back to projects', onSelect: goDashboard },
    { label: 'Save now', shortcut: '', onSelect: saveNow },
    { label: 'Import project JSON\u2026', onSelect: importJson },
    { label: 'Export project JSON', onSelect: exportJson },
  ];

  const runItem = (item: MenuItem) => {
    setOpen(false);
    void item.onSelect();
  };

  return (
    <>
      <IconButton
        label="File"
        shortcut=""
        active={open}
        ariaPressed={open}
        buttonRef={buttonRef}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>{'\u2630'}</span>
      </IconButton>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              id={menuId}
              aria-label="File menu"
              className={styles.fileMenu}
              style={{
                top: pos?.top ?? -9999,
                left: pos?.left ?? -9999,
                visibility: pos ? 'visible' : 'hidden',
              }}
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  className={styles.fileMenuItem}
                  onClick={() => runItem(item)}
                >
                  <span>{item.label}</span>
                  {item.shortcut ? (
                    <span className={styles.fileMenuShortcut}>{item.shortcut}</span>
                  ) : null}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
