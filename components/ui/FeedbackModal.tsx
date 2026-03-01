'use client';

import { useState } from 'react';

const CATEGORIES = ['Bug Report', 'Feature Request', 'Data Issue', 'General Feedback'];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('General Feedback');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, rating, text }) });
      setSubmitted(true);
      setTimeout(() => { setOpen(false); setSubmitted(false); setText(''); setRating(0); }, 2000);
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-24 md:bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-burnt-orange hover:bg-burnt-orange/80 text-white shadow-lg flex items-center justify-center transition-colors" aria-label="Send feedback">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div role="dialog" aria-modal="true" aria-label="Send feedback" className="bg-background-secondary border border-border rounded-xl p-6 w-full max-w-md">
            {submitted ? (
              <div className="text-center py-8"><div aria-hidden="true" className="text-4xl mb-3">&#10003;</div><p className="text-text-primary font-medium">Thanks for your feedback!</p></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-text-primary">Send Feedback</h2>
                  <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary" aria-label="Close">&times;</button>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (<button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded text-sm transition-colors ${category === c ? 'bg-burnt-orange text-white' : 'bg-surface text-text-muted hover:text-text-primary'}`}>{c}</button>))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (<button key={n} onClick={() => setRating(n)} className={`text-2xl transition-colors ${n <= rating ? 'text-burnt-orange' : 'text-text-muted'}`} aria-label={`Rate ${n} of 5`}>&#9733;</button>))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Your Feedback</label>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full bg-surface border border-border-strong rounded-lg p-3 text-text-primary text-sm placeholder:text-text-muted resize-none focus:outline-none focus:border-burnt-orange" placeholder="Tell us what you think..." />
                </div>
                <button onClick={submit} disabled={submitting || !text.trim()} className="w-full py-2.5 bg-burnt-orange hover:bg-burnt-orange/80 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">{submitting ? 'Sending...' : 'Send Feedback'}</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
