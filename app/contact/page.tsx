'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = formData.subject || 'Contact from BlazeSportsIntel.com';
    const body = `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`;
    const mailtoLink =
      'mailto:Austin@blazesportsintel.com?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body);
    window.location.href = mailtoLink;
  };

  return (
    <>
      <Navbar items={navItems} />
      <main id="main-content">
        <Section padding="lg" className="pt-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                  Contact Us
                </h1>
                <p className="text-text-secondary text-lg max-w-xl mx-auto">
                  Questions about Blaze Sports Intel? Reach out anytime.
                </p>
              </div>
            </ScrollReveal>

            <div className="max-w-2xl mx-auto">
              <ScrollReveal delay={100}>
                <Card variant="default" padding="lg">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                          Name
                        </label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                          Email
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-text-secondary mb-2">
                        Subject
                      </label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="What's this about?"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-2">
                        Message
                      </label>
                      <textarea
                        id="message"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Your message..."
                        className="w-full px-4 py-3 bg-charcoal border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:border-burnt-orange focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                        required
                      />
                    </div>

                    <Button type="submit" variant="primary" className="w-full">
                      Send Message
                    </Button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-border-subtle text-center">
                    <p className="text-text-secondary text-sm">
                      Or email directly: <a href="mailto:Austin@blazesportsintel.com" className="text-burnt-orange hover:underline">Austin@blazesportsintel.com</a>
                    </p>
                    <p className="text-text-tertiary text-xs mt-2">
                      Phone: (830) 370-4484
                    </p>
                  </div>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
