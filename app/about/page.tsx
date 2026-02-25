'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

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

  const handleChapterChange = useCallback(
    (index: number) => {
      if (index === activeChapter || index < 0 || index >= chapters.length) return;

      setIsTransitioning(true);
      setTimeout(() => {
        setActiveChapter(index);
        setIsTransitioning(false);
        const chapterId = chapters[index].id;
        document.getElementById(chapterId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    },
    [activeChapter]
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

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
    <main className="min-h-screen bg-midnight text-white/95 pt-16 md:pt-20">
      {/* Hero */}
      <Section className="pt-32 pb-16 bg-gradient-to-b from-charcoal to-midnight">
        <Container>
          <ScrollReveal>
            <div className="grid md:grid-cols-2 gap-12 items-center">
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
                  <div className="absolute inset-0 rounded-lg border-2 border-burnt-orange transform translate-x-3 translate-y-3 -z-0" />
                </div>
              </div>

              <div className="text-center md:text-left">
                <Badge variant="primary" className="mb-4">
                  The Story Behind the Stats
                </Badge>
                <h1 className="font-display uppercase text-4xl md:text-5xl font-bold mb-6 tracking-wide">
                  Born on <span className="text-burnt-orange">Texas Soil</span>
                </h1>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  August 17, 1995 &mdash; the same day as Davy Crockett. Memphis hospital, but my dad put
                  Texas soil under that bed. Because that is what Humphreys do.
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Badge variant="secondary">UT Austin &apos;18</Badge>
                  <Badge variant="secondary">Full Sail MS</Badge>
                  <Badge variant="secondary">Top 10% NW Mutual</Badge>
                  <Badge variant="secondary">Perfect Game Pitched</Badge>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Chapter Navigation + Progress Bar */}
      <div className="sticky top-16 z-40 bg-charcoal/95 backdrop-blur-sm border-t border-white/10">
        <Container>
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex overflow-x-auto gap-2 no-scrollbar flex-1">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterChange(index)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeChapter === index
                      ? 'bg-burnt-orange text-white shadow-lg'
                      : 'bg-midnight/50 text-gray-400 hover:text-white hover:bg-midnight'
                  }`}
                >
                  {chapter.title}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2">
              {chapters.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleChapterChange(index)}
                  className={`rounded-full transition-all duration-200 ${
                    index === activeChapter
                      ? 'w-3 h-3 bg-burnt-orange scale-125'
                      : 'w-2 h-2 bg-gray-700'
                  }`}
                  aria-label={`Go to chapter ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </Container>

        <div className="h-0.5 bg-midnight relative">
          <div
            className="absolute left-0 top-0 h-full bg-burnt-orange transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Chapter I: The Soil */}
      <Section id="soil" className="py-20">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-sm tracking-widest text-gray-500 uppercase">Chapter I</span>
                <h2 className="font-display uppercase text-3xl md:text-4xl font-bold mt-2 tracking-wide text-texas-soil">
                  The Soil
                </h2>
                <p className="text-gray-400 mt-2">
                  West Columbia, Texas &mdash; Birthplace of the Republic
                </p>
              </div>

              <div className="prose prose-lg prose-invert max-w-none text-gray-300">
                <p className="text-xl leading-relaxed">
                  The soil came from West Columbia &mdash; birthplace of the Republic of Texas. My father
                  carried it across state lines in a small container, just like his father had done,
                  and his father before him.
                </p>
                <p className="leading-relaxed">
                  The doctor told my parents, &quot;You know you ain&apos;t the first to do this &mdash;
                  but they&apos;ve ALL been from Texas.&quot; The news made the local paper in El
                  Campo, my father&apos;s hometown. My grandfather Bill founded banks there after
                  growing up dirt poor in West Texas and meeting my grandmother Helen at
                  Hardin-Simmons following his service in WWII.
                </p>
                <p className="leading-relaxed">
                  That is where this starts. Not with statistics or algorithms. With soil and
                  stubborn people who believe heritage matters. That same commitment &mdash; soil-level
                  fidelity to what is real &mdash; is why every stat on this site is sourced, timestamped,
                  and cross-referenced before it ships.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Chapter II: The Legacy */}
      <Section id="legacy" className="py-20 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-sm tracking-widest text-gray-500 uppercase">Chapter II</span>
                <h2 className="font-display uppercase text-3xl md:text-4xl font-bold mt-2 tracking-wide text-burnt-orange">
                  The Legacy
                </h2>
                <p className="text-gray-400 mt-2">40+ Years of Longhorn Football</p>
              </div>

              <div className="prose prose-lg prose-invert max-w-none text-gray-300">
                <p className="text-xl leading-relaxed">
                  My family has held the same four season tickets to Texas Longhorn football for
                  over 40 years. Every Thanksgiving growing up, we drove from Memphis to Austin &mdash; 12
                  hours of highway, barbecue stops, and the same question every year: &quot;You
                  think we beat A&amp;M this time?&quot;
                </p>
                <p className="leading-relaxed">
                  I was at the Ricky Williams record-breaking game against A&amp;M. Section 15, row 34.
                  My dad pointed at the field and said, &quot;Remember this &mdash; you are watching
                  history.&quot;
                </p>
                <p className="leading-relaxed">
                  First time I played running back in 7th grade? 70 yards to the house on the first
                  play of the season. At Boerne Champion High School, I scored the first touchdown
                  against our biggest rival, Kerrville Tivy. Against Marble Falls &mdash; coach Todd
                  Dodge&apos;s team &mdash; I scored on the first play on a screen pass. That play made
                  ESPN.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Chapter III: The Fire */}
      <Section id="fire" className="py-20">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-sm tracking-widest text-gray-500 uppercase">Chapter III</span>
                <h2 className="font-display uppercase text-3xl md:text-4xl font-bold mt-2 tracking-wide text-ember">
                  The Fire
                </h2>
                <p className="text-gray-400 mt-2">
                  ESPN Treats College Baseball Like an Afterthought
                </p>
              </div>

              <div className="prose prose-lg prose-invert max-w-none text-gray-300">
                <p className="text-xl leading-relaxed">
                  Try finding a box score for a midweek game between Rice and Houston. Try tracking
                  your team&apos;s conference standings without clicking through 15 pages. Try
                  getting real analytics &mdash; not just scores and highlights curated for the same
                  ten programs every week.
                </p>
                <p className="leading-relaxed">
                  I got tired of waiting for someone else to fix it. I studied international
                  systems at UT Austin because I wanted to understand how power structures work
                  &mdash; who gets covered, who gets ignored, and why. I finished a master&apos;s
                  in entertainment business at Full Sail because the coverage gap is not just
                  editorial; it is a product problem. I made top 10% nationally at Northwestern
                  Mutual because I learned how to build something from nothing with no safety net.
                </p>
                <p className="leading-relaxed font-semibold text-white">
                  Every credential pointed the same direction: build the thing nobody else would.
                </p>
                <p className="leading-relaxed text-xl text-ember">
                  So I did.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* The payoff */}
          <ScrollReveal delay={200}>
            <div className="max-w-4xl mx-auto mt-12">
              <div className="glass-default p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-burnt-orange">300+</div>
                    <p className="text-gray-400 mt-1">D1 Baseball Programs</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-burnt-orange">30s</div>
                    <p className="text-gray-400 mt-1">Live Score Updates</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-burnt-orange">100%</div>
                    <p className="text-gray-400 mt-1">Box Score Coverage</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Chapter IV: The Name */}
      <Section id="name" className="py-20 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-sm tracking-widest text-gray-500 uppercase">Chapter IV</span>
                <h2 className="font-display uppercase text-3xl md:text-4xl font-bold mt-2 tracking-wide text-gold">
                  The Name
                </h2>
                <p className="text-gray-400 mt-2">A Dog Named Blaze</p>
              </div>

              <div className="prose prose-lg prose-invert max-w-none text-gray-300">
                <p className="text-xl leading-relaxed">
                  My first baseball team was the Bartlett Blaze. Years later, I got a dachshund and
                  named him after that team.
                </p>
                <p className="leading-relaxed">
                  When it came time to name the company, I pitched a perfect game once &mdash; 27 up, 27
                  down &mdash; but that was not the story. The story was always about blazing paths other
                  people were afraid to walk.
                </p>
                <p className="leading-relaxed text-xl font-semibold">
                  <span className="text-burnt-orange">Blaze Sports Intel</span> &mdash; named
                  after a dog, built for fans who got tired of waiting.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Chapter V: The Covenant */}
      <Section id="covenant" className="py-20">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-sm tracking-widest text-gray-500 uppercase">Chapter V</span>
                <h2 className="font-display uppercase text-3xl md:text-4xl font-bold mt-2 tracking-wide text-burnt-orange">
                  The Covenant
                </h2>
                <p className="text-gray-400 mt-2">What Texas Really Means</p>
              </div>

              <div className="prose prose-lg prose-invert max-w-none text-gray-300">
                <p className="text-xl leading-relaxed">
                  Texas is not just a place &mdash; it is a covenant. Treat people right. Never let anyone
                  stop dreaming beyond the horizon. Root for underdogs. Question institutions that
                  ignore what matters.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-white">Authenticity over polish.</strong> Grit over flash.
                  Substance over style. Family legacy matters &mdash; not as nostalgia, but as fuel.
                </p>
                <p className="leading-relaxed">
                  Every stat on this site is sourced, timestamped, and verified against at least one
                  cross-reference before it ships. If we cannot confirm it, it does not publish. That
                  is not a marketing line &mdash; it is the reason the data pipeline exists. We cover the
                  Tuesday night game between Rice and Sam Houston the same way we cover the Saturday
                  showcase between Tennessee and LSU. Every game matters to someone. The platform is
                  built for those someones &mdash; fans, coaches, scouts, and the players whose careers
                  happen outside the broadcast window.
                </p>
                <blockquote className="border-l-4 border-texas-soil pl-6 my-8 text-2xl italic font-serif text-white">
                  &quot;Born to blaze the path less beaten.&quot;
                </blockquote>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* One Operator */}
      <Section className="py-16 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <span className="text-sm tracking-widest text-gray-500 uppercase">The Builder</span>
              <h2 className="font-display uppercase text-2xl md:text-3xl font-bold mt-2 mb-4 tracking-wide">
                One <span className="text-burnt-orange">Operator</span>
              </h2>
              <p className="text-gray-400 mb-8">
                Fourteen deployed Workers. Five databases. Eighteen storage buckets. Six sports.
                One person who built every line, wrote every article, and answers every email at{' '}
                <a href="mailto:Austin@blazesportsintel.com" className="underline hover:text-white">
                  Austin@blazesportsintel.com
                </a>.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/Austin_Humphrey_Resume.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="lg">
                    View Resume
                  </Button>
                </a>
                <a href="/Austin_Humphrey_Resume.pdf" download>
                  <Button size="lg" className="bg-burnt-orange hover:bg-burnt-orange/90">
                    Download Resume
                  </Button>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="py-20 bg-gradient-to-b from-midnight to-charcoal">
        <Container>
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display uppercase text-3xl md:text-4xl font-bold mb-6 tracking-wide">
                Ready to See What <span className="text-burnt-orange">Real Coverage</span>{' '}
                Looks Like?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                14-day free trial. No credit card required. Cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" className="bg-burnt-orange hover:bg-burnt-orange/90">
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

      <Footer />

      {/* Scrollbar hiding for chapter nav */}
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
