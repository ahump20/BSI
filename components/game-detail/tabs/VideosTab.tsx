'use client';

import { useState } from 'react';
import type { VideosTabProps } from '../GameDetailModal.types';
import type { VideoHighlight, VideoSource } from '@/lib/types/adapters';
import { Card } from '@/components/ui/Card';
import { InlineClip } from '@/components/StreamVideo';

export function VideosTab({ videos, loading }: VideosTabProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoHighlight | null>(null);

  // Loading state
  if (loading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
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
      <div className="p-4">
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
    <div className="p-4">
      {/* Video player (when video is selected) */}
      {selectedVideo && (
        <Card variant="default" className="mb-4">
          <div className="aspect-video bg-black rounded overflow-hidden">
            <VideoPlayer video={selectedVideo} />
          </div>
          <div className="mt-3">
            <h3 className="text-white font-semibold">{selectedVideo.title}</h3>
            {selectedVideo.description && (
              <p className="text-white/50 text-sm mt-1">{selectedVideo.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
              <SourceBadge source={selectedVideo.source} />
              <span>{formatDuration(selectedVideo.duration)}</span>
            </div>
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
      <div className="grid grid-cols-2 gap-3">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => setSelectedVideo(video)}
            isSelected={selectedVideo?.id === video.id}
          />
        ))}
      </div>
    </div>
  );
}

// Video thumbnail card
function VideoCard({
  video,
  onClick,
  isSelected,
}: {
  video: VideoHighlight;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left group relative rounded overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-burnt-orange' : 'hover:ring-1 hover:ring-white/30'
      }`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-charcoal relative">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white/20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-burnt-orange flex items-center justify-center">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[10px] text-white font-mono">
          {formatDuration(video.duration)}
        </div>

        {/* Featured badge */}
        {video.featured && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-burnt-orange rounded text-[10px] text-white font-semibold">
            FEATURED
          </div>
        )}
      </div>

      {/* Title and metadata */}
      <div className="p-2">
        <p className="text-white text-xs font-medium line-clamp-2">{video.title}</p>
        <div className="flex items-center gap-1 mt-1">
          <SourceBadge source={video.source} size="sm" />
        </div>
      </div>
    </button>
  );
}

// Video player component
function VideoPlayer({ video }: { video: VideoHighlight }) {
  // Handle different video sources
  switch (video.source) {
    case 'CLOUDFLARE_STREAM':
      return (
        <InlineClip streamId={video.videoUrl} title={video.title} description={video.description} />
      );

    case 'YOUTUBE':
      // Extract video ID if full URL
      const videoId = video.videoUrl.includes('youtube.com')
        ? new URLSearchParams(new URL(video.videoUrl).search).get('v')
        : video.videoUrl;
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={video.title}
        />
      );

    case 'ESPN':
      return (
        <iframe
          src={video.videoUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={video.title}
        />
      );

    case 'MLB':
      return (
        <iframe
          src={video.videoUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={video.title}
        />
      );

    default:
      return (
        <video
          src={video.videoUrl}
          controls
          autoPlay
          className="w-full h-full"
          title={video.title}
        />
      );
  }
}

// Source badge component
function SourceBadge({ source, size = 'md' }: { source: VideoSource; size?: 'sm' | 'md' }) {
  const sourceColors: Record<VideoSource, string> = {
    ESPN: 'bg-red-600/20 text-red-400',
    YOUTUBE: 'bg-red-600/20 text-red-400',
    CLOUDFLARE_STREAM: 'bg-orange-600/20 text-orange-400',
    MLB: 'bg-blue-600/20 text-blue-400',
    FALLBACK: 'bg-white/10 text-white/50',
  };

  const sourceLabels: Record<VideoSource, string> = {
    ESPN: 'ESPN',
    YOUTUBE: 'YouTube',
    CLOUDFLARE_STREAM: 'BSI',
    MLB: 'MLB',
    FALLBACK: 'Video',
  };

  return (
    <span
      className={`px-1.5 py-0.5 rounded font-medium ${sourceColors[source]} ${
        size === 'sm' ? 'text-[10px]' : 'text-xs'
      }`}
    >
      {sourceLabels[source]}
    </span>
  );
}

// Format duration from seconds to MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
