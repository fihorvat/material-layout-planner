import { useRef } from 'react';
import styles from './controls.module.css';

export type TabItem = { id: string; label: string; badge?: number };

export type TabsProps = {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
};

export const Tabs = ({ tabs, active, onChange, className }: TabsProps) => {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') {
      return;
    }
    e.preventDefault();
    let nextIdx = idx;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = tabs.length - 1;
    const next = tabs[nextIdx];
    if (!next) return;
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div role="tablist" aria-orientation="horizontal" className={[styles.tabs, className ?? ''].join(' ')}>
      {tabs.map((tab, idx) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={[styles.tab, selected ? styles.tabActive : ''].join(' ')}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, idx)}
          >
            <span>{tab.label}</span>
            {typeof tab.badge === 'number' && tab.badge > 0 ? (
              <span className={styles.badge}>{tab.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
