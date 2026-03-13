'use client';

/**
 * TeamVideoPanel — "Film Room" section for college baseball team pages.
 *
 * Heritage broadcast aesthetic: dugout surface, corner-marks, heritage-stamp
 * header, flat bottom-border filter tabs, featured video treatment.
 *
 * Embeds curated YouTube videos using the privacy-enhanced youtube-nocookie.com
 * domain. Videos lazy-load via srcdoc pattern: no YouTube JS executes until the
 * user clicks play. Responsive 16:9 aspect ratio, 1-col mobile / 2-col desktop.
 *
 * Only renders if the team has curated video content in the registry.
 */

import { useState, useMemo } from 'react';
import { getTeamVideos, type TeamVideo } from '@/lib/data/team-videos';

// ─── Category Labels ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<TeamVideo['category'], string> = {
  highlights: 'Highlights',
  program: 'Program',
  analytics: 'Analytics',
  interview: 'Interview',
};

const CATEGORY_ORDER: TeamVideo['category'][] = ['highlights', 'program', 'interview', 'analytics'];

/** Minimum videos for featured (full-width lead) treatment */
const FEATURED_THRESHOLD = 4;

// ─── Lazy YouTube Embed ─────────────────────────────────────────────────────

/**
 * srcdoc pattern: renders a lightweight play-button thumbnail.
 * Clicking it replaces the srcdoc with the real YouTube embed.
 * Zero YouTube JS loaded until the user explicitly clicks.
 */
function buildSrcdoc(youtubeId: string, title: string): string {
  const thumbUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  return `<style>
*{padding:0;margin:0;overflow:hidden}
html,body{height:100%;background:#0D0D0D}
img{position:absolute;width:100%;top:0;bottom:0;margin:auto}
.play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
width:72px;height:50px;background:rgba(191,87,0,0.9);border-radius:6px;
display:flex;align-items:center;justify-content:center;cursor:pointer;
transition:background 0.2s,box-shadow 0.2s;
box-shadow:0 2px 12px rgba(0,0,0,0.4)}
.play:hover{background:rgba(191,87,0,1);box-shadow:0 4px 20px rgba(191,87,0,0.35)}
.play svg{width:26px;height:26px;fill:#fff;margin-left:3px}
.badge{position:absolute;bottom:8px;left:8px;background:rgba(13,13,13,0.85);
color:#BF5700;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;
letter-spacing:0.08em;text-transform:uppercase;padding:3px 8px;border-radius:2px;
border:1px solid rgba(191,87,0,0.3)}
</style>
<a href="https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0" title="${title.replace(/"/g, '&quot;')}">
<img src="${thumbUrl}" alt="${title.replace(/"/g, '&quot;')}" loading="lazy">
<div class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
</a>`;
}

function buildSrcdocWithBadge(youtubeId: string, title: string, category: string): string {
  const thumbUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  return `<style>
*{padding:0;margin:0;overflow:hidden}
html,body{height:100%;background:#0D0D0D}
img{position:absolute;width:100%;top:0;bottom:0;margin:auto}
.play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
width:72px;height:50px;background:rgba(191,87,0,0.9);border-radius:6px;
display:flex;align-items:center;justify-content:center;cursor:pointer;
transition:background 0.2s,box-shadow 0.2s;
box-shadow:0 2px 12px rgba(0,0,0,0.4)}
.play:hover{background:rgba(191,87,0,1);box-shadow:0 4px 20px rgba(191,87,0,0.35)}
.play svg{width:26px;height:26px;fill:#fff;margin-left:3px}
.badge{position:absolute;bottom:8px;left:8px;background:rgba(13,13,13,0.85);
color:#BF5700;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;
letter-spacing:0.08em;text-transform:uppercase;padding:3px 8px;border-radius:2px;
border:1px solid rgba(191,87,0,0.3)}
</style>
<a href="https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0" title="${title.replace(/"/g, '&quot;')}">
<img src="${thumbUrl}" alt="${title.replace(/"/g, '&quot;')}" loading="lazy">
<div class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
<div class="badge">${category}</div>
</a>`;
}

function YouTubeEmbed({ video, featured = false }: { video: TeamVideo; featured?: boolean }) {
  return (
    <div className={`group ${featured ? 'col-span-1 md:col-span-2' : ''}`}>
      {/* Thumbnail container */}
      <div
        className="relative w-full overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(191,87,0,0.1)]"
        style={{
          paddingBottom: '56.25%',
          borderRadius: '2px',
          border: '1px solid var(--border-vintage)',
        }}
      >
        <iframe
          className="absolute inset-0 w-full h-full border-0"
          srcDoc={buildSrcdocWithBadge(video.youtubeId, video.title, CATEGORY_LABELS[video.category])}
          title={video.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Metadata */}
      <div className="mt-3 px-0.5">
        <div className="flex items-center gap-2 mb-1">
          {video.season && (
            <span
              className="text-[10px] tracking-wider"
              style={{
                fontFamily: 'var(--bsi-font-mono)',
                color: 'var(--bsi-primary)',
              }}
            >
              {video.season}
            </span>
          )}
        </div>
        <h4
          className="text-sm font-semibold leading-snug line-clamp-2 uppercase tracking-wide"
          style={{
            fontFamily: 'var(--bsi-font-display)',
            color: 'var(--bsi-bone)',
          }}
        >
          {video.title}
        </h4>
        {video.description && (
          <p
            className="text-xs mt-1.5 leading-relaxed line-clamp-2"
            style={{
              fontFamily: 'var(--bsi-font-body)',
              color: 'var(--bsi-dust)',
            }}
          >
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Filter Tabs ────────────────────────────────────────────────────────────

type FilterTab = 'all' | TeamVideo['category'];

// ─── Main Component ─────────────────────────────────────────────────────────

export function TeamVideoPanel({ teamId }: { teamId: string }) {
  const allVideos = useMemo(() => getTeamVideos(teamId), [teamId]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Determine which category tabs to show (only categories that have videos)
  const availableCategories = useMemo(() => {
    const cats = new Set(allVideos.map(v => v.category));
    return CATEGORY_ORDER.filter(c => cats.has(c));
  }, [allVideos]);

  if (allVideos.length === 0) return null;

  const filtered = activeFilter === 'all'
    ? allVideos
    : allVideos.filter(v => v.category === activeFilter);

  // Featured treatment: first video gets full-width when enough content exists
  const hasFeatured = filtered.length >= FEATURED_THRESHOLD && activeFilter === 'all';
  const featuredVideo = hasFeatured ? filtered[0] : null;
  const gridVideos = hasFeatured ? filtered.slice(1) : filtered;

  return (
    <div className="heritage-card corner-marks p-6">
      {/* Header — heritage-stamp pattern */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--bsi-primary)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="heritage-stamp">Film Room</span>
        </div>
        <span
          className="text-[10px] tracking-wider uppercase"
          style={{
            fontFamily: 'var(--bsi-font-mono)',
            color: 'var(--bsi-dust)',
          }}
        >
          {allVideos.length} {allVideos.length === 1 ? 'video' : 'videos'}
        </span>
      </div>

      {/* Filter tabs — flat bottom-border style */}
      {availableCategories.length > 1 && (
        <div
          className="flex gap-0 mb-6 overflow-x-auto"
          style={{ borderBottom: '1px solid var(--border-vintage)' }}
        >
          <button
            onClick={() => setActiveFilter('all')}
            className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap relative"
            style={{
              fontFamily: 'var(--bsi-font-display)',
              color: activeFilter === 'all' ? 'var(--bsi-bone)' : 'var(--bsi-dust)',
              borderBottom: activeFilter === 'all' ? '2px solid var(--bsi-primary)' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            All
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap relative"
              style={{
                fontFamily: 'var(--bsi-font-display)',
                color: activeFilter === cat ? 'var(--bsi-bone)' : 'var(--bsi-dust)',
                borderBottom: activeFilter === cat ? '2px solid var(--bsi-primary)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Featured video — full width lead clip */}
      {featuredVideo && (
        <div className="mb-6">
          <YouTubeEmbed video={featuredVideo} featured />
        </div>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gridVideos.map(video => (
          <YouTubeEmbed key={video.youtubeId} video={video} />
        ))}
      </div>
    </div>
  );
}
