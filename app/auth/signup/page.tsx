'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = (await response.json()) as { error?: string; token?: string; redirectTo?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store token in localStorage for client-side auth checks
      if (data.token) {
        localStorage.setItem('bsi_token', data.token);
      }

      // Redirect to portal (user is now logged in) or API-specified destination
      window.location.href = data.redirectTo || '/portal';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 min-h-screen">
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold uppercase tracking-display mb-2">
                    Join <span className="text-gradient-blaze">BSI</span>
                  </h1>
                  <p className="text-text-secondary">Create your account to get started</p>
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
                        htmlFor="name"
                        className="block text-sm font-medium text-text-secondary mb-2"
                      >
                        Name
                      </label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                        required
                        autoComplete="name"
                      />
                    </div>

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
                        placeholder="Create a password"
                        required
                        autoComplete="new-password"
                        minLength={8}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-text-secondary mb-2"
                      >
                        Confirm Password
                      </label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        placeholder="Confirm your password"
                        required
                        autoComplete="new-password"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>

                    <p className="text-text-tertiary text-xs text-center">
                      By signing up, you agree to our{' '}
                      <Link href="/terms" className="text-burnt-orange hover:text-ember">
                        Terms
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-burnt-orange hover:text-ember">
                        Privacy Policy
                      </Link>
                    </p>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-text-tertiary text-sm">
                      Already have an account?{' '}
                      <Link
                        href="/auth/login"
                        className="text-burnt-orange hover:text-ember transition-colors"
                      >
                        Sign in
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
