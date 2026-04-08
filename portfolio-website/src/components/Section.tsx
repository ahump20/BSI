import type { ReactNode } from 'react';

export default function Section({
  id,
  label,
  title,
  className = '',
  glow = false,
  children,
}: {
  id: string;
  label?: string;
  title?: string;
  className?: string;
  glow?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`section-padding ${glow ? 'section-glow' : ''} ${className}`}
    >
      <div className="container-custom">
        {label && <p className="section-label">// {label}</p>}
        {title && <h2 className="section-title">{title}</h2>}
        {children}
      </div>
    </section>
  );
}
