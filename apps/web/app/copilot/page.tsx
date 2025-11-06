'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { recordRuntimeEvent } from '../../lib/observability/datadog-runtime';

type AIProvider = 'auto' | 'gemini' | 'gpt5' | 'claude';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: AIProvider;
  sources?: Array<{ title: string; url: string; timestamp?: string }>;
  latency?: number;
}

const guidedPrompts = [
  'What are the top 5 teams in the CFP rankings right now?',
  'Show me clutch performance leaders in college baseball',
  'Compare win probability models for NFL games',
  'What historical games are available in the archive?',
  'Explain how Monte Carlo playoff simulations work'
];

const providerInfo: Record<AIProvider, { name: string; speed: string; strength: string }> = {
  auto: { name: 'Auto (Best Available)', speed: 'Varies', strength: 'Automatic failover and load balancing' },
  gemini: { name: 'Google Gemini 2.0', speed: 'Fast (~800ms)', strength: 'Real-time data and reasoning' },
  gpt5: { name: 'OpenAI GPT-5', speed: 'Medium (~1.2s)', strength: 'Deep analysis and context' },
  claude: { name: 'Anthropic Claude 3.5', speed: 'Fast (~900ms)', strength: 'Accuracy and citations' }
};

export default function CopilotPage() {
  const [provider, setProvider] = useState<AIProvider>('auto');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void recordRuntimeEvent('route_render', { route: '/copilot' });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: `This is a demo response. In production, this would query the ${providerInfo[provider].name} API with your question: "${input}". The response would include sourced data from our sports intelligence platform.`,
        provider,
        sources: [
          { title: 'CFP Rankings Data', url: '/CFP', timestamp: new Date().toISOString() },
          { title: 'Historical Archive', url: '/historical-comparisons', timestamp: new Date().toISOString() }
        ],
        latency: Math.random() * 500 + 600
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    }, 1000);
  };

  const handleGuidedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Blaze Sports Intel AI Copilot',
            applicationCategory: 'SportsApplication',
            description: 'AI-powered sports intelligence copilot with multi-provider support (Gemini, GPT-5, Claude) and full source attribution.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to Ask Great Sports Intelligence Questions',
            step: [
              {
                '@type': 'HowToStep',
                name: 'Be Specific',
                text: 'Ask about specific teams, players, or metrics (e.g., "Top 5 clutch hitters in SEC baseball")'
              },
              {
                '@type': 'HowToStep',
                name: 'Request Sources',
                text: 'Ask for data sources or methodologies to understand how answers are derived'
              },
              {
                '@type': 'HowToStep',
                name: 'Compare Options',
                text: 'Try different AI providers to see varied perspectives on the same question'
              }
            ]
          })
        }}
      />
      <div className="di-page">
        <div className="di-section">
          <span className="di-kicker">AI Copilot</span>
          <h1 className="di-title">Ask Questions. Get Sourced Answers.</h1>
          <p className="di-subtitle">
            Choose your AI provider, ask questions in natural language, and get answers backed by real sports data with full source attribution.
          </p>
        </div>

        <section className="di-section">
          <div style={{
            background: 'var(--di-surface)',
            border: '1px solid var(--di-border)',
            borderRadius: 'var(--di-radius)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Provider Selector */}
            <div>
              <label htmlFor="provider-select" style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                AI Provider
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {(Object.keys(providerInfo) as AIProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '999px',
                      border: provider === p ? '2px solid var(--di-accent)' : '1px solid var(--di-border)',
                      background: provider === p ? 'rgba(251, 191, 36, 0.1)' : 'var(--di-surface-muted)',
                      color: provider === p ? 'var(--di-accent)' : 'var(--di-text)',
                      fontWeight: provider === p ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '0.9rem'
                    }}
                    aria-pressed={provider === p}
                  >
                    {providerInfo[p].name}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--di-text-muted)', marginTop: '0.75rem' }}>
                <strong>{providerInfo[provider].speed}</strong> • {providerInfo[provider].strength}
              </p>
            </div>

            {/* Chat Interface */}
            <div
              style={{
                minHeight: '400px',
                maxHeight: '500px',
                overflowY: 'auto',
                padding: '1rem',
                background: 'var(--di-bg)',
                borderRadius: '12px',
                border: '1px solid var(--di-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
              role="log"
              aria-live="polite"
              aria-atomic="false"
            >
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--di-text-muted)' }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>No messages yet. Try a guided prompt below or ask your own question.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '600px', margin: '0 auto' }}>
                    {guidedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleGuidedPrompt(prompt)}
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'var(--di-surface)',
                          border: '1px solid var(--di-border)',
                          borderRadius: '12px',
                          color: 'var(--di-text)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s ease',
                          fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--di-accent)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--di-border)')}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '1rem',
                      borderRadius: '12px',
                      background: msg.role === 'user' ? 'var(--di-accent)' : 'var(--di-surface)',
                      color: msg.role === 'user' ? '#0b1120' : 'var(--di-text)',
                      border: msg.role === 'assistant' ? '1px solid var(--di-border)' : 'none'
                    }}
                  >
                    <p style={{ margin: 0, lineHeight: 1.6 }}>{msg.content}</p>
                  </div>
                  {msg.role === 'assistant' && msg.sources && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--di-text-muted)', paddingLeft: '1rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Sources:</p>
                      {msg.sources.map((source, sidx) => (
                        <div key={sidx} style={{ marginBottom: '0.25rem' }}>
                          <Link href={source.url} style={{ color: 'var(--di-accent)', textDecoration: 'underline' }}>
                            {source.title}
                          </Link>
                          {source.timestamp && (
                            <span style={{ marginLeft: '0.5rem' }}>• {new Date(source.timestamp).toLocaleTimeString()}</span>
                          )}
                        </div>
                      ))}
                      {msg.provider && msg.latency && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                          {providerInfo[msg.provider].name} • {Math.round(msg.latency)}ms
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ color: 'var(--di-text-muted)', fontStyle: 'italic' }}>
                  <span aria-live="assertive">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about sports data..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.9rem 1.25rem',
                  borderRadius: '999px',
                  border: '1px solid var(--di-border)',
                  background: 'var(--di-surface-muted)',
                  color: 'var(--di-text)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--di-accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--di-border)')}
                aria-label="Ask a question"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{
                  padding: '0.9rem 2rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: input.trim() && !loading ? 'linear-gradient(135deg, var(--di-accent), #f59e0b)' : 'var(--di-surface-muted)',
                  color: input.trim() && !loading ? '#0b1120' : 'var(--di-text-muted)',
                  fontWeight: 600,
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
                aria-label="Send message"
              >
                Send
              </button>
            </form>
          </div>
        </section>

        <section className="di-section">
          <h2 className="di-page-title">How to Ask Great Questions</h2>
          <div className="di-card-grid">
            <article className="di-card">
              <h3>Be Specific</h3>
              <p>
                Instead of "Who's good at baseball?", try "Top 5 clutch hitters in SEC baseball this season by LEI score."
              </p>
            </article>
            <article className="di-card">
              <h3>Request Sources</h3>
              <p>
                Ask "What data sources support this ranking?" to understand methodology and verify transparency.
              </p>
            </article>
            <article className="di-card">
              <h3>Compare Providers</h3>
              <p>
                Switch between Gemini, GPT-5, and Claude to see different analytical perspectives on the same question.
              </p>
            </article>
          </div>
        </section>

        <section className="di-section">
          <div className="di-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--di-text-muted)', marginBottom: '1rem' }}>
              Free tier: 10 queries/day • Unlimited with <Link href="/features" style={{ color: 'var(--di-accent)', textDecoration: 'underline' }}>Coach plan</Link>
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--di-text-muted)' }}>
              All responses are generated by AI and should be verified with source links. We do not store conversation history.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
