'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const inputId = externalId || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-[var(--bsi-dust)] mb-1.5">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          className={`w-full px-4 py-2.5 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] placeholder:text-[rgba(196,184,165,0.5)] focus:outline-none focus:border-[var(--bsi-primary)] transition-colors ${error ? 'border-error' : ''} ${className}`}
          {...props}
        />
        {error && <p id={errorId} className="mt-1 text-sm text-error" role="alert">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
