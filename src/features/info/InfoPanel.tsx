import { useEffect, useMemo, useState } from 'react';
import { useEditorStore } from '@/state';
import { useSelectionStore } from '@/state';
import {
  ALL_INFO_KEYS,
  getInfoEntry,
  INFO_ENTRIES,
  type InfoEntry,
  type InfoKey,
} from './infoEntries';
import styles from './info.module.css';

type Source = 'selection' | 'tool' | 'manual';

const TOOL_KEYS: InfoKey[] = ALL_INFO_KEYS.filter((k) => INFO_ENTRIES[k].category === 'tool');
const ENTITY_KEYS: InfoKey[] = ALL_INFO_KEYS.filter((k) => INFO_ENTRIES[k].category === 'entity');

export const InfoPanel = () => {
  const activeTool = useEditorStore((s) => s.activeTool);
  const selected = useSelectionStore((s) => s.selected);
  const firstSelectionKind = selected[0]?.kind ?? null;

  const auto = useMemo<{ key: InfoKey; source: Source }>(() => {
    if (
      activeTool === 'select' &&
      firstSelectionKind &&
      getInfoEntry(firstSelectionKind)
    ) {
      return { key: firstSelectionKind as InfoKey, source: 'selection' };
    }
    return { key: activeTool as InfoKey, source: 'tool' };
  }, [firstSelectionKind, activeTool]);

  const [manualKey, setManualKey] = useState<InfoKey | null>(null);

  useEffect(() => {
    setManualKey(null);
  }, [auto.key]);

  const activeKey: InfoKey = manualKey ?? auto.key;
  const entry = getInfoEntry(activeKey);
  const source: Source = manualKey ? 'manual' : auto.source;

  return (
    <div className={styles.infoPanel}>
      <nav className={styles.nav} aria-label="Info topics">
        <div className={styles.navGroup}>Tools</div>
        {TOOL_KEYS.map((k) => (
          <NavItem
            key={k}
            infoKey={k}
            active={k === activeKey}
            onSelect={setManualKey}
          />
        ))}
        <div className={styles.navGroup}>Entities</div>
        {ENTITY_KEYS.map((k) => (
          <NavItem
            key={k}
            infoKey={k}
            active={k === activeKey}
            onSelect={setManualKey}
          />
        ))}
      </nav>
      <div className={styles.content}>
        {entry ? (
          <EntryView entry={entry} source={source} onPick={setManualKey} />
        ) : (
          <p className={styles.empty}>No info available for the current focus.</p>
        )}
      </div>
    </div>
  );
};

type NavItemProps = {
  infoKey: InfoKey;
  active: boolean;
  onSelect: (k: InfoKey) => void;
};

const NavItem = ({ infoKey, active, onSelect }: NavItemProps) => {
  const entry = INFO_ENTRIES[infoKey];
  return (
    <button
      type="button"
      className={[styles.navItem, active ? styles.navItemActive : ''].join(' ')}
      aria-current={active ? 'true' : undefined}
      onClick={() => onSelect(infoKey)}
    >
      <span>{entry.title}</span>
      {entry.shortcut ? <span className={styles.navShortcut}>{entry.shortcut}</span> : null}
    </button>
  );
};

type EntryViewProps = {
  entry: InfoEntry;
  source: Source;
  onPick: (k: InfoKey) => void;
};

const SOURCE_LABEL: Record<Source, string> = {
  selection: 'Following selection',
  tool: 'Following active tool',
  manual: 'Pinned topic',
};

const EntryView = ({ entry, source, onPick }: EntryViewProps) => {
  return (
    <article aria-labelledby="info-title">
      <div className={styles.header}>
        <span className={styles.kicker}>{entry.category === 'tool' ? 'Tool' : 'Entity'}</span>
        <h2 id="info-title" className={styles.title}>{entry.title}</h2>
        {entry.shortcut ? (
          <span className={styles.shortcutPill}>{entry.shortcut}</span>
        ) : null}
      </div>
      <div className={styles.source}>{SOURCE_LABEL[source]}</div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>What it is</h3>
        <p className={styles.sectionBody}>{entry.whatItIs}</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>What it does</h3>
        <p className={styles.sectionBody}>{entry.whatItDoes}</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>How to use it</h3>
        <ol className={styles.stepList}>
          {entry.howToUse.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      {entry.related.length > 0 ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Related</h3>
          <div className={styles.relatedRow}>
            {entry.related.map((k) => {
              const target = INFO_ENTRIES[k];
              if (!target) return null;
              return (
                <button
                  key={k}
                  type="button"
                  className={styles.relatedLink}
                  onClick={() => onPick(k)}
                >
                  {target.title}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </article>
  );
};
