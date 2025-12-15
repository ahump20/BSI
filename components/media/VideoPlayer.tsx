'use client';

import type { VideoHighlight, VideoSource } from '@/lib/types/adapters';
import { InlineClip } from '@/components/StreamVideo';

export interface VideoPlayerProps {
  video: VideoHighlight;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Multi-source video player
 *
 * Handles different video sources:
 * - CLOUDFLARE_STREAM: BSI's own video hosting
 * - YOUTUBE: Embedded YouTube player
 * - ESPN: ESPN video embed
 * - MLB: MLB video embed
 * - FALLBACK: HTML5 video element
 */
export function VideoPlayer({ video, autoPlay = true, className = '' }: VideoPlayerProps) {
  return (
    <div className={`aspect-video bg-black rounded overflow-hidden ${className}`}>
      <VideoPlayerInner video={video} autoPlay={autoPlay} />
    </div>
  );
}

function VideoPlayerInner({ video, autoPlay }: { video: VideoHighlight; autoPlay: boolean }) {
  switch (video.source) {
    case 'CLOUDFLARE_STREAM':
      // videoUrl contains the Cloudflare Stream ID
      return (
        <InlineClip streamId={video.videoUrl} title={video.title} description={video.description} />
      );

    case 'YOUTUBE': {
      // Extract video ID if full URL
      let videoId = video.videoUrl;
      if (video.videoUrl.includes('youtube.com')) {
        videoId = new URLSearchParams(new URL(video.videoUrl).search).get('v') || video.videoUrl;
      } else if (video.videoUrl.includes('youtu.be/')) {
        videoId = video.videoUrl.split('youtu.be/')[1]?.split('?')[0] || video.videoUrl;
      }
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}`}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={video.title}
        />
      );
    }

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
          autoPlay={autoPlay}
          className="w-full h-full"
          title={video.title}
        />
      );
  }
}

export default VideoPlayer;
