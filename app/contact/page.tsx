'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/cinematic';

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
      <div className="bg-surface-scoreboard text-bsi-bone">
        <Section padding="lg" className="pt-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(191,87,0,0.1), transparent 60%)' }} />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-2xl mx-auto text-center mb-12">
                <h1
                  className="text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4"
                  style={{ fontFamily: 'var(--font-oswald)' }}
                >
                  Get in <span className="text-bsi-primary">Touch</span>
                </h1>
                <p className="text-bsi-dust">
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
                      className="block text-sm font-medium mb-2 text-bsi-dust"
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
                      className="block text-sm font-medium mb-2 text-bsi-dust"
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
                      className="block text-sm font-medium mb-2 text-bsi-dust"
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
                      className="block text-sm font-medium mb-2 text-bsi-dust"
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
                      className="w-full px-4 py-3 rounded-sm transition-all resize-none"
                      style={{
                        background: 'var(--surface-dugout)',
                        border: '1px solid var(--border-vintage)',
                        color: 'var(--bsi-bone)',
                        outline: 'none',
                      }}
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
                <p className="text-sm mb-4" style={{ color: 'rgba(196,184,165,0.5)' }}>Or reach out directly:</p>
                <a
                  href="mailto:Austin@blazesportsintel.com"
                  className="font-semibold transition-colors text-bsi-primary"
                >
                  Austin@blazesportsintel.com
                </a>
                <p className="mt-2 text-bsi-dust">(210) 275-5538</p>
                <p className="text-sm mt-8" style={{ color: 'rgba(196,184,165,0.5)' }}>
                  Blaze Intelligence LLC - Boerne, Texas
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </div>
    </>
  );
}
