import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';
import { CONTACT_CHANNELS, PLATFORM_URLS, PRIMARY_EMAIL, RESUME_PATH } from '../content/site';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

function ContactIcon({ kind }: { kind: typeof CONTACT_CHANNELS[number]['icon'] }) {
  switch (kind) {
    case 'email':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l9-4 9 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'bsi':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Contact() {
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [website, setWebsite] = useState('');

  const renderTurnstile = useCallback(() => {
    const w = window as unknown as { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void } };
    if (!w.turnstile || !turnstileRef.current) return;
    while (turnstileRef.current.firstChild) {
      turnstileRef.current.removeChild(turnstileRef.current.firstChild);
    }
    w.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'dark',
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
    });
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current) return;
    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => renderTurnstile();
    } else {
      renderTurnstile();
    }
  }, [renderTurnstile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website) return;

    setFormState('sending');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const payload: Record<string, string> = { name, email, message, site: 'austinhumphrey.com' };
      if (turnstileToken) payload.turnstileToken = turnstileToken;
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || (data && data.error && !data.ok)) {
        throw new Error(data?.error || 'Unable to send your message right now.');
      }

      setFormState('sent');
      setName('');
      setEmail('');
      setMessage('');
      setTurnstileToken('');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setErrorMsg('Request timed out. Try again.');
        setFormState('error');
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send your message right now.');
      setFormState('error');
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="section-padding section-border contact-bg"
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={staggerContainer}
        >
          {/* Header */}
          <motion.div variants={staggerItem} className="mb-10">
            <p className="section-label">// Connect</p>
            <h2 id="contact-heading" className="section-title">Get in Touch</h2>
            <p className="editorial-lead max-w-xl">
              Platform work, sports intelligence partnerships, or product conversations.
              This goes straight to Austin — no gatekeepers.
            </p>
          </motion.div>

          {/* Direct links + resume */}
          <motion.div variants={staggerItem} className="mb-12">
            <div className="flex flex-wrap gap-4 mb-8">
              <a href={PLATFORM_URLS.email} className="btn-primary">
                Email Austin
              </a>
              <a href={RESUME_PATH} download
                onClick={() => window.posthog?.capture('cta_clicked', { cta: 'resume' })}
                className="btn-outline"
              >
                Download Resume
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CONTACT_CHANNELS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('mailto') ? undefined : '_blank'}
                  rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                  onClick={() =>
                    window.posthog?.capture('contact_link_clicked', {
                      channel: link.label.toLowerCase(),
                    })
                  }
                  className="group rounded-sm border border-bone/10 bg-charcoal/35 px-5 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-burnt-orange/40 hover:bg-charcoal/60"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-warm-gray group-hover:text-burnt-orange transition-colors duration-300" aria-hidden="true">
                      <ContactIcon kind={link.icon} />
                    </div>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-warm-gray/60">
                      {link.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-bone transition-colors duration-300 group-hover:text-burnt-orange break-words">
                    {link.value}
                  </p>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Form — visually secondary, full width */}
          <motion.form
            variants={staggerItem}
            onSubmit={handleSubmit}
            className="card relative overflow-hidden p-8 md:p-10"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line-narrow" />
            <h3 className="font-sans text-sm uppercase tracking-[0.2em] text-burnt-orange font-medium mb-3">
              Send a Message
            </h3>
            <p className="mb-8 max-w-lg text-sm leading-7 text-bone/70">
              Introduce the project, opportunity, or idea. Keep it direct.
            </p>

            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
            />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="text-xs font-mono text-warm-gray block mb-2">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-bone/15 px-0 py-2 text-sm text-bone placeholder-warm-gray/70 focus:outline-none focus:border-burnt-orange transition-colors duration-300"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="text-xs font-mono text-warm-gray block mb-2">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-bone/15 px-0 py-2 text-sm text-bone placeholder-warm-gray/70 focus:outline-none focus:border-burnt-orange transition-colors duration-300"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="contact-message" className="text-xs font-mono text-warm-gray block mb-2">
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-bone/15 px-0 py-2 text-sm text-bone placeholder-warm-gray/70 focus:outline-none focus:border-burnt-orange transition-colors duration-300 resize-none"
                placeholder="What's on your mind?"
              />
            </div>

            {TURNSTILE_SITE_KEY && (
              <div ref={turnstileRef} className="mt-6 flex justify-center" />
            )}

            <button
              type="submit"
              disabled={formState === 'sending'}
              className="btn-primary mt-8 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formState === 'sending' ? 'Sending...' : formState === 'sent' ? 'Sent!' : 'Send Message'}
            </button>

            {formState === 'sent' && (
              <p className="text-green-400 text-xs font-mono mt-3 text-center" aria-live="polite">
                Message received. Austin will get back to you.
              </p>
            )}
            {formState === 'error' && (
              <p className="text-orange-400 text-xs font-mono mt-3 text-center" aria-live="polite">
                {errorMsg || `Couldn't send that. Try again or email ${PRIMARY_EMAIL} directly.`}
              </p>
            )}
          </motion.form>
        </motion.div>
      </div>
    </section>
  );
}
