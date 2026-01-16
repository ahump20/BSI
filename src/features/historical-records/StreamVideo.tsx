/**
 * BSI Stream Video Components
 * Cloudflare Stream integration for BlazeSportsIntel.com
 *
 * Brand Colors:
 * - Burnt Orange: #BF5700
 * - Texas Soil: #8B4513
 * - Charcoal: #1A1A1A
 * - Midnight: #0D0D0D
 * - Ember (accent): #FF6B35
 */

import React, { useState, useRef as _useRef, useEffect } from 'react';

// Configuration - set once for all components
const STREAM_CUSTOMER_CODE = 'mpdvoybjqct2pzls'; // BSI Cloudflare Stream customer code

interface StreamVideoProps {
  streamId: string;
  title: string;
  description?: string;
  poster?: string;
}

// =============================================================================
// BASE STREAM PLAYER - Internal component used by all variants
// =============================================================================

interface BasePlayerProps extends StreamVideoProps {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  aspectRatio?: '16:9' | '4:3' | '1:1';
  className?: string;
}

function BaseStreamPlayer({
  streamId,
  title,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  aspectRatio = '16:9',
  className = '',
}: BasePlayerProps) {
  const aspectRatioMap = {
    '16:9': '56.25%',
    '4:3': '75%',
    '1:1': '100%',
  };

  const params = new URLSearchParams();
  if (autoplay) params.set('autoplay', 'true');
  if (muted) params.set('muted', 'true');
  if (loop) params.set('loop', 'true');
  if (!controls) params.set('controls', 'false');
  params.set('preload', 'metadata');

  const embedUrl = `https://customer-${STREAM_CUSTOMER_CODE}.cloudflarestream.com/${streamId}/iframe?${params.toString()}`;

  return (
    <div
      className={`bsi-video-container ${className}`}
      style={{
        position: 'relative',
        paddingTop: aspectRatioMap[aspectRatio],
        backgroundColor: '#0D0D0D',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <iframe
        src={embedUrl}
        title={title}
        style={{
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
        }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// =============================================================================
// INLINE CLIP - Short clips (12-60s) placed between sections
// =============================================================================

export function InlineClip({ streamId, title, description }: StreamVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const handlePlay = () => {
    setIsPlaying(true);
    setShowOverlay(false);
  };

  return (
    <div
      className="bsi-inline-clip"
      style={{
        margin: '3rem 0',
        maxWidth: '720px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <div style={{ position: 'relative' }}>
        {/* Accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            backgroundColor: '#FF6B35',
            borderRadius: '4px 0 0 4px',
            zIndex: 10,
          }}
        />

        {/* Video container */}
        <div style={{ paddingLeft: '12px' }}>
          {!isPlaying && showOverlay ? (
            <div
              onClick={handlePlay}
              style={{
                position: 'relative',
                paddingTop: '56.25%',
                backgroundColor: '#1A1A1A',
                borderRadius: '8px',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              {/* Thumbnail with play overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%)',
                }}
              >
                {/* Play button */}
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: '#BF5700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    boxShadow: '0 4px 20px rgba(191, 87, 0, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = '#FF6B35';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = '#BF5700';
                  }}
                >
                  <svg
                    width="28"
                    height="32"
                    viewBox="0 0 28 32"
                    fill="none"
                    style={{ marginLeft: '4px' }}
                  >
                    <path d="M28 16L0 32V0L28 16Z" fill="white" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <BaseStreamPlayer
              streamId={streamId}
              title={title}
              autoplay={isPlaying}
              muted={false}
              controls={true}
            />
          )}
        </div>
      </div>

      {/* Title and description */}
      <div style={{ paddingLeft: '12px', marginTop: '1rem' }}>
        <h4
          style={{
            margin: 0,
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#FFFFFF',
            lineHeight: 1.4,
          }}
        >
          {title}
        </h4>
        {description && (
          <p
            style={{
              margin: '0.5rem 0 0 0',
              fontSize: '0.9375rem',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HERO REEL - Autoplay muted clip under homepage hero
// =============================================================================

export function HeroReel({ streamId, title, description }: StreamVideoProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [userTriggered, setUserTriggered] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On mobile, require tap to play (respects user data)
  const shouldAutoplay = !isMobile || userTriggered;

  return (
    <div
      className="bsi-hero-reel"
      style={{
        width: '100%',
        backgroundColor: '#0D0D0D',
        padding: '0',
        position: 'relative',
      }}
    >
      {/* Gradient fade from hero */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to bottom, #0D0D0D, transparent)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1rem',
        }}
      >
        {isMobile && !userTriggered ? (
          <div
            onClick={() => setUserTriggered(true)}
            style={{
              position: 'relative',
              paddingTop: '56.25%',
              backgroundColor: '#1A1A1A',
              borderRadius: '8px',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#BF5700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="28" viewBox="0 0 28 32" fill="white">
                  <path d="M28 16L0 32V0L28 16Z" />
                </svg>
              </div>
              <span
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Tap to play
              </span>
            </div>
          </div>
        ) : (
          <BaseStreamPlayer
            streamId={streamId}
            title={title}
            autoplay={shouldAutoplay}
            muted={true}
            loop={true}
            controls={false}
          />
        )}

        {/* Subtle caption bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#FF6B35',
              }}
            >
              Featured
            </span>
            <h3
              style={{
                margin: '0.25rem 0 0 0',
                fontSize: '1rem',
                fontWeight: 500,
                color: '#FFFFFF',
              }}
            >
              {title}
            </h3>
          </div>
          {description && (
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.6)',
                maxWidth: '400px',
                textAlign: 'right',
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Gradient fade to next section */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to top, #0D0D0D, transparent)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// =============================================================================
// LEAGUE DEEP DIVE - Featured video at top of league analytics pages
// =============================================================================

export function LeagueDeepDive({ streamId, title, description }: StreamVideoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="bsi-league-deep-dive"
      style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '2rem',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(90deg, rgba(191,87,0,0.15) 0%, transparent 50%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Fire icon */}
          <svg width="20" height="24" viewBox="0 0 20 24" fill="#FF6B35">
            <path d="M10 0C10 0 6 4 6 10C6 12 7 14 10 14C13 14 14 12 14 10C14 4 10 0 10 0ZM10 20C6 20 4 17 4 14C4 11 6 8 10 8C14 8 16 11 16 14C16 17 14 20 10 20ZM10 24C4.5 24 0 19.5 0 14C0 8.5 4.5 4 10 4C15.5 4 20 8.5 20 14C20 19.5 15.5 24 10 24Z" />
          </svg>
          <div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#FF6B35',
              }}
            >
              Deep Dive
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#FFFFFF',
              }}
            >
              {title}
            </h2>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            color: '#FFFFFF',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#FF6B35';
            e.currentTarget.style.color = '#FF6B35';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Video section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isExpanded ? '1fr' : '2fr 1fr',
          gap: 0,
          transition: 'grid-template-columns 0.3s ease',
        }}
      >
        {/* Video player */}
        <div style={{ padding: '1.5rem' }}>
          <BaseStreamPlayer
            streamId={streamId}
            title={title}
            autoplay={false}
            muted={false}
            controls={true}
          />
        </div>

        {/* Description panel (hidden when expanded) */}
        {!isExpanded && description && (
          <div
            style={{
              padding: '1.5rem',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <h3
              style={{
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#FFFFFF',
              }}
            >
              About This Analysis
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.9375rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
              }}
            >
              {description}
            </p>

            {/* Texas soil accent line */}
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(139,69,19,0.3)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#8B4513',
                  fontWeight: 500,
                }}
              >
                Blaze Sports Intel • Original Analysis
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { BaseStreamPlayer };
export type { StreamVideoProps, BasePlayerProps };
