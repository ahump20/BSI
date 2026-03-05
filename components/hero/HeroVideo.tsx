'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
 *
 * Strategy:
 * - Safari: native <video> + HLS manifest → full CSS control (object-fit, filters)
 * - Chrome/Firefox: <iframe> embed (HLS.js bundled by Stream) → proven playback
 * - Both: high-quality poster (1080p) as static fallback behind video
 * - prefers-reduced-motion: poster only, no video
 */
export function HeroVideo() {
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [supportsHLS, setSupportsHLS] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoId = useMemo(
    () => HERO_VIDEO_IDS[Math.floor(Math.random() * HERO_VIDEO_IDS.length)],
    [],
  );

  const hlsSrc = `${STREAM_BASE}/${videoId}/manifest/video.m3u8`;
  const iframeSrc = `${STREAM_BASE}/${videoId}/iframe?muted=true&autoplay=true&loop=true&controls=false`;
  const posterSrc = `${STREAM_BASE}/${videoId}/thumbnails/thumbnail.jpg?height=1080`;

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Detect native HLS support (Safari = yes, Chrome/Firefox = no)
  useEffect(() => {
    if (prefersReduced) return;
    const video = document.createElement('video');
    setSupportsHLS(!!video.canPlayType('application/vnd.apple.mpegurl'));
  }, [prefersReduced]);

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

  // Waiting for HLS detection
  if (supportsHLS === null) {
    return (
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${posterSrc})` }}
      />
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Static poster fallback behind video */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${posterSrc})` }}
      />

      {supportsHLS ? (
        /* Safari: native <video> with HLS → full CSS control */
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: 'cover',
            objectPosition: 'center 30%',
            filter: 'contrast(1.05) brightness(1.02)',
            willChange: 'transform',
          }}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-label="BSI promotional video background"
        >
          <source src={hlsSrc} type="application/x-mpegURL" />
        </video>
      ) : (
        /* Chrome/Firefox: iframe embed (Stream bundles HLS.js) */
        <iframe
          src={iframeSrc}
          className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 border-0"
          style={{
            width: '177.78vh',
            height: '100vh',
            filter: 'contrast(1.05) brightness(1.02)',
          }}
          allow="autoplay; encrypted-media"
          loading="lazy"
          title="BSI promotional video background"
        />
      )}
    </div>
  );
}
