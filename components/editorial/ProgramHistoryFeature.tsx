'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { ProgramHistoryData } from './types';

function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="aspect-video w-full rounded-sm overflow-hidden border border-[var(--border-vintage)] my-8">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        loading="lazy"
        className="w-full h-full border-0"
      />
    </div>
  );
}

function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    const w = window as unknown as { instgrm?: { Embeds: { process: () => void } } };
    if (w.instgrm) {
      w.instgrm.Embeds.process();
      return;
    }
    if (document.querySelector('script[src="https://www.instagram.com/embed.js"]')) return;
    const s = document.createElement('script');
    s.src = 'https://www.instagram.com/embed.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div className="my-8 flex justify-center">
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ maxWidth: 540, width: '100%' }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          View this post on Instagram
        </a>
      </blockquote>
    </div>
  );
}

function PullQuote({ text }: { text: string }) {
  return (
    <blockquote className="border-l-4 border-[var(--bsi-primary)] pl-6 my-8 max-w-2xl">
      <p className="font-serif text-xl md:text-2xl italic text-[var(--bsi-dust)] leading-relaxed">
        &ldquo;{text}&rdquo;
      </p>
    </blockquote>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto font-serif text-[var(--bsi-dust)] text-base md:text-lg leading-relaxed space-y-5">
      {children}
    </div>
  );
}

function EraImage({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="my-8 rounded-sm overflow-hidden border border-[var(--border-vintage)]">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full max-h-[500px] object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <figcaption className="text-xs text-[rgba(196,184,165,0.35)] px-4 py-2 bg-[var(--surface-press-box)]">
        {alt}
      </figcaption>
    </figure>
  );
}

export function ProgramHistoryFeature({ data }: { data: ProgramHistoryData }) {
  const [activeChampionship, setActiveChampionship] = useState<number | null>(null);

  return (
    <>
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          img[style*="kenBurns"] { animation: none !important; }
        }
      `}</style>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                College Baseball
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href="/college-baseball/editorial" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                Editorial
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-bone)]">{data.programName} Baseball History</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="grain-overlay absolute inset-0 pointer-events-none opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-ember/10 via-transparent to-burnt-orange/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-4xl">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">{data.badgeText}</Badge>
                  <span className="text-[rgba(196,184,165,0.35)] text-sm">{data.date}</span>
                  <span className="text-[rgba(196,184,165,0.35)] text-sm">{data.readTime}</span>
                </div>
                <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-bold uppercase tracking-wide leading-[1.05] mb-6">
                  {data.programName}:{' '}
                  <span className="text-[var(--bsi-primary)]">{data.heroTitle}</span>
                </h1>
                <p className="text-[var(--bsi-dust)] text-lg md:text-xl leading-relaxed mb-4">
                  {data.heroSubtitle}
                </p>
                <div className="flex items-center gap-4 text-sm text-[rgba(196,184,165,0.35)]">
                  <span>By Austin Humphrey</span>
                  <span>|</span>
                  <span>Blaze Sports Intel</span>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Hero Image — Ken Burns zoom */}
        {data.heroImage && (
          <Section padding="md">
            <Container>
              <ScrollReveal direction="up">
                <figure className="my-8 rounded-sm overflow-hidden border border-[var(--border-vintage)] relative">
                  <div className="relative overflow-hidden max-h-[500px]">
                    <img
                      src={data.heroImage}
                      alt={data.heroImageAlt || data.programName}
                      loading="lazy"
                      className="w-full max-h-[500px] object-cover"
                      style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                  </div>
                  <figcaption className="text-xs text-[rgba(196,184,165,0.35)] px-4 py-2 bg-[var(--surface-press-box)]">
                    {data.heroImageCaption || data.heroImageAlt || data.programName}
                  </figcaption>
                </figure>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Opening Narrative */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <Prose>
                {data.openingNarrative.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Prose>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Featured Video */}
        {data.featuredVideoId && (
          <Section padding="md">
            <Container size="md">
              <ScrollReveal direction="up">
                <YouTubeEmbed id={data.featuredVideoId} title={data.featuredVideoTitle || ''} />
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Coaching Eras Timeline */}
        {data.coachingEras.map((era, idx) => (
          <Section
            key={era.name}
            padding="lg"
            background={idx % 2 === 0 ? 'charcoal' : 'default'}
            borderTop
          >
            <Container>
              <ScrollReveal direction="up">
                <div className="flex items-center gap-4 mb-6">
                  <span className="heritage-stamp text-sm">{era.years}</span>
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
                    {era.name}
                  </h2>
                </div>
              </ScrollReveal>

              <div className="grid lg:grid-cols-[280px_1fr] gap-8">
                {/* Era stats sidebar */}
                <ScrollReveal direction="left" delay={100}>
                  <Card variant="default" padding="lg" className="border-t-2 border-[var(--bsi-primary)]">
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-[rgba(196,184,165,0.35)]">Record</div>
                        <div className="font-mono text-lg text-[var(--bsi-primary)] mt-1">{era.record}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-[rgba(196,184,165,0.35)]">National Titles</div>
                        <div className="font-mono text-lg text-[var(--bsi-bone)] mt-1">{era.titles}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-[rgba(196,184,165,0.35)]">CWS Appearances</div>
                        <div className="font-mono text-lg text-[var(--bsi-bone)] mt-1">{era.cwsAppearances}</div>
                      </div>
                      <div className="pt-3 border-t border-[var(--border-vintage)]">
                        <div className="text-xs uppercase tracking-wide text-[rgba(196,184,165,0.35)] mb-2">Key Players</div>
                        <div className="flex flex-wrap gap-1.5">
                          {era.keyPlayers.map((p) => (
                            <Badge key={p} variant="secondary" size="sm">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>

                {/* Era narrative */}
                <ScrollReveal direction="up" delay={150}>
                  <div className="font-serif text-[var(--bsi-dust)] text-base md:text-lg leading-relaxed space-y-5">
                    {era.narrative.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    {era.pullQuote && <PullQuote text={era.pullQuote} />}
                    {era.image && <EraImage src={era.image} alt={era.imageAlt || `${era.name} era`} />}
                  </div>
                </ScrollReveal>
              </div>
            </Container>
          </Section>
        ))}

        {/* Championships Section */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-[var(--bsi-bone)]">
                Six National Championships
              </h2>
              <p className="text-[rgba(196,184,165,0.35)] mb-8">From Omaha to the record books</p>
            </ScrollReveal>

            {/* Horizontal Championship Timeline */}
            <ScrollReveal direction="up">
              <div className="mb-10">
                <div className="relative flex items-center gap-8 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide px-2">
                  {/* Connecting line */}
                  <div className="absolute top-6 left-0 right-0 h-px bg-border-subtle pointer-events-none" />
                  {data.championships.map((c) => (
                    <button
                      key={c.year}
                      onClick={() => setActiveChampionship(c.year === activeChampionship ? null : c.year)}
                      className="snap-center flex-shrink-0 flex flex-col items-center gap-2 group relative z-10"
                      aria-label={`${c.year} Championship${c.year === activeChampionship ? ' — selected' : ''}`}
                    >
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold transition-colors ${
                        c.year === activeChampionship
                          ? 'border-[var(--bsi-primary)] bg-[var(--bsi-primary)] text-white'
                          : 'border-[var(--border-vintage)] bg-[var(--surface-dugout)] text-[rgba(196,184,165,0.35)] group-hover:border-[var(--bsi-primary)]'
                      }`}>
                        {String(c.year).slice(-2)}
                      </div>
                      <span className="text-[10px] text-[rgba(196,184,165,0.35)]">{c.year}</span>
                    </button>
                  ))}
                </div>
                {activeChampionship && (() => {
                  const champ = data.championships.find((c) => c.year === activeChampionship);
                  if (!champ) return null;
                  return (
                    <div className="mt-4 rounded-sm bg-[var(--surface-dugout)] border border-[var(--border-vintage)] p-4 animate-in fade-in">
                      <div className="flex items-start gap-3 mb-2">
                        <span className="font-display text-2xl font-bold text-[var(--bsi-primary)]">{champ.year}</span>
                        <Badge variant="primary" size="sm">Champion</Badge>
                      </div>
                      <div className="font-mono text-sm text-[var(--bsi-bone)] mb-1">{champ.record}</div>
                      <div className="text-xs text-[rgba(196,184,165,0.35)] mb-2">
                        vs {champ.titleGameOpponent} &middot; {champ.titleGameScore} &middot; MOP: {champ.mop}
                      </div>
                      <p className="text-[var(--bsi-dust)] text-sm leading-relaxed">{champ.narrative}</p>
                    </div>
                  );
                })()}
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.championships.map((c) => (
                <ScrollReveal key={c.year} direction="up">
                  <Card variant="default" padding="lg" className="overflow-hidden">
                    {c.image && (
                      <img
                        src={c.image}
                        alt={c.imageAlt || `${c.year} championship`}
                        loading="lazy"
                        className="w-full max-h-[200px] object-cover rounded-t-sm -mx-6 -mt-6 mb-4"
                        style={{ width: 'calc(100% + 3rem)' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-display text-3xl font-bold text-[var(--bsi-primary)]">{c.year}</h3>
                      <Badge variant="primary" size="sm">Champion</Badge>
                    </div>
                    <div className="font-mono text-sm text-[var(--bsi-bone)] mb-1">{c.record}</div>
                    <div className="text-xs text-[rgba(196,184,165,0.35)] mb-3">
                      vs {c.titleGameOpponent} &middot; {c.titleGameScore}
                    </div>
                    <div className="text-xs text-[var(--bsi-primary)] mb-3">MOP: {c.mop}</div>
                    <p className="text-[var(--bsi-dust)] text-sm leading-relaxed">{c.narrative}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* By the Numbers */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)] text-center">
                By the Numbers
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.programRecords.map((stat) => (
                <ScrollReveal key={stat.label} direction="up">
                  <Card variant="default" padding="md" className="text-center">
                    <div className="font-mono text-2xl md:text-3xl font-bold text-[var(--bsi-primary)]">{stat.value}</div>
                    <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1 uppercase tracking-wide">{stat.label}</div>
                    {stat.context && <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">{stat.context}</div>}
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Iconic Players */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-[var(--bsi-bone)]">
                The Pantheon
              </h2>
              <p className="text-[rgba(196,184,165,0.35)] mb-8">Retired numbers and defining players</p>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.iconicPlayers.map((player) => (
                <ScrollReveal key={player.name} direction="up">
                  <Card variant="default" padding="md" className="overflow-hidden">
                    {player.image && (
                      <img
                        src={player.image}
                        alt={player.name}
                        loading="lazy"
                        className="w-full max-h-[160px] object-cover rounded-t-sm -mx-4 -mt-4 mb-3"
                        style={{ width: 'calc(100% + 2rem)' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-display font-bold text-[var(--bsi-bone)] uppercase">
                          {player.name}
                        </h3>
                        <span className="text-xs text-[rgba(196,184,165,0.35)]">{player.position} &middot; {player.years}</span>
                      </div>
                      {player.number && (
                        <span className="font-mono text-2xl font-bold text-[var(--bsi-primary)]">#{player.number}</span>
                      )}
                    </div>
                    <p className="text-[var(--bsi-primary)] text-sm font-semibold mb-2">{player.headline}</p>
                    <div className="font-mono text-xs text-[rgba(196,184,165,0.35)] mb-2">{player.stats}</div>
                    {player.retired && (
                      <Badge variant="primary" size="sm">Jersey Retired</Badge>
                    )}
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Stadium */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                The Cathedral
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <Prose>
                {data.stadiumNarrative.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Prose>
              {data.stadiumImages && data.stadiumImages.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4 mt-8">
                  {data.stadiumImages.map((img, i) => (
                    <EraImage key={i} src={img.src} alt={img.alt} />
                  ))}
                </div>
              )}
            </ScrollReveal>
          </Container>
        </Section>

        {/* Culture */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="corner-marks p-6 md:p-10">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                  The Culture
                </h2>
                <Prose>
                  {data.cultureNarrative.split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </Prose>
                {(data.cultureImage || data.brandEvolutionImage) && (
                  <div className={`mt-8 ${data.cultureImage && data.brandEvolutionImage ? 'grid sm:grid-cols-2 gap-4' : ''}`}>
                    {data.cultureImage && (
                      <EraImage src={data.cultureImage} alt={data.cultureImageAlt || 'Program culture'} />
                    )}
                    {data.brandEvolutionImage && (
                      <EraImage src={data.brandEvolutionImage} alt={data.brandEvolutionImageAlt || 'Brand evolution'} />
                    )}
                  </div>
                )}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Media Embeds */}
        {data.mediaEmbeds && data.mediaEmbeds.length > 0 && (
          <Section padding="lg" borderTop>
            <Container size="md">
              <ScrollReveal direction="up">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                  Archive
                </h2>
              </ScrollReveal>
              {data.mediaEmbeds.map((embed, i) => (
                <ScrollReveal key={i} direction="up" delay={i * 100}>
                  {embed.type === 'youtube' && embed.id && (
                    <div>
                      <p className="text-[rgba(196,184,165,0.35)] text-sm mb-2">{embed.title}</p>
                      <YouTubeEmbed id={embed.id} title={embed.title} />
                    </div>
                  )}
                  {embed.type === 'instagram' && (
                    <div>
                      <p className="text-[rgba(196,184,165,0.35)] text-sm mb-2">{embed.title}</p>
                      <InstagramEmbed url={embed.url} />
                    </div>
                  )}
                  {embed.type === 'link' && (
                    <Card variant="default" padding="md" className="mb-4">
                      <a
                        href={embed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors text-sm"
                      >
                        {embed.title} &rarr;
                      </a>
                      <p className="text-[rgba(196,184,165,0.35)] text-xs mt-1">{embed.placement}</p>
                    </Card>
                  )}
                </ScrollReveal>
              ))}
            </Container>
          </Section>
        )}

        {/* Closing Narrative */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <ScrollReveal direction="up">
              <Prose>
                {data.closingNarrative.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Prose>
              {data.closingImage && (
                <div className="mt-8 max-w-sm mx-auto">
                  <EraImage src={data.closingImage} alt={data.closingImageAlt || ''} />
                </div>
              )}
            </ScrollReveal>
          </Container>
        </Section>

        {/* Related Links */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-[rgba(196,184,165,0.35)]">
                Written by Austin Humphrey &middot; Blaze Sports Intel
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/college-baseball/editorial" className="text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors">
                  More Editorial &rarr;
                </Link>
                {data.relatedLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-sm text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] transition-colors">
                    {link.label} &rarr;
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
