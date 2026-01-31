'use client';

import { useEffect, useState } from 'react';

const STREAM_SRC =
  'https://customer-mpdvoybjqct2pzls.cloudflarestream.com/138facaf760c65e9b4efab3715ae6f50/iframe';
const POSTER_SRC =
  'https://customer-mpdvoybjqct2pzls.cloudflarestream.com/138facaf760c65e9b4efab3715ae6f50/thumbnails/thumbnail.jpg?height=600';

/**
 * Cinematic hero video background using Cloudflare Stream.
 * - Muted autoplay loop
 * - Poster image as fallback
 * - prefers-reduced-motion: poster only
 */
export function HeroVideo() {
  const [prefersReduced, setPrefersReduced] = useState(false);

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
        style={{ backgroundImage: `url(${POSTER_SRC})` }}
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
        style={{ backgroundImage: `url(${POSTER_SRC})` }}
      />
      <iframe
        src={`${STREAM_SRC}?muted=true&autoplay=true&loop=true&controls=false&poster=${encodeURIComponent(POSTER_SRC)}`}
        className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 border-0"
        style={{ width: '177.78vh', height: '100vh' }}
        allow="autoplay; encrypted-media"
        loading="lazy"
        title="BSI promotional video background"
      />
    </div>
  );
}
