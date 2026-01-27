'use client';

import type { VideoHighlight, VideoSource } from '@/lib/types/adapters';

export interface VideoHighlightCardProps {
  video: VideoHighlight;
  onClick: () => void;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SOURCE_COLORS: Record<VideoSource, string> = {
  ESPN: 'bg-red-600/20 text-red-400',
  YOUTUBE: 'bg-red-600/20 text-red-400',
  CLOUDFLARE_STREAM: 'bg-orange-600/20 text-orange-400',
  MLB: 'bg-blue-600/20 text-blue-400',
  FALLBACK: 'bg-white/10 text-white/50',
};

const SOURCE_LABELS: Record<VideoSource, string> = {
  ESPN: 'ESPN',
  YOUTUBE: 'YouTube',
  CLOUDFLARE_STREAM: 'BSI',
  MLB: 'MLB',
  FALLBACK: 'Video',
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoHighlightCard({
  video,
  onClick,
  isSelected = false,
  size = 'md',
  className = '',
}: VideoHighlightCardProps) {
  const sizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const playButtonSize = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const playIconSize = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={onClick}
      aria-label={`Play video: ${video.title}`}
      aria-pressed={isSelected}
      className={`text-left group relative rounded overflow-hidden transition-all touch-target ${
        isSelected ? 'ring-2 ring-burnt-orange' : 'hover:ring-1 hover:ring-white/30'
      } ${className}`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-charcoal relative">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white/20"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* Play overlay */}
        <div
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          aria-hidden="true"
        >
          <div
            className={`${playButtonSize[size]} rounded-full bg-burnt-orange flex items-center justify-center`}
          >
            <svg
              className={`${playIconSize[size]} text-white ml-0.5`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        <div
          className={`absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded ${sizeClasses[size]} text-white font-mono`}
        >
          {formatDuration(video.duration)}
        </div>

        {/* Featured badge */}
        {video.featured && (
          <div
            className={`absolute top-1 left-1 px-1.5 py-0.5 bg-burnt-orange rounded ${sizeClasses[size]} text-white font-semibold`}
          >
            FEATURED
          </div>
        )}
      </div>

      {/* Title and metadata */}
      <div className="p-2">
        <p className={`text-white ${sizeClasses[size]} font-medium line-clamp-2`}>{video.title}</p>
        <div className="flex items-center gap-1 mt-1">
          <span
            className={`px-1.5 py-0.5 rounded font-medium ${SOURCE_COLORS[video.source]} ${sizeClasses[size]}`}
          >
            {SOURCE_LABELS[video.source]}
          </span>
        </div>
      </div>
    </button>
  );
}

export default VideoHighlightCard;
