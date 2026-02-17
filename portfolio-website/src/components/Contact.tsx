import { useCallback, useEffect, useRef, useState } from 'react';

// Turnstile site key (public — safe to embed in client code)
const TURNSTILE_SITE_KEY = '0x4AAAAAACernv648AJ4YADA';

const links = [
  { label: 'Email', value: 'Austin@BlazeSportsIntel.com', href: 'mailto:Austin@BlazeSportsIntel.com' },
  { label: 'LinkedIn', value: 'linkedin.com/in/ahump20', href: 'https://linkedin.com/in/ahump20' },
  { label: 'BSI', value: 'BlazeSportsIntel.com', href: 'https://blazesportsintel.com' },
  { label: 'GitHub', value: 'github.com/ahump20', href: 'https://github.com/ahump20' },
  { label: 'X', value: '@BlazeSportsIntel', href: 'https://x.com/BlazeSportsIntel' },
];

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  // Honeypot field for spam prevention
  const [website, setWebsite] = useState('');

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll('.reveal');
    if (!els) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Load Turnstile script + render widget when site key is configured
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
  }, []);

  const renderTurnstile = useCallback(() => {
    const w = window as unknown as { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void } };
    if (!w.turnstile || !turnstileRef.current) return;
    // Clear previous render if any
    turnstileRef.current.innerHTML = '';
    w.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'dark',
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website) return; // Honeypot triggered — silent reject

    setFormState('sending');
    try {
      const payload: Record<string, string> = { name, email, message, site: 'austinhumphrey.com' };
      if (turnstileToken) payload.turnstileToken = turnstileToken;
      const res = await fetch('https://blazesportsintel.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFormState('sent');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setFormState('error');
      }
    } catch {
      setFormState('error');
    }
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      aria-labelledby="contact-heading"
      className="section-padding section-border"
    >
      <div className="container-custom max-w-3xl mx-auto text-center">
        <div className="reveal">
          <p className="section-label">// Connect</p>
          <h2 id="contact-heading" className="section-title">Get in Touch</h2>
          <p className="text-warm-gray text-lg mb-12 max-w-2xl mx-auto">
            Whether you're interested in sports analytics, building platforms that serve
            underserved markets, or just want to talk about the philosophy of showing up.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12 reveal">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              className="card p-5 text-center group"
            >
              <p className="text-xs font-mono text-warm-gray mb-1">{link.label}</p>
              <p className="text-sm font-semibold text-bone group-hover:text-burnt-orange transition-colors duration-300 break-words">
                {link.value}
              </p>
            </a>
          ))}
        </div>

        {/* Contact form */}
        <form onSubmit={handleSubmit} className="card p-8 text-left max-w-lg mx-auto mb-12 reveal">
          <h3 className="font-sans text-sm uppercase tracking-[0.2em] text-burnt-orange font-medium mb-6">
            Send a Message
          </h3>

          {/* Honeypot — hidden from real users */}
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

          <div className="space-y-4">
            <div>
              <label htmlFor="contact-name" className="text-xs font-mono text-warm-gray block mb-1">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-midnight border border-bone/10 rounded px-3 py-2 text-sm text-bone placeholder-warm-gray/50 focus:outline-none focus:border-burnt-orange/50"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-xs font-mono text-warm-gray block mb-1">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-midnight border border-bone/10 rounded px-3 py-2 text-sm text-bone placeholder-warm-gray/50 focus:outline-none focus:border-burnt-orange/50"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="text-xs font-mono text-warm-gray block mb-1">
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-midnight border border-bone/10 rounded px-3 py-2 text-sm text-bone placeholder-warm-gray/50 focus:outline-none focus:border-burnt-orange/50 resize-none"
                placeholder="What's on your mind?"
              />
            </div>
          </div>

          {TURNSTILE_SITE_KEY && (
            <div ref={turnstileRef} className="mt-4 flex justify-center" />
          )}

          <button
            type="submit"
            disabled={formState === 'sending'}
            className="btn-primary mt-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formState === 'sending' ? 'Sending...' : formState === 'sent' ? 'Sent!' : 'Send Message'}
          </button>

          {formState === 'sent' && (
            <p className="text-green-400 text-xs font-mono mt-3 text-center">
              Message received. Austin will get back to you.
            </p>
          )}
          {formState === 'error' && (
            <p className="text-orange-400 text-xs font-mono mt-3 text-center">
              Something went wrong. Try emailing Austin@BlazeSportsIntel.com directly.
            </p>
          )}
        </form>

        <div className="reveal">
          <a href="/Austin_Humphrey_Resume.pdf" download className="btn-primary">
            Download Resume
          </a>
          <p className="text-sm font-mono text-warm-gray mt-8">
            Based in San Antonio, <span className="text-burnt-orange">Texas</span>
          </p>
        </div>
      </div>
    </section>
  );
}
