'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout-ds/Footer';

const features = [
  {
    icon: '🎯',
    title: 'Real-Time Presence Tracking',
    description:
      'MediaPipe-powered facial landmark detection tracks eye contact, head position, and facial expressions 30+ times per second.',
  },
  {
    icon: '🎤',
    title: 'Voice Energy Analysis',
    description:
      'Web Audio API monitors pitch stability, speech presence, and vocal energy to detect when you start fading.',
  },
  {
    icon: '🧠',
    title: 'Neural Pattern Learning',
    description:
      'The system learns YOUR patterns over time. It predicts drift before you notice it and coaches you proactively.',
  },
  {
    icon: '📊',
    title: 'Four-Channel Fusion',
    description:
      'Posture, voice, face, and attention channels combine into a single presence score with real-time feedback.',
  },
  {
    icon: '⚡',
    title: 'Predictive Alerts',
    description:
      'Based on learned patterns, get warned 10-30 seconds before a drift occurs. Fix it before it happens.',
  },
  {
    icon: '🏋️',
    title: 'Escalating Coach',
    description:
      'Subtle hints graduate to direct coaching only when needed. No nagging when you are performing well.',
  },
];

const useCases = [
  {
    title: 'Video Interviews',
    description: 'Stay engaged and present throughout high-stakes interviews.',
  },
  {
    title: 'Presentations',
    description: 'Maintain energy and eye contact during virtual presentations.',
  },
  {
    title: 'Coaching Sessions',
    description: 'Athletes and coaches can track presence during remote sessions.',
  },
  {
    title: 'Media Training',
    description: 'Practice on-camera presence before broadcast appearances.',
  },
];

export default function BlazeVisionPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    sportFocus: '',
    notes: '',
  });
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
          ...formData,
          interest: 'blaze-vision',
        }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (response.ok && data.success) {
        setStatus('success');
        setMessage("Your request has been received. We'll review and contact you within 48 hours.");
        setFormData({ name: '', email: '', organization: '', role: '', sportFocus: '', notes: '' });
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
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <Badge variant="primary" className="mb-4">
              Neural Presence Coach
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-center mb-4">
              Blaze <span className="text-gradient-blaze">Vision</span>
            </h1>
            <p className="text-text-secondary text-center max-w-2xl mx-auto text-lg mb-8">
              AI-powered presence coaching that learns your patterns, predicts drift, and helps you
              stay sharp during high-stakes moments.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#request-access" className="inline-block">
                <Button variant="primary" size="lg">
                  Request Access
                </Button>
              </a>
              <a href="mailto:Austin@blazesportsintel.com">
                <Button variant="secondary" size="lg">
                  Request Demo
                </Button>
              </a>
            </div>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal">
          <Container>
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display text-center mb-12">
              How It <span className="text-gradient-blaze">Works</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} padding="lg" className="h-full">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-tertiary text-sm">{feature.description}</p>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display text-center mb-8">
                Use Cases
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {useCases.map((useCase) => (
                  <div
                    key={useCase.title}
                    className="p-4 bg-graphite rounded-lg border border-border-subtle"
                  >
                    <h3 className="font-semibold text-white mb-1">{useCase.title}</h3>
                    <p className="text-text-tertiary text-sm">{useCase.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display text-center mb-4">
                Privacy First
              </h2>
              <p className="text-text-secondary text-center mb-8">
                All processing happens locally in your browser. Your camera and microphone data
                never leaves your device.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="text-3xl mb-2">🔒</div>
                  <h3 className="font-semibold text-white mb-1">Local Processing</h3>
                  <p className="text-text-tertiary text-sm">Biometrics analyzed on your device</p>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">🚫</div>
                  <h3 className="font-semibold text-white mb-1">No Recording</h3>
                  <p className="text-text-tertiary text-sm">
                    Video/audio never stored or transmitted
                  </p>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">📱</div>
                  <h3 className="font-semibold text-white mb-1">Your Data</h3>
                  <p className="text-text-tertiary text-sm">
                    Session summaries stored locally only
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <Section id="request-access" padding="lg">
          <Container>
            <div className="max-w-xl mx-auto">
              <Card padding="lg">
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-center mb-2">
                  Request Access
                </h2>
                <p className="text-text-tertiary text-center mb-6">
                  Blaze Vision is in early access. Tell us about your use case.
                </p>

                {status === 'success' ? (
                  <div className="text-center py-8">
                    <div className="text-success text-5xl mb-4">✓</div>
                    <h3 className="font-display text-xl font-bold text-white mb-2">
                      Request Received
                    </h3>
                    <p className="text-text-secondary">{message}</p>
                    <Link
                      href="/vision-AI-Intelligence"
                      className="mt-6 inline-block text-burnt-orange hover:underline"
                    >
                      Try the demo while you wait &rarr;
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-text-secondary mb-1"
                        >
                          Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="w-full px-4 py-2 bg-graphite border border-border-subtle rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-burnt-orange transition-colors"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="organization"
                          className="block text-sm font-medium text-text-secondary mb-1"
                        >
                          Organization
                        </label>
                        <input
                          type="text"
                          id="organization"
                          value={formData.organization}
                          onChange={(e) =>
                            setFormData({ ...formData, organization: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-graphite border border-border-subtle rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-burnt-orange transition-colors"
                          placeholder="Company or team"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="role"
                          className="block text-sm font-medium text-text-secondary mb-1"
                        >
                          Role
                        </label>
                        <input
                          type="text"
                          id="role"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-4 py-2 bg-graphite border border-border-subtle rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-burnt-orange transition-colors"
                          placeholder="Your role"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="sportFocus"
                        className="block text-sm font-medium text-text-secondary mb-1"
                      >
                        Sport / Focus Area
                      </label>
                      <select
                        id="sportFocus"
                        value={formData.sportFocus}
                        onChange={(e) => setFormData({ ...formData, sportFocus: e.target.value })}
                        className="w-full px-4 py-2 bg-graphite border border-border-subtle rounded-lg text-white focus:outline-none focus:border-burnt-orange transition-colors"
                      >
                        <option value="">Select an option</option>
                        <option value="baseball">Baseball</option>
                        <option value="football">Football</option>
                        <option value="basketball">Basketball</option>
                        <option value="soccer">Soccer</option>
                        <option value="media">Media / Broadcasting</option>
                        <option value="coaching">Coaching</option>
                        <option value="recruiting">Recruiting</option>
                        <option value="corporate">Corporate / Business</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="notes"
                        className="block text-sm font-medium text-text-secondary mb-1"
                      >
                        Tell us about your use case
                      </label>
                      <textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 bg-graphite border border-border-subtle rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-burnt-orange transition-colors resize-none"
                        placeholder="How do you plan to use Blaze Vision?"
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
                      {status === 'loading' ? 'Submitting...' : 'Request Access'}
                    </Button>

                    <p className="text-text-muted text-xs text-center">
                      We'll review your request and respond within 48 hours.
                    </p>
                  </form>
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
