'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// Brand colors
const colors = {
  burntOrange: '#BF5700',
  texasSoil: '#8B4513',
  ember: '#FF6B35',
  charcoal: '#1A1A1A',
  midnight: '#0D0D0D',
  cream: '#FAF8F5',
  gold: '#C9A227',
};

const chapters = [
  { id: 'soil', title: 'The Soil', subtitle: 'West Columbia, 1995' },
  { id: 'legacy', title: 'The Legacy', subtitle: '40 Years of Longhorn Football' },
  { id: 'fire', title: 'The Fire', subtitle: 'ESPN Treats College Baseball Like an Afterthought' },
  { id: 'name', title: 'The Name', subtitle: 'A Dog Named Blaze' },
  { id: 'covenant', title: 'The Covenant', subtitle: 'What Texas Really Means' },
];

export default function AboutPage() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [_isTransitioning, setIsTransitioning] = useState(false);
  const _chapterRefs = useRef<(HTMLElement | null)[]>([]);

  // Smooth chapter transition with fade effect
  const handleChapterChange = useCallback(
    (index: number) => {
      if (index === activeChapter || index < 0 || index >= chapters.length) return;

      setIsTransitioning(true);
      setTimeout(() => {
        setActiveChapter(index);
        setIsTransitioning(false);
        // Scroll to the chapter
        const chapterId = chapters[index].id;
        document.getElementById(chapterId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    },
    [activeChapter]
  );

  // Track scroll position to update active chapter
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for sticky header

      chapters.forEach((chapter, index) => {
        const element = document.getElementById(chapter.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            if (activeChapter !== index) {
              setActiveChapter(index);
            }
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeChapter]);

  const progressPercentage = ((activeChapter + 1) / chapters.length) * 100;

  return (
    <main className="min-h-screen bg-midnight text-cream pt-16 md:pt-20">
      {/* Hero Section */}
      <Section className="pt-32 pb-16 bg-gradient-to-b from-charcoal to-midnight">
        <Container>
          <ScrollReveal>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Image with offset border */}
              <div className="relative mx-auto md:mx-0">
                <div className="relative w-64 md:w-80">
                  <Image
                    src="/images/headshot.jpg"
                    alt="Austin Humphrey - Founder of Blaze Sports Intel"
                    width={320}
                    height={427}
                    className="rounded-lg relative z-10"
                    priority
                  />
                  <div
                    className="absolute inset-0 rounded-lg border-2 transform translate-x-3 translate-y-3 -z-0"
                    style={{ borderColor: colors.burntOrange }}
                  />
                </div>
              </div>

              {/* Intro Content */}
              <div className="text-center md:text-left">
                <Badge variant="primary" className="mb-4">
                  The Story Behind the Stats
                </Badge>
                <h1
                  className="text-4xl md:text-5xl font-bold mb-6"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Born on <span style={{ color: colors.burntOrange }}>Texas Soil</span>
                </h1>
                <p
                  className="text-xl text-gray-300 mb-8 leading-relaxed"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  August 17, 1995 — the same day as Davy Crockett. Memphis hospital, but my dad put
                  Texas soil under that bed. Because that is what Humphreys do.
                </p>

                {/* Credential Badges */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Badge variant="secondary">UT Austin 18</Badge>
                  <Badge variant="secondary">Full Sail MS</Badge>
                  <Badge variant="secondary">Top 10% NW Mutual</Badge>
                  <Badge variant="secondary">Perfect Game Pitched</Badge>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Chapter Navigation with Progress Bar */}
      <div className="sticky top-16 z-40 bg-charcoal/95 backdrop-blur-sm border-t border-white/10">
        <Container>
          <div className="flex items-center justify-between py-3 gap-4">
            {/* Chapter Buttons */}
            <div className="flex overflow-x-auto gap-2 no-scrollbar flex-1">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterChange(index)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeChapter === index
                      ? 'text-white shadow-lg'
                      : 'bg-midnight/50 text-gray-400 hover:text-white hover:bg-midnight'
                  }`}
                  style={activeChapter === index ? { backgroundColor: colors.burntOrange } : {}}
                >
                  {chapter.title}
                </button>
              ))}
            </div>

            {/* Chapter Dots (visible on desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {chapters.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleChapterChange(index)}
                  className="w-2 h-2 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: index === activeChapter ? colors.burntOrange : '#374151',
                    transform: index === activeChapter ? 'scale(1.5)' : 'scale(1)',
                  }}
                  aria-label={`Go to chapter ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </Container>

        {/* Progress Bar */}
        <div className="h-0.5 bg-midnight relative">
          <div
            className="absolute left-0 top-0 h-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: colors.burntOrange,
            }}
          />
        </div>
      </div>

      {/* Chapter 1: The Soil */}
      <Section id="soil" className="py-20">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-sm tracking-widest text-gray-500 uppercase">Chapter I</span>
                <h2
                  className="text-3xl md:text-4xl font-bold mt-2"
                  style={{ fontFamily: 'Georgia, serif', color: colors.texasSoil }}
                >
                  The Soil
                </h2>
                <p className="text-gray-400 mt-2">
                  West Columbia, Texas — Birthplace of the Republic
                </p>
              </div>

              <div
                className="prose prose-lg prose-invert max-w-none text-gray-300"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <p className="text-xl leading-relaxed">
                  The soil came from West Columbia — birthplace of the Republic of Texas. My father
                  carried it across state lines in a small container, just like his father had done,
                  and his father before him.
                </p>
                <p className="leading-relaxed">
                  The doctor told my parents, &quot;You know you ain&apos;t the first to do this —
                  but they&apos;ve ALL been from Texas.&quot; The news made the local paper in El
                  Campo, my father&apos;s hometown. My grandfather Bill founded banks there after
                  growing up dirt poor in West Texas and meeting my grandmother Helen at
                  Hardin-Simmons following his service in WWII.
                </p>
                <p className="leading-relaxed">
                  That is where this starts. Not with statistics or algorithms. With soil and
                  stubborn people who believe heritage matters.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Business Tie-In: Data Quality */}
          <ScrollReveal delay={200}>
            <Card
              className="max-w-3xl mx-auto mt-12 border-l-4"
              style={{ borderLeftColor: colors.burntOrange }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${colors.burntOrange}20` }}
                  >
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      That Standard Applies to Our Data
                    </h3>
                    <p className="text-gray-400">
                      We cross-reference 3+ sources for every critical stat. Every data point is
                      timestamped with America/Chicago precision. No placeholders, no estimates —
                      real numbers or we do not ship it.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Chapter 2: The Legacy */}
      <Section id="legacy" className="py-20 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-sm tracking-widest text-gray-500 uppercase">Chapter II</span>
                <h2
                  className="text-3xl md:text-4xl font-bold mt-2"
                  style={{ fontFamily: 'Georgia, serif', color: colors.burntOrange }}
                >
                  The Legacy
                </h2>
                <p className="text-gray-400 mt-2">40+ Years of Longhorn Football</p>
              </div>

              <div
                className="prose prose-lg prose-invert max-w-none text-gray-300"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <p className="text-xl leading-relaxed">
                  My family has held the same four season tickets to Texas Longhorn football for
                  over 40 years. Every Thanksgiving growing up, we drove from Memphis to Austin — 12
                  hours of highway, barbecue stops, and the same question every year: &quot;You
                  think we beat A&M this time?&quot;
                </p>
                <p className="leading-relaxed">
                  I was at the Ricky Williams record-breaking game against A&M. Section 15, row 34.
                  My dad pointed at the field and said, &quot;Remember this — you are watching
                  history.&quot;
                </p>
                <p className="leading-relaxed">
                  First time I played running back in 7th grade? 70 yards to the house on the first
                  play of the season. At Boerne Champion High School, I scored the first touchdown
                  against our biggest rival, Kerrville Tivy. Against Marble Falls — coach Todd
                  Dodge&apos;s team — I scored on the first play on a screen pass. That play made
                  ESPN.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Business Tie-In: API Coverage */}
          <ScrollReveal delay={200}>
            <div className="max-w-4xl mx-auto mt-12">
              <h3 className="text-xl font-semibold text-white mb-6 text-center">
                API Coverage Across Major Leagues
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { sport: 'MLB', teams: '30 Teams', source: 'statsapi.mlb.com', icon: '⚾' },
                  { sport: 'NFL', teams: '32 Teams', source: 'ESPN API', icon: '🏈' },
                  { sport: 'NCAA Baseball', teams: '300+ D1', source: 'D1Baseball', icon: '🎓' },
                  { sport: 'NCAA Football', teams: '134 FBS', source: 'Coming Soon', icon: '🏟️' },
                ].map((item) => (
                  <Card key={item.sport} className="text-center">
                    <CardContent className="p-4">
                      <span className="text-3xl mb-2 block">{item.icon}</span>
                      <h4 className="font-semibold text-white">{item.sport}</h4>
                      <p className="text-sm text-gray-400">{item.teams}</p>
                      <p className="text-xs mt-2" style={{ color: colors.ember }}>
                        {item.source}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Chapter 3: The Fire */}
      <Section id="fire" className="py-20">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-sm tracking-widest text-gray-500 uppercase">Chapter III</span>
                <h2
                  className="text-3xl md:text-4xl font-bold mt-2"
                  style={{ fontFamily: 'Georgia, serif', color: colors.ember }}
                >
                  The Fire
                </h2>
                <p className="text-gray-400 mt-2">
                  ESPN Treats College Baseball Like an Afterthought
                </p>
              </div>

              <div
                className="prose prose-lg prose-invert max-w-none text-gray-300"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <p className="text-xl leading-relaxed">
                  UT Austin grad — International Relations with minors in European Studies,
                  Political Science, and Economics. Full Sail gave me an MS in Entertainment
                  Business. I made top 10% nationally at Northwestern Mutual before I got tired of
                  waiting.
                </p>
                <p className="leading-relaxed font-semibold text-white">
                  Waiting for someone else to fix sports coverage.
                </p>
                <p className="leading-relaxed">
                  ESPN treats college baseball like an afterthought. Try finding a box score for a
                  midweek game between Rice and Houston. Try tracking your team&apos;s conference
                  standings without clicking through 15 pages. Try getting real analytics instead of
                  just scores.
                </p>
                <p className="leading-relaxed text-xl" style={{ color: colors.ember }}>
                  Fans deserve better. So I built it myself.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Business Tie-In: What We Built */}
          <ScrollReveal delay={200}>
            <div className="max-w-4xl mx-auto mt-12">
              <Card className="overflow-hidden">
                <div
                  className="p-6"
                  style={{
                    background: `linear-gradient(135deg, ${colors.charcoal} 0%, ${colors.midnight} 100%)`,
                  }}
                >
                  <h3 className="text-2xl font-bold text-white mb-6">What We Built</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold" style={{ color: colors.burntOrange }}>
                        300+
                      </div>
                      <p className="text-gray-400 mt-1">D1 Baseball Programs</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold" style={{ color: colors.burntOrange }}>
                        30s
                      </div>
                      <p className="text-gray-400 mt-1">Live Score Updates</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold" style={{ color: colors.burntOrange }}>
                        100%
                      </div>
                      <p className="text-gray-400 mt-1">Box Score Coverage</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Chapter 4: The Name */}
      <Section id="name" className="py-20 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-sm tracking-widest text-gray-500 uppercase">Chapter IV</span>
                <h2
                  className="text-3xl md:text-4xl font-bold mt-2"
                  style={{ fontFamily: 'Georgia, serif', color: colors.gold }}
                >
                  The Name
                </h2>
                <p className="text-gray-400 mt-2">A Dog Named Blaze</p>
              </div>

              <div
                className="prose prose-lg prose-invert max-w-none text-gray-300"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <p className="text-xl leading-relaxed">
                  My first baseball team was the Bartlett Blaze. Years later, I got a dachshund and
                  named him after that team.
                </p>
                <p className="leading-relaxed">
                  When it came time to name the company, I pitched a perfect game once — 27 up, 27
                  down — but that was not the story. The story was always about blazing paths other
                  people were afraid to walk.
                </p>
                <p className="leading-relaxed text-xl font-semibold">
                  <span style={{ color: colors.burntOrange }}>Blaze Sports Intel</span> — named
                  after a dog, built for fans who got tired of waiting.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Business Tie-In: For Scouts & Coaches */}
          <ScrollReveal delay={200}>
            <div className="max-w-4xl mx-auto mt-12">
              <div className="grid md:grid-cols-2 gap-6">
                <Link href="/for-scouts">
                  <Card className="h-full hover:border-burnt-orange transition-colors cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">🔍</span>
                        <h3 className="text-xl font-semibold text-white group-hover:text-burnt-orange transition-colors">
                          For Scouts
                        </h3>
                      </div>
                      <p className="text-gray-400 mb-4">
                        Enterprise API access, historical data exports, and the tracking tools
                        professional scouts need.
                      </p>
                      <span style={{ color: colors.ember }} className="text-sm font-medium">
                        Learn More →
                      </span>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/for-coaches">
                  <Card className="h-full hover:border-burnt-orange transition-colors cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">📋</span>
                        <h3 className="text-xl font-semibold text-white group-hover:text-burnt-orange transition-colors">
                          For Coaches
                        </h3>
                      </div>
                      <p className="text-gray-400 mb-4">
                        Team dashboards, scheduling optimization, and recruiting intel for college
                        programs.
                      </p>
                      <span style={{ color: colors.ember }} className="text-sm font-medium">
                        Learn More →
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Chapter 5: The Covenant */}
      <Section id="covenant" className="py-20">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-sm tracking-widest text-gray-500 uppercase">Chapter V</span>
                <h2
                  className="text-3xl md:text-4xl font-bold mt-2"
                  style={{ fontFamily: 'Georgia, serif', color: colors.burntOrange }}
                >
                  The Covenant
                </h2>
                <p className="text-gray-400 mt-2">What Texas Really Means</p>
              </div>

              <div
                className="prose prose-lg prose-invert max-w-none text-gray-300"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <p className="text-xl leading-relaxed">
                  Texas is not just a place — it is a covenant. Treat people right. Never let anyone
                  stop dreaming beyond the horizon. Root for underdogs. Question institutions that
                  ignore what matters.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-white">Authenticity over polish.</strong> Grit over flash.
                  Substance over style. Family legacy matters — not as nostalgia, but as fuel.
                </p>
                <blockquote
                  className="border-l-4 pl-6 my-8 text-2xl italic"
                  style={{ borderLeftColor: colors.texasSoil, color: colors.cream }}
                >
                  &quot;Born to blaze the path less beaten.&quot;
                </blockquote>
              </div>
            </div>
          </ScrollReveal>

          {/* Business Tie-In: Our Commitment */}
          <ScrollReveal delay={200}>
            <div className="max-w-4xl mx-auto mt-12">
              <Card>
                <CardHeader>
                  <CardTitle>Our Commitment to You</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <span className="text-green-500">✓</span>
                      <div>
                        <h4 className="font-semibold text-white">Real Data, Always</h4>
                        <p className="text-sm text-gray-400">
                          No placeholders, no estimates. If we cannot verify it, we do not publish
                          it.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-500">✓</span>
                      <div>
                        <h4 className="font-semibold text-white">Source Transparency</h4>
                        <p className="text-sm text-gray-400">
                          Every stat is cited with timestamp. You know exactly where it came from.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-500">✓</span>
                      <div>
                        <h4 className="font-semibold text-white">Fan-First Coverage</h4>
                        <p className="text-sm text-gray-400">
                          We cover the games ESPN ignores. Every game matters to someone.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-500">✓</span>
                      <div>
                        <h4 className="font-semibold text-white">Enterprise-Grade API</h4>
                        <p className="text-sm text-gray-400">
                          Professional tools for scouts, coaches, and media organizations.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>

          {/* Chapter Navigation Controls */}
          <ScrollReveal delay={300}>
            <div className="max-w-3xl mx-auto mt-16 pt-8 border-t border-white/10">
              <div className="flex items-center justify-between">
                {/* Previous Button */}
                <button
                  onClick={() => handleChapterChange(activeChapter - 1)}
                  disabled={activeChapter === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeChapter === 0
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white border border-white/20 hover:border-white/40'
                  }`}
                  style={activeChapter > 0 ? { borderColor: colors.texasSoil } : {}}
                >
                  <span>←</span>
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Chapter Indicator */}
                <div className="flex items-center gap-3">
                  {chapters.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleChapterChange(index)}
                      className="w-3 h-3 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: index === activeChapter ? colors.burntOrange : '#374151',
                        transform: index === activeChapter ? 'scale(1.3)' : 'scale(1)',
                        boxShadow:
                          index === activeChapter ? `0 0 12px ${colors.burntOrange}60` : 'none',
                      }}
                      aria-label={`Go to chapter ${index + 1}: ${chapters[index].title}`}
                    />
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handleChapterChange(activeChapter + 1)}
                  disabled={activeChapter === chapters.length - 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeChapter === chapters.length - 1
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-white'
                  }`}
                  style={
                    activeChapter < chapters.length - 1
                      ? { backgroundColor: colors.burntOrange }
                      : {}
                  }
                >
                  <span className="hidden sm:inline">Next</span>
                  <span>→</span>
                </button>
              </div>

              {/* Chapter Title Preview */}
              <p className="text-center text-sm text-gray-500 mt-4">
                {activeChapter < chapters.length - 1 ? (
                  <>
                    Next:{' '}
                    <span style={{ color: colors.texasSoil }}>
                      {chapters[activeChapter + 1].title}
                    </span>
                  </>
                ) : (
                  <span style={{ color: colors.gold }}>You&apos;ve completed the origin story</span>
                )}
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section className="py-20 bg-gradient-to-b from-charcoal to-midnight">
        <Container>
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <h2
                className="text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Ready to See What <span style={{ color: colors.burntOrange }}>Real Coverage</span>{' '}
                Looks Like?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                14-day free trial. No credit card required. Cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" style={{ backgroundColor: colors.burntOrange }}>
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="mailto:Austin@blazesportsintel.com">
                  <Button variant="outline" size="lg">
                    Contact Sales
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Questions? Email{' '}
                <a href="mailto:Austin@blazesportsintel.com" className="underline hover:text-white">
                  Austin@blazesportsintel.com
                </a>
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* See BSI In Action — Video Showcase */}
      <Section className="py-20 bg-charcoal">
        <Container>
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display text-white text-center mb-4 uppercase tracking-wide">
              See BSI In Action
            </h2>
            <p className="text-white/50 text-center mb-12 max-w-2xl mx-auto">
              Real-time analytics across every game that matters.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Primary 16:9 video */}
              <div className="md:col-span-2">
                <div className="glass-default overflow-hidden aspect-video">
                  <iframe
                    src="https://customer-mpdvoybjqct2pzls.cloudflarestream.com/138facaf760c65e9b4efab3715ae6f50/iframe?poster=https%3A%2F%2Fcustomer-mpdvoybjqct2pzls.cloudflarestream.com%2F138facaf760c65e9b4efab3715ae6f50%2Fthumbnails%2Fthumbnail.jpg%3Fheight%3D600"
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    title="Blaze Sports Intel promotional video"
                  />
                </div>
              </div>
              {/* Square variant */}
              <div>
                <div className="glass-default overflow-hidden aspect-square">
                  <iframe
                    src="https://customer-mpdvoybjqct2pzls.cloudflarestream.com/138facaf760c65e9b4efab3715ae6f50/iframe?poster=https%3A%2F%2Fcustomer-mpdvoybjqct2pzls.cloudflarestream.com%2F138facaf760c65e9b4efab3715ae6f50%2Fthumbnails%2Fthumbnail.jpg%3Fheight%3D600"
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    title="Blaze Sports Intel promo (square)"
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Footer />

      {/* Custom scrollbar hiding */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
