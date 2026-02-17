import type { ElementType, ReactNode } from 'react';

type ContainerSize = 'default' | 'narrow' | 'wide' | 'full';

type ContainerProps<T extends ElementType = 'div'> = {
  as?: T;
  children: ReactNode;
  className?: string;
  center?: boolean;
  size?: ContainerSize;
};

const SIZE_CLASS: Record<ContainerSize, string> = {
  default: 'max-w-6xl',
  narrow: 'max-w-4xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

export function Container<T extends ElementType = 'div'>({
  as,
  children,
  className = '',
  center = false,
  size = 'default',
}: ContainerProps<T>) {
  const Tag = (as || 'div') as ElementType;

  return (
    <Tag
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${SIZE_CLASS[size]} ${center ? 'text-center' : ''} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}

export default Container;
