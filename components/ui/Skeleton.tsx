interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function Skeleton({ variant = 'rectangular', width, height, className = '' }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const variantClass =
    variant === 'circular' ? 'rounded-full' : variant === 'text' ? 'rounded' : 'rounded-lg';

  return (
    <div
      className={`bg-white/10 animate-pulse ${variantClass} ${className}`}
      style={style}
    />
  );
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton variant="text" height={16} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonScoreCard() {
  return (
    <div className="bg-white/5 rounded-lg p-4 animate-pulse">
      <div className="flex justify-between items-center mb-3">
        <Skeleton variant="text" width={120} height={16} />
        <Skeleton variant="text" width={40} height={24} />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width={120} height={16} />
        <Skeleton variant="text" width={40} height={24} />
      </div>
    </div>
  );
}
