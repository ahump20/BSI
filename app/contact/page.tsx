'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

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
    const body =
      'Name: ' + formData.name + '\nEmail: ' + formData.email + '\n\n' + formData.message;
    const mailtoLink =
      'mailto:Austin@blazesportsintel.com?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body);
    window.location.href = mailtoLink;
  };

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-2xl mx-auto text-center mb-12">
                <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
                  Get in <span className="text-[var(--bsi-primary)]">Touch</span>
                </h1>
                <p className="text-[var(--bsi-dust)]">
                  Questions about our sports coverage? Partnership opportunities? Or just want to
                  talk sports? I read every email.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <Card padding="lg" className="max-w-xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-[var(--bsi-dust)] mb-2"
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
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-[var(--bsi-dust)] mb-2"
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
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-[var(--bsi-dust)] mb-2"
                    >
                      Subject
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="What is this about?"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-[var(--bsi-dust)] mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Your message..."
                      required
                      className="w-full px-4 py-3 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] placeholder:text-[rgba(196,184,165,0.35)] focus:outline-none focus:ring-2 focus:ring-[var(--bsi-primary)]/50 focus:border-[var(--bsi-primary)]/30 transition-all resize-none"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="lg" className="w-full">
                    Send Message
                  </Button>
                </form>
              </Card>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <div className="max-w-xl mx-auto mt-12 text-center">
                <p className="text-[rgba(196,184,165,0.5)] text-sm mb-4">Or reach out directly:</p>
                <a
                  href="mailto:Austin@blazesportsintel.com"
                  className="text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors font-semibold"
                >
                  Austin@blazesportsintel.com
                </a>
                <p className="text-[var(--bsi-dust)] mt-2">(210) 275-5538</p>
                <p className="text-[rgba(196,184,165,0.5)] text-sm mt-8">
                  Blaze Intelligence LLC - Boerne, Texas
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
