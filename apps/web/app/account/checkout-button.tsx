'use client';

import { useState, useTransition } from 'react';

interface CheckoutButtonProps {
  disabled?: boolean;
  label?: string;
}

export default function CheckoutButton({ disabled, label }: CheckoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/v1/billing/create-checkout', {
          method: 'POST'
        });

        const payload = (await response.json().catch(() => ({}))) as { url?: string; message?: string };

        if (!response.ok || !payload?.url) {
          throw new Error(payload?.message ?? 'Unable to start checkout');
        }

        window.location.assign(payload.url);
      } catch (checkoutError) {
        console.error('Failed to redirect to Stripe Checkout', checkoutError);
        setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start checkout');
      }
    });
  };

  return (
    <div className="di-card di-action-card">
      <button
        type="button"
        className="di-button di-button--primary"
        onClick={handleCheckout}
        disabled={disabled || isPending}
      >
        {isPending ? 'Launching Stripe Checkout…' : label ?? 'Upgrade to Diamond Pro'}
      </button>
      {error ? <p className="di-inline-error">{error}</p> : null}
    </div>
  );
}
