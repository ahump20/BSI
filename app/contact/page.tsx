'use client';

import { useState, FormEvent } from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, FormField } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
];

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Send to contact API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        {/* Hero */}
        <Section padding="lg" className="pt-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Get in Touch
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-center mb-4">
                <span className="text-gradient-blaze">Contact</span> Us
              </h1>
              <p className="text-text-secondary text-center max-w-2xl mx-auto">
                Questions about the platform? Want to discuss partnerships? Or just want to talk
                baseball? I read every message.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Contact Form & Info */}
        <Section padding="lg" background="charcoal">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Contact Information */}
              <ScrollReveal direction="left">
                <div>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-6">
                    Reach <span className="text-gradient-blaze">Out</span>
                  </h2>

                  <div className="space-y-6 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-burnt-orange/20 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-burnt-orange"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Email</h3>
                        <a
                          href="mailto:ahump20@outlook.com"
                          className="text-text-secondary hover:text-burnt-orange transition-colors"
                        >
                          ahump20@outlook.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-burnt-orange/20 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-burnt-orange"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Location</h3>
                        <p className="text-text-secondary">Boerne, Texas</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-burnt-orange/20 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-burnt-orange"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Response Time</h3>
                        <p className="text-text-secondary">Usually within 24 hours</p>
                      </div>
                    </div>
                  </div>

                  <Card padding="lg" className="bg-graphite">
                    <p className="text-text-secondary text-sm leading-relaxed">
                      Whether you&apos;re a college coach looking for better analytics, a scout who
                      needs reliable data, a media outlet wanting API access, or a fan who just
                      wants to talk baseball—I&apos;m here. No gatekeepers, no corporate runaround.
                      Just reach out.
                    </p>
                  </Card>
                </div>
              </ScrollReveal>

              {/* Contact Form */}
              <ScrollReveal direction="right">
                <Card padding="lg">
                  <h2 className="font-display text-xl font-bold uppercase tracking-display mb-6">
                    Send a <span className="text-gradient-blaze">Message</span>
                  </h2>

                  {submitStatus === 'success' ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-success"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-2">Message Sent</h3>
                      <p className="text-text-secondary">
                        Thanks for reaching out. I&apos;ll get back to you soon.
                      </p>
                      <Button
                        variant="ghost"
                        className="mt-6"
                        onClick={() => setSubmitStatus('idle')}
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <FormField
                        label="Name"
                        htmlFor="name"
                        error={errors.name}
                        required
                      >
                        <Input
                          id="name"
                          type="text"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          error={!!errors.name}
                          autoComplete="name"
                        />
                      </FormField>

                      <FormField
                        label="Email"
                        htmlFor="email"
                        error={errors.email}
                        required
                      >
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          error={!!errors.email}
                          autoComplete="email"
                        />
                      </FormField>

                      <FormField
                        label="Message"
                        htmlFor="message"
                        error={errors.message}
                        required
                      >
                        <Textarea
                          id="message"
                          placeholder="What's on your mind?"
                          value={formData.message}
                          onChange={(e) => handleChange('message', e.target.value)}
                          error={!!errors.message}
                          rows={5}
                        />
                      </FormField>

                      {submitStatus === 'error' && (
                        <div className="p-4 rounded-lg bg-error/20 border border-error/30">
                          <p className="text-error text-sm">
                            Something went wrong. Please try again or email me directly at{' '}
                            <a
                              href="mailto:ahump20@outlook.com"
                              className="underline hover:no-underline"
                            >
                              ahump20@outlook.com
                            </a>
                          </p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        Send Message
                      </Button>
                    </form>
                  )}
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Alternative Contact Methods */}
        <Section padding="lg">
          <Container center>
            <ScrollReveal direction="up">
              <div className="max-w-xl mx-auto text-center">
                <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-4">
                  Other Ways to <span className="text-gradient-blaze">Connect</span>
                </h2>
                <p className="text-text-secondary mb-6">
                  For quick questions, partnerships, or media inquiries.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:ahump20@outlook.com"
                    className="btn-primary px-6 py-3 text-center"
                  >
                    Email Directly
                  </a>
                  <a
                    href="https://www.linkedin.com/in/austinhumphrey/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary px-6 py-3 text-center"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
