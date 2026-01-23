import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';

export function OriginStory(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phase1End = fps * 4;    // Memphis birth (4s)
  const phase2End = fps * 8;    // Texas soil + newspaper (4s)
  const phase3End = fps * 13;   // Doctor quote (5s)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BSI_COLORS.midnight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {frame < phase1End && (
        <MemphisBirth frame={frame} fps={fps} />
      )}
      {frame >= phase1End && frame < phase2End && (
        <TexasSoilPhase frame={frame - phase1End} fps={fps} />
      )}
      {frame >= phase2End && frame < phase3End && (
        <DoctorQuote frame={frame - phase2End} fps={fps} />
      )}
      {frame >= phase3End && (
        <BlazeNameOrigin frame={frame - phase3End} fps={fps} />
      )}
    </AbsoluteFill>
  );
}

function MemphisBirth({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const textProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const emphasisProgress = spring({
    frame: frame - fps,
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.8 },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 30,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 20,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 6,
          opacity: textProgress,
        }}
      >
        The Founder
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
          opacity: emphasisProgress,
          transform: `scale(${emphasisProgress})`,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 64,
            fontWeight: 300,
            color: BSI_COLORS.white,
          }}
        >
          Born in
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 64,
            fontWeight: 800,
            color: BSI_COLORS.burntOrange,
          }}
        >
          Memphis, TN
        </span>
      </div>
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 18,
          fontWeight: 500,
          color: BSI_COLORS.muted,
          opacity: emphasisProgress,
        }}
      >
        On the birthday of Davy Crockett
      </span>
    </div>
  );
}

function TexasSoilPhase({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const containerProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 80, mass: 1 },
  });

  const imageProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 20, stiffness: 100, mass: 1 },
  });

  const textProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 40,
        opacity: containerProgress,
      }}
    >
      {/* Single newspaper clipping with soil */}
      <div
        style={{
          width: 400,
          height: 280,
          borderRadius: 12,
          overflow: 'hidden',
          opacity: imageProgress,
          transform: `scale(${interpolate(imageProgress, [0, 1], [0.9, 1])}) rotate(1deg)`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <Img
          src={staticFile('images/texas-soil-newspaper.webp')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          opacity: textProgress,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 36,
            fontWeight: 300,
            color: BSI_COLORS.white,
          }}
        >
          Rooted in
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 48,
            fontWeight: 800,
            color: BSI_COLORS.texasSoil,
          }}
        >
          Texas Soil
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 16,
            fontWeight: 500,
            color: BSI_COLORS.muted,
          }}
        >
          From West Columbia — birthplace of the Republic
        </span>
      </div>
    </div>
  );
}

function DoctorQuote({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const quoteProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 80, mass: 1 },
  });

  const punchlineProgress = spring({
    frame: frame - fps * 2.5,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 40,
        padding: 60,
        maxWidth: 1000,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 18,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 4,
          opacity: quoteProgress,
        }}
      >
        The Doctor Said
      </span>

      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 32,
          fontWeight: 400,
          color: BSI_COLORS.white,
          textAlign: 'center',
          lineHeight: 1.5,
          opacity: quoteProgress,
          transform: `translateY(${interpolate(quoteProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        "You know you ain't the first to do this..."
      </span>

      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 40,
          fontWeight: 800,
          color: BSI_COLORS.burntOrange,
          textAlign: 'center',
          opacity: punchlineProgress,
          transform: `scale(${punchlineProgress})`,
        }}
      >
        "...but they've ALL been from Texas."
      </span>
    </div>
  );
}

function BlazeNameOrigin({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const containerProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const logoProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 20, stiffness: 100, mass: 1 },
  });

  const textProgress = spring({
    frame: frame - 40,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 60,
        opacity: containerProgress,
      }}
    >
      {/* BSI Logo */}
      <div
        style={{
          opacity: logoProgress,
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.8, 1])})`,
        }}
      >
        <Img
          src={staticFile('images/bsi-logo.png')}
          style={{
            width: 140,
            height: 'auto',
          }}
        />
      </div>

      {/* Story */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 600,
          opacity: textProgress,
          transform: `translateX(${interpolate(textProgress, [0, 1], [30, 0])}px)`,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 18,
            fontWeight: 600,
            color: BSI_COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          The Name
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 28,
            fontWeight: 500,
            color: BSI_COLORS.white,
            lineHeight: 1.4,
          }}
        >
          Named after my dog{' '}
          <span style={{ color: BSI_COLORS.burntOrange, fontWeight: 700 }}>Blaze</span>
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 20,
            fontWeight: 400,
            color: BSI_COLORS.muted,
            lineHeight: 1.4,
          }}
        >
          Who we named for my first baseball team — the Bartlett Blaze
        </span>
      </div>
    </div>
  );
}
