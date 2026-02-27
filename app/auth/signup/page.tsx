'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

export default function SignupPage() {
  return (
    <>
      <div>
        <Section padding="lg" className="pt-6 min-h-screen">
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold uppercase tracking-display mb-2">
                    Create Your <span className="text-gradient-blaze">Account</span>
                  </h1>
                </div>

                <Card padding="lg" className="text-center">
                  <p className="text-text-secondary mb-6">
                    To get started, choose a plan. Your account is created automatically when you
                    subscribe, and your API key is emailed to you.
                  </p>

                  <div className="space-y-4">
                    <Link href="/pricing">
                      <Button variant="primary" size="lg" className="w-full">
                        View Plans
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-6">
                    <p className="text-text-tertiary text-sm">
                      Already have a key?{' '}
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
      </div>
      <Footer />
    </>
  );
}
