import { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

type BaseProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

type ButtonAsButton = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<string, string> = {
  primary: 'bg-[var(--bsi-primary)] hover:brightness-110 text-white border-transparent',
  secondary: 'bg-transparent hover:bg-[var(--surface-press-box)] text-[var(--bsi-bone)] border-border',
  ghost: 'bg-transparent hover:bg-[var(--surface-press-box)] text-[var(--bsi-dust)] border-transparent',
  outline: 'bg-transparent text-[var(--bsi-bone)] border-border hover:border-[var(--bsi-primary)] hover:text-[var(--bsi-primary)]',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  href,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center font-semibold rounded-sm border transition-all duration-300 uppercase tracking-wider ${variantClasses[variant] ?? variantClasses.primary} ${sizeClasses[size] ?? sizeClasses.md} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
