import { FormEvent, useState, type CSSProperties } from 'react';
import Head from 'next/head';

const WORKER_BASE_URL = process.env.NEXT_PUBLIC_WORKER_BASE_URL ?? '';

export default function UnderEdgeProxyPage() {
  const [path, setPath] = useState('/status');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult('');
    try {
      const response = await fetch(`${WORKER_BASE_URL}/dev/ue${path}`, {
        method,
        headers: method === 'POST' ? { 'content-type': 'application/json' } : undefined,
        body: method === 'POST' && body ? body : undefined,
      });
      const text = await response.text();
      setResult(`${response.status} ${response.statusText}\n\n${text}`);
    } catch (error) {
      setResult((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <Head>
        <title>Underdog Edge Proxy | BlazeSportsIntel</title>
      </Head>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Underdog Edge Proxy</h1>
      <p style={{ marginBottom: '1.5rem', color: '#a0aec0' }}>
        Rapidly validate requests passing through the Cloudflare Worker. Useful for tuning UE endpoints and
        verifying headers.
      </p>
      <form onSubmit={submit} style={formStyle}>
        <label style={labelStyle}>
          <span>Path</span>
          <input
            value={path}
            onChange={(event) => setPath(event.target.value)}
            style={inputStyle}
            placeholder="/status"
            required
          />
        </label>
        <label style={labelStyle}>
          <span>Method</span>
          <select value={method} onChange={(event) => setMethod(event.target.value as 'GET' | 'POST')} style={inputStyle}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </label>
        {method === 'POST' && (
          <label style={labelStyle}>
            <span>Body</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              style={{ ...inputStyle, minHeight: '160px', fontFamily: 'monospace' }}
              placeholder='{"example":true}'
            />
          </label>
        )}
        <button type="submit" style={submitButtonStyle} disabled={isLoading}>
          {isLoading ? 'Proxying…' : 'Send Request'}
        </button>
      </form>
      <section style={resultSectionStyle}>
        <header>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Response</h2>
        </header>
        <pre style={resultPreStyle}>{result || 'No request yet.'}</pre>
      </section>
    </main>
  );
}

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  marginBottom: '2rem',
  backgroundColor: '#2d3748',
  padding: '1.5rem',
  borderRadius: '1rem',
  border: '1px solid rgba(226, 232, 240, 0.08)',
};

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  backgroundColor: '#1a202c',
  color: '#e2e8f0',
};

const submitButtonStyle: CSSProperties = {
  padding: '0.85rem 1.2rem',
  borderRadius: '0.75rem',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #2f855a, #38a169)',
  color: '#f7fafc',
  border: 'none',
  cursor: 'pointer',
};

const resultSectionStyle: CSSProperties = {
  backgroundColor: '#0f172a',
  borderRadius: '1rem',
  padding: '1.5rem',
  border: '1px solid rgba(94, 234, 212, 0.2)',
};

const resultPreStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: '0.9rem',
};
