'use client';

import Link from 'next/link';
import { useState } from 'react';
import { recordRuntimeEvent } from '../../lib/observability/datadog-runtime';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    tier: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    void recordRuntimeEvent('contact_form_submit', {
      subject: formData.subject,
      tier: formData.tier || 'none'
    });

    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <div className="di-page">
        <div className="di-section" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <span className="di-pill" style={{ margin: '0 auto 2rem' }}>Message Sent</span>
          <h1 className="di-title">Thank You!</h1>
          <p className="di-subtitle" style={{ margin: '1.5rem auto 2rem' }}>
            We've received your message and will respond within 24 hours (usually much faster). Check your email for confirmation.
          </p>
          <div className="di-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
            <Link className="di-action" href="/">
              Back to Home
            </Link>
            <Link className="di-action di-action--secondary" href="/copilot">
              Try AI Copilot
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="di-page">
      <div className="di-section">
        <span className="di-kicker">Get in Touch</span>
        <h1 className="di-title">Contact Us</h1>
        <p className="di-subtitle">
          Questions about the platform, API access, team subscriptions, or partnerships? We're here to help.
        </p>
      </div>

      <section className="di-section" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gap: '2rem',
          gridTemplateColumns: '1fr',
          '@media (min-width: 768px)': {
            gridTemplateColumns: '1fr 2fr'
          }
        }}>
          {/* Contact Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <article className="di-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Email</h3>
              <p style={{ color: 'var(--di-text-muted)', marginBottom: '0.5rem' }}>
                General inquiries and support
              </p>
              <a href="mailto:hello@blazesportsintel.com" style={{ color: 'var(--di-accent)', fontWeight: 600 }}>
                hello@blazesportsintel.com
              </a>
            </article>

            <article className="di-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Schedule a Call</h3>
              <p style={{ color: 'var(--di-text-muted)', marginBottom: '0.75rem' }}>
                For team subscriptions or partnerships
              </p>
              <a
                href="https://calendly.com/blazesportsintel"
                target="_blank"
                rel="noopener noreferrer"
                className="di-action"
                style={{ display: 'inline-flex', padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
              >
                Book a Demo
              </a>
            </article>

            <article className="di-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Press Kit</h3>
              <p style={{ color: 'var(--di-text-muted)', marginBottom: '0.75rem' }}>
                Logos, brand guidelines, and assets
              </p>
              <Link href="/about#press-kit" className="di-inline-link">
                Download Press Kit
              </Link>
            </article>
          </div>

          {/* Contact Form */}
          <div className="di-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--di-font-heading)' }}>
              Send a Message
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label htmlFor="name" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--di-border)',
                    background: 'var(--di-surface-muted)',
                    color: 'var(--di-text)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label htmlFor="email" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--di-border)',
                    background: 'var(--di-surface-muted)',
                    color: 'var(--di-text)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label htmlFor="subject" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--di-border)',
                    background: 'var(--di-surface-muted)',
                    color: 'var(--di-text)',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="subscription">Subscription/Pricing</option>
                  <option value="api">API Access</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="press">Press/Media</option>
                </select>
              </div>

              <div>
                <label htmlFor="tier" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Interested Tier (Optional)
                </label>
                <select
                  id="tier"
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--di-border)',
                    background: 'var(--di-surface-muted)',
                    color: 'var(--di-text)',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select a tier...</option>
                  <option value="scout">Scout (Free)</option>
                  <option value="coach">Coach ($49/mo)</option>
                  <option value="organization">Organization (Custom)</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--di-border)',
                    background: 'var(--di-surface-muted)',
                    color: 'var(--di-text)',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="di-action"
                style={{
                  alignSelf: 'flex-start',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="di-section">
        <h2 className="di-page-title">Frequently Asked Questions</h2>
        <div className="di-card-grid">
          <article className="di-card">
            <h3>How quickly do you respond?</h3>
            <p>
              Most inquiries receive a response within 24 hours. Technical support for paid plans is typically answered within 4 hours during business hours.
            </p>
          </article>
          <article className="di-card">
            <h3>Do you offer custom integrations?</h3>
            <p>
              Yes! Organization tier includes custom data integrations, webhooks, and white-label options. Contact us to discuss your specific needs.
            </p>
          </article>
          <article className="di-card">
            <h3>Can I get a demo before subscribing?</h3>
            <p>
              Absolutely. Book a demo call above or start with the free Scout tier to explore the platform. No credit card required.
            </p>
          </article>
        </div>
      </section>

      <section className="di-section">
        <div className="di-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--di-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            For immediate help, try our <Link href="/copilot" style={{ color: 'var(--di-accent)', textDecoration: 'underline' }}>AI Copilot</Link> or check the <Link href="/api-docs" style={{ color: 'var(--di-accent)', textDecoration: 'underline' }}>API documentation</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
