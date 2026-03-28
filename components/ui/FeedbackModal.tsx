'use client';

import { useState, useEffect, useRef } from 'react';

const CATEGORIES = ['Bug Report', 'Feature Request', 'Data Issue', 'General Feedback'];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('General Feedback');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape to close
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>('button, textarea, input, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, rating, text }), signal: AbortSignal.timeout(8000) });
      setSubmitted(true);
      setTimeout(() => { setOpen(false); setSubmitted(false); setText(''); setRating(0); }, 2000);
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-24 md:bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[var(--bsi-primary)] hover:bg-[var(--bsi-primary)]/80 text-white shadow-lg flex items-center justify-center transition-colors" aria-label="Send feedback">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="feedback-heading" className="bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm p-6 w-full max-w-md">
            {submitted ? (
              <div className="text-center py-8"><div aria-hidden="true" className="text-4xl mb-3">&#10003;</div><p className="text-[var(--bsi-bone)] font-medium">Thanks for your feedback!</p></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 id="feedback-heading" className="text-lg font-bold text-[var(--bsi-bone)]">Send Feedback</h2>
                  <button onClick={() => setOpen(false)} className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)]" aria-label="Close">&times;</button>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-[rgba(196,184,165,0.35)] mb-1.5 uppercase tracking-wider">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (<button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-sm text-sm transition-colors ${category === c ? 'bg-[var(--bsi-primary)] text-white' : 'bg-surface text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)]'}`}>{c}</button>))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-[rgba(196,184,165,0.35)] mb-1.5 uppercase tracking-wider">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (<button key={n} onClick={() => setRating(n)} className={`text-2xl transition-colors ${n <= rating ? 'text-[var(--bsi-primary)]' : 'text-[rgba(196,184,165,0.35)]'}`} aria-label={`Rate ${n} of 5`}>&#9733;</button>))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-[rgba(196,184,165,0.35)] mb-1.5 uppercase tracking-wider">Your Feedback</label>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full bg-surface border border-[rgba(140,98,57,0.5)] rounded-sm p-3 text-[var(--bsi-bone)] text-sm placeholder:text-[rgba(196,184,165,0.35)] resize-none focus:outline-none focus:border-[var(--bsi-primary)]" placeholder="Tell us what you think..." />
                </div>
                <button onClick={submit} disabled={submitting || !text.trim()} className="w-full py-2.5 bg-[var(--bsi-primary)] hover:bg-[var(--bsi-primary)]/80 disabled:opacity-50 text-white rounded-sm font-medium transition-colors">{submitting ? 'Sending...' : 'Send Feedback'}</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
