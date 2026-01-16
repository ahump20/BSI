'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Base input styles
const baseInputClasses = [
  'w-full',
  'bg-charcoal text-text-primary placeholder:text-text-muted',
  'border border-border-default rounded-lg',
  'transition-all duration-200',
  'focus:outline-none focus:border-burnt-orange focus:ring-1 focus:ring-burnt-orange/50',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-graphite',
  'aria-invalid:border-error aria-invalid:focus:border-error aria-invalid:focus:ring-error/50',
].join(' ');

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-4 text-base',
};

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Error state */
  error?: boolean;
  /** Left addon/icon */
  leftAddon?: React.ReactNode;
  /** Right addon/icon */
  rightAddon?: React.ReactNode;
}

/**
 * Input component
 * Form input field with consistent styling
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = 'text', size = 'md', error = false, leftAddon, rightAddon, ...props },
    ref
  ) => {
    const inputElement = (
      <input
        ref={ref}
        type={type}
        aria-invalid={error || undefined}
        className={cn(
          baseInputClasses,
          sizeClasses[size],
          leftAddon && 'pl-10',
          rightAddon && 'pr-10',
          className
        )}
        {...props}
      />
    );

    if (!leftAddon && !rightAddon) {
      return inputElement;
    }

    return (
      <div className="relative">
        {leftAddon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-tertiary">
            {leftAddon}
          </div>
        )}
        {inputElement}
        {rightAddon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-tertiary">
            {rightAddon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state */
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(baseInputClasses, 'min-h-[100px] py-3 px-4 text-sm resize-y', className)}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';

// Form field wrapper with label
export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) => (
  <div className={cn('space-y-1.5', className)}>
    {label && (
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
    {error && (
      <p className="text-xs text-error" role="alert">
        {error}
      </p>
    )}
  </div>
);

export default Input;
