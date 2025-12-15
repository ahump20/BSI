'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Pricing', href: '/pricing' },
];

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar items={navItems} />
      <main id="main-content">
        <Section padding="lg" className="pt-24 min-h-screen">
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold uppercase tracking-display mb-2">
                    Welcome <span className="text-gradient-blaze">Back</span>
                  </h1>
                  <p className="text-text-secondary">Sign in to access your dashboard</p>
                </div>

                <Card padding="lg">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                        {error}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-text-secondary mb-2"
                      >
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-text-secondary mb-2"
                      >
                        Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Your password"
                        required
                        autoComplete="current-password"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-text-tertiary text-sm">
                      Do not have an account?{' '}
                      <Link
                        href="/auth/signup"
                        className="text-burnt-orange hover:text-ember transition-colors"
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>
                </Card>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
