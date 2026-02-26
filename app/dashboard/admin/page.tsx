'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface HealthData {
  status: string;
  timestamp: string;
  checks: {
    kv: { status: string; error?: string };
    d1: { status: string; error?: string };
    highlightly: { status: string; latency_ms?: number; rateLimitRemaining?: number; error?: string };
    recentErrors: number;
  };
}

export default function AdminDashboardPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('bsi-admin-auth') : null;
    if (stored === 'true') setAuthenticated(true);
  }, []);

  const login = () => {
    if (password === 'blazeit') {
      localStorage.setItem('bsi-admin-auth', 'true');
      setAuthenticated(true);
    }
  };

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/health');
      setHealth(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authenticated) fetchHealth();
  }, [authenticated]);

  if (!authenticated) {
    return (
      <main id="main-content" className="pt-24">
        <Section padding="lg">
          <Container>
            <div className="max-w-sm mx-auto">
              <Card padding="lg" className="text-center">
                <h1 className="text-xl font-bold text-text-primary mb-4">Admin Access</h1>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} placeholder="Password" className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary mb-4 focus:outline-none focus:border-[#BF5700]" />
                <button onClick={login} className="w-full py-2.5 bg-[#BF5700] text-white rounded-lg font-medium">Enter</button>
              </Card>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  const statusColor = (s: string) => s === 'healthy' ? 'success' : s === 'degraded' ? 'warning' : 'error';

  return (
    <main id="main-content" className="pt-24">
      <Section padding="lg">
        <Container>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold uppercase text-text-primary">API Health Dashboard</h1>
            <p className="text-text-secondary text-sm mt-1">{health?.timestamp ? new Date(health.timestamp).toLocaleString() : ''}</p>
          </div>

          {loading && !health ? (
            <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-[#BF5700]/30 border-t-[#BF5700] rounded-full animate-spin" /></div>
          ) : health ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card padding="lg">
                <h3 className="text-xs text-text-muted uppercase tracking-wider mb-2">KV Namespace</h3>
                <Badge variant={statusColor(health.checks.kv.status)}>{health.checks.kv.status}</Badge>
                {health.checks.kv.error && <p className="text-xs text-error mt-2">{health.checks.kv.error}</p>}
              </Card>
              <Card padding="lg">
                <h3 className="text-xs text-text-muted uppercase tracking-wider mb-2">D1 Database</h3>
                <Badge variant={statusColor(health.checks.d1.status)}>{health.checks.d1.status}</Badge>
                {health.checks.d1.error && <p className="text-xs text-error mt-2">{health.checks.d1.error}</p>}
              </Card>
              <Card padding="lg">
                <h3 className="text-xs text-text-muted uppercase tracking-wider mb-2">Highlightly API</h3>
                <Badge variant={statusColor(health.checks.highlightly.status)}>{health.checks.highlightly.status}</Badge>
                {health.checks.highlightly.latency_ms != null && <p className="text-xs text-text-secondary mt-2">{health.checks.highlightly.latency_ms}ms latency</p>}
                {health.checks.highlightly.rateLimitRemaining != null && <p className="text-xs text-text-secondary">{health.checks.highlightly.rateLimitRemaining} requests remaining</p>}
              </Card>
              <Card padding="lg">
                <h3 className="text-xs text-text-muted uppercase tracking-wider mb-2">Recent Errors</h3>
                <span className={`text-2xl font-bold ${health.checks.recentErrors > 0 ? 'text-error' : 'text-success'}`}>{health.checks.recentErrors}</span>
                <p className="text-xs text-text-muted mt-1">Last 7 days</p>
              </Card>
            </div>
          ) : null}

          <button onClick={fetchHealth} disabled={loading} className="mt-6 px-4 py-2 bg-background-tertiary text-text-secondary hover:text-text-primary rounded-lg text-sm transition-colors disabled:opacity-50">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </Container>
      </Section>
    </main>
  );
}
