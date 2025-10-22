import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import useSWR from 'swr';

type FlagResponse = {
  flags: Record<string, unknown>;
};

type Toggle = {
  key: string;
  label: string;
  description: string;
};

const DEFAULT_TOGGLES: Toggle[] = [
  {
    key: 'developerMode',
    label: 'Developer Mode',
    description: 'Unlock bleeding-edge tooling for BlazeSportsIntel engineers.',
  },
  {
    key: 'labsAccess',
    label: 'Labs Access',
    description: 'Expose in-progress experiments for trusted operators.',
  },
  {
    key: 'showRecruitingMocks',
    label: 'Recruiting Mocks',
    description: 'Preview portal and recruiting flows ahead of the season.',
  },
];

const fetcher = async (url: string): Promise<FlagResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load flags: ${response.status}`);
  }
  return response.json();
};

interface DeveloperModePanelProps {
  workerBaseUrl?: string;
}

export function DeveloperModePanel({ workerBaseUrl }: DeveloperModePanelProps) {
  const [selectedKeys, setSelectedKeys] = useState(DEFAULT_TOGGLES.map((toggle) => toggle.key));

  const query = useMemo(() => selectedKeys.join(','), [selectedKeys]);
  const { data, error, isLoading, mutate } = useSWR<FlagResponse>(
    query ? `${workerBaseUrl ?? ''}/api/flags?keys=${encodeURIComponent(query)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const onToggle = useCallback(
    (key: string) => {
      setSelectedKeys((current) =>
        current.includes(key) ? current.filter((candidate) => candidate !== key) : [...current, key]
      );
      void mutate();
    },
    [mutate]
  );

  return (
    <section style={panelStyles.section}>
      <header style={panelStyles.header}>
        <h2 style={panelStyles.title}>Developer Mode Flags</h2>
        <p style={panelStyles.subtitle}>
          Read-only snapshot from Cloudflare KV. Dial in experiments without exposing production fans.
        </p>
      </header>
      <div style={panelStyles.grid}>
        {DEFAULT_TOGGLES.map((toggle) => {
          const isEnabled = selectedKeys.includes(toggle.key);
          const value = data?.flags?.[toggle.key];
          return (
            <article key={toggle.key} style={panelStyles.card}>
              <div style={panelStyles.cardHeader}>
                <label style={panelStyles.cardTitle} htmlFor={`toggle-${toggle.key}`}>
                  {toggle.label}
                </label>
                <button
                  id={`toggle-${toggle.key}`}
                  onClick={() => onToggle(toggle.key)}
                  style={{
                    ...panelStyles.toggle,
                    backgroundColor: isEnabled ? '#2f855a' : '#4a5568',
                  }}
                  type="button"
                >
                  {isEnabled ? 'Selected' : 'Hidden'}
                </button>
              </div>
              <p style={panelStyles.cardDescription}>{toggle.description}</p>
              <code style={panelStyles.code}>{value === undefined ? '—' : JSON.stringify(value)}</code>
            </article>
          );
        })}
      </div>
      {isLoading && <p style={panelStyles.status}>Loading flags…</p>}
      {error && (
        <p style={{ ...panelStyles.status, color: '#f56565' }}>{error.message ?? 'Failed to load flags'}</p>
      )}
    </section>
  );
}

const panelStyles: Record<string, CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#2d3748',
    borderRadius: '1rem',
    boxShadow: '0 20px 30px -15px rgba(0, 0, 0, 0.5)',
    maxWidth: '960px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    color: '#a0aec0',
    fontSize: '0.95rem',
  },
  grid: {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  card: {
    backgroundColor: '#1a202c',
    borderRadius: '0.75rem',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    border: '1px solid rgba(226, 232, 240, 0.06)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '1rem',
  },
  cardDescription: {
    margin: 0,
    color: '#cbd5f5',
    fontSize: '0.9rem',
    lineHeight: 1.4,
  },
  code: {
    padding: '0.75rem',
    backgroundColor: '#111827',
    borderRadius: '0.5rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '0.85rem',
    color: '#fbbf24',
    wordBreak: 'break-word',
  },
  toggle: {
    border: 'none',
    borderRadius: '999px',
    padding: '0.45rem 0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    color: '#f7fafc',
  },
  status: {
    textAlign: 'center',
    color: '#a0aec0',
    fontSize: '0.95rem',
  },
};

export default DeveloperModePanel;
