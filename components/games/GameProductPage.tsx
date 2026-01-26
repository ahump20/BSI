'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout-ds/Footer';

interface GameProductPageProps {
  id: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  icon: string;
  isLive?: boolean;
  playUrl?: string;
}

export function GameProductPage({
  id,
  title,
  tagline,
  description,
  features,
  icon,
  isLive = false,
  playUrl,
}: GameProductPageProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/vision/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          interest: id,
          notes: `Game notification signup for ${title}`,
        }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (response.ok && data.success) {
        setStatus('success');
        setMessage("You're on the list! We'll notify you when the game launches.");
        setEmail('');
        setName('');
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to submit. Check your connection and try again.');
    }
  };

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <div className="max-w-4xl mx-auto">
              <Link
                href="/games"
                className="text-text-tertiary hover:text-burnt-orange transition-colors text-sm mb-6 inline-block"
              >
                &larr; Back to Games
              </Link>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3">
                  <Card padding="lg" className="text-center">
                    <div className="text-8xl mb-4">{icon}</div>
                    {isLive && playUrl ? (
                      <Link href={playUrl}>
                        <Button variant="primary" size="lg" className="w-full">
                          Play Now
                        </Button>
                      </Link>
                    ) : (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </Card>
                </div>

                <div className="w-full md:w-2/3">
                  <Badge variant="primary" className="mb-4">
                    BSI Arcade
                  </Badge>
                  <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display mb-4">
                    {title}
                  </h1>
                  <p className="text-burnt-orange font-semibold text-lg mb-4">{tagline}</p>
                  <p className="text-text-secondary mb-8">{description}</p>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-6">
                Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-burnt-orange flex-shrink-0 mt-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <div className="max-w-md mx-auto">
              <Card padding="lg">
                {isLive && playUrl ? (
                  <>
                    <h2 className="font-display text-xl font-bold uppercase tracking-display mb-2 text-center">
                      Ready to Play?
                    </h2>
                    <p className="text-text-tertiary text-sm text-center mb-6">
                      {title} is available now. Jump in and start playing.
                    </p>
                    <Link href={playUrl}>
                      <Button variant="primary" size="lg" className="w-full">
                        Play Now
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-xl font-bold uppercase tracking-display mb-2 text-center">
                      Get Notified
                    </h2>
                    <p className="text-text-tertiary text-sm text-center mb-6">
                      Be the first to know when {title} launches.
                    </p>

                    {status === 'success' ? (
                      <div className="text-center py-4">
                        <div className="text-success text-4xl mb-2">✓</div>
                        <p className="text-text-secondary">{message}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-text-secondary mb-1"
                          >
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            minLength={2}
                            className="w-full px-4 py-2 bg-graphite border border-border-subtle rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-burnt-orange transition-colors"
                            placeholder="Your name"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-text-secondary mb-1"
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-graphite border border-border-subtle rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-burnt-orange transition-colors"
                            placeholder="you@example.com"
                          />
                        </div>

                        {status === 'error' && <p className="text-error text-sm">{message}</p>}

                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          className="w-full"
                          disabled={status === 'loading'}
                        >
                          {status === 'loading' ? 'Submitting...' : 'Notify Me'}
                        </Button>
                      </form>
                    )}
                  </>
                )}
              </Card>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
