'use client';

import { useState } from 'react';
import type { VideoHighlight } from '@/lib/types/adapters';
import { Card } from '@/components/ui/Card';
import { VideoHighlightCard } from './VideoHighlightCard';
import { VideoPlayer } from './VideoPlayer';

export interface VideoHighlightsSectionProps {
  videos: VideoHighlight[];
  title?: string;
  loading?: boolean;
  columns?: 2 | 3 | 4;
  showPlayer?: boolean;
  maxVideos?: number;
  onViewAll?: () => void;
  className?: string;
}

/**
 * Video Highlights Section
 *
 * Displays a grid of video highlight cards with optional inline player.
 * Can be used standalone or within larger layouts.
 */
export function VideoHighlightsSection({
  videos,
  title = 'Video Highlights',
  loading = false,
  columns = 2,
  showPlayer = true,
  maxVideos,
  onViewAll,
  className = '',
}: VideoHighlightsSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoHighlight | null>(null);

  const displayVideos = maxVideos ? videos.slice(0, maxVideos) : videos;
  const hasMore = maxVideos ? videos.length > maxVideos : false;

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        {title && <h3 className="text-white font-semibold mb-3">{title}</h3>}
        <div className={`grid ${gridCols[columns]} gap-3`}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton aspect-video rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (videos.length === 0) {
    return (
      <div className={className}>
        {title && <h3 className="text-white font-semibold mb-3">{title}</h3>}
        <Card variant="default">
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto text-white/20 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-white/50">No video highlights available</p>
            <p className="text-white/30 text-sm mt-1">Check back later for game highlights</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {title && <h3 className="text-white font-semibold">{title}</h3>}
        {hasMore && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-burnt-orange text-sm hover:text-burnt-orange/80 transition-colors"
          >
            View all →
          </button>
        )}
      </div>

      {/* Selected video player */}
      {showPlayer && selectedVideo && (
        <Card variant="default" className="mb-4">
          <VideoPlayer video={selectedVideo} />
          <div className="mt-3">
            <h4 className="text-white font-semibold">{selectedVideo.title}</h4>
            {selectedVideo.description && (
              <p className="text-white/50 text-sm mt-1">{selectedVideo.description}</p>
            )}
          </div>
          <button
            onClick={() => setSelectedVideo(null)}
            className="mt-3 text-xs text-burnt-orange hover:text-burnt-orange/80 transition-colors"
          >
            Close player
          </button>
        </Card>
      )}

      {/* Video grid */}
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {displayVideos.map((video) => (
          <VideoHighlightCard
            key={video.id}
            video={video}
            onClick={() => setSelectedVideo(video)}
            isSelected={selectedVideo?.id === video.id}
          />
        ))}
      </div>

      {/* View all button (mobile) */}
      {hasMore && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-4 py-2 text-burnt-orange text-sm border border-burnt-orange/30 rounded hover:bg-burnt-orange/10 transition-colors md:hidden"
        >
          View all {videos.length} videos
        </button>
      )}
    </div>
  );
}

// Loading skeleton
export function VideoHighlightsSkeleton({ columns = 2 }: { columns?: 2 | 3 | 4 }) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton aspect-video rounded" />
      ))}
    </div>
  );
}

export default VideoHighlightsSection;
