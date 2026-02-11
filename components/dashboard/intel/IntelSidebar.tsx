'use client';

interface IntelSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function IntelSidebar({ children, className = '' }: IntelSidebarProps) {
  return (
    <aside className={`flex flex-col gap-6 lg:sticky lg:top-4 lg:self-start ${className}`}>
      {children}
    </aside>
  );
}
