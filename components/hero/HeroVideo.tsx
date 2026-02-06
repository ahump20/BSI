'use client';

import { useEffect, useMemo, useState } from 'react';

const STREAM_BASE = 'https://customer-mpdvoybjqct2pzls.cloudflarestream.com';

/** Tier 1 austin-commentary clips — Austin dominant, great energy, on-brand. */
const HERO_VIDEO_IDS = [
  '7047d3e5366504c0d6b314bbc3b4a047', // 021 – Analytics in coaching (Harbaugh/Ravens)
  '9a7ef3c86634139f15a6d39500005ca1', // 040 – NIL at Texas
  '655bb4b37c34c7f370275b717da377c0', // 013 – Cardinals fandom, baseball memories
  'c73e476f6bf8bb4c97f1d5c8c04593c9', // 035 – Sports discussion, chin-rest pose
] as const;

/**
 * Cinematic hero video background using Cloudflare Stream.
 * - Picks a random clip from HERO_VIDEO_IDS on each mount
 * - Muted autoplay loop
 * - Poster image as fallback
 * - prefers-reduced-motion: poster only
 */
export function HeroVideo() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  const videoId = useMemo(
    () => HERO_VIDEO_IDS[Math.floor(Math.random() * HERO_VIDEO_IDS.length)],
    [],
  );

  const streamSrc = `${STREAM_BASE}/${videoId}/iframe`;
  const posterSrc = `${STREAM_BASE}/${videoId}/thumbnails/thumbnail.jpg?height=600`;

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (prefersReduced) {
    return (
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${posterSrc})` }}
        role="img"
        aria-label="Blaze Sports Intel promotional image"
      />
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Static poster fallback behind iframe in case Stream is unreachable */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${posterSrc})` }}
      />
      <iframe
        src={`${streamSrc}?muted=true&autoplay=true&loop=true&controls=false&poster=${encodeURIComponent(posterSrc)}`}
        className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 border-0"
        style={{ width: '177.78vh', height: '100vh' }}
        allow="autoplay; encrypted-media"
        loading="lazy"
        title="BSI promotional video background"
      />
    </div>
  );
}
