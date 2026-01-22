import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { TexasCovenantQuote } from '@/components/cinematic/CovenantQuote';

export const metadata: Metadata = {
  title: 'About | Blaze Sports Intel',
  description:
    'Born in Memphis on Texas soil. The story behind Blaze Sports Intel and why college baseball deserves better coverage.',
  openGraph: {
    title: 'About Blaze Sports Intel',
    description: 'Born in Memphis on Texas soil. The story behind Blaze Sports Intel.',
    images: [{ url: '/images/texas-soil.webp' }],
  },
};

export default function AboutPage() {
  return (
    <>
      <main>
        {/* Hero */}
        <Section padding="lg" className="pt-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-texas-soil/20 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mx-auto text-center">
                <Badge variant="warning" className="mb-4">
                  The Origin Story
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display mb-6">
                  Born on <span className="text-gradient-blaze">Texas Soil</span>
                </h1>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Story */}
        <Section padding="lg" background="charcoal">
          <Container>
            <div className="max-w-3xl mx-auto">
              <ScrollReveal direction="up">
                <div className="prose prose-invert prose-lg max-w-none">
                  <p className="text-xl text-text-secondary leading-relaxed mb-8">
                    August 17, 1995. Memphis, Tennessee. The same day Davy Crockett was born 209
                    years earlier.
                  </p>

                  <p className="text-text-secondary leading-relaxed mb-8">
                    My father did what any self-respecting Texan would do when his son was about to
                    be born outside state lines—he packed a bag of West Columbia dirt and placed it
                    beneath my mother&apos;s hospital bed.
                  </p>

                  <p className="text-text-secondary leading-relaxed mb-8">
                    The doctor walked in, saw the arrangement, and shook his head with a grin.
                  </p>

                  <blockquote className="border-l-4 border-burnt-orange pl-6 my-8">
                    <p className="text-xl italic text-white font-playfair">
                      &quot;You know you ain&apos;t the first to do this—but they&apos;ve ALL been
                      from Texas.&quot;
                    </p>
                  </blockquote>

                  <p className="text-text-secondary leading-relaxed mb-8">
                    That dirt came from my grandfather&apos;s land near the Brazos River. The same
                    soil that grew cotton in the 1800s. The same soil that Austin Stephen F. Austin
                    walked when he was bringing settlers to Mexican Texas.
                  </p>

                  <p className="text-text-secondary leading-relaxed mb-8">
                    Texas isn&apos;t just a place. It&apos;s a covenant. And on that August day in
                    Memphis, I became part of it.
                  </p>
                </div>
              </ScrollReveal>

              {/* The Texas Covenant Quote - Only place this appears on the site */}
              <TexasCovenantQuote variant="featured" className="my-12" />

              {/* Texas Soil Image */}
              <ScrollReveal direction="up" delay={100}>
                <Card padding="none" className="overflow-hidden my-12">
                  <div className="relative aspect-video">
                    <Image
                      src="/images/texas-soil.webp"
                      alt="Texas soil from West Columbia"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="p-4 bg-charcoal">
                    <p className="text-sm text-text-tertiary text-center">
                      West Columbia, Texas — where it all started
                    </p>
                  </div>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* The Journey */}
        <Section padding="lg">
          <Container>
            <div className="max-w-3xl mx-auto">
              <ScrollReveal direction="up">
                <h2 className="font-display text-3xl font-bold uppercase tracking-display mb-8 text-center">
                  The <span className="text-gradient-blaze">Journey</span>
                </h2>
              </ScrollReveal>

              <div className="space-y-6">
                {[
                  {
                    year: '1995',
                    title: 'Born in Memphis on Texas Soil',
                    description: 'August 17—same day as Davy Crockett.',
                  },
                  {
                    year: '2000s',
                    title: 'Memphis to Austin, Every Thanksgiving',
                    description:
                      '40+ years of family tradition. The drive down I-40 to cheer on the Longhorns.',
                  },
                  {
                    year: '2013',
                    title: 'Pitched a Perfect Game',
                    description: 'Marble Falls High School. 27 up, 27 down.',
                  },
                  {
                    year: '2017',
                    title: 'University of Texas at Austin',
                    description:
                      'International Relations. Minors in European Studies, Political Science, Economics.',
                  },
                  {
                    year: '2020',
                    title: 'Full Sail University',
                    description: 'MS in Entertainment Business. Understanding the media machine.',
                  },
                  {
                    year: '2021',
                    title: 'Northwestern Mutual',
                    description:
                      'Top 10% nationally. Learned that data wins when stories fall short.',
                  },
                  {
                    year: '2024',
                    title: 'Blaze Sports Intel',
                    description:
                      'Got tired of waiting for ESPN to care about college baseball. Built it myself.',
                  },
                ].map((item, index) => (
                  <ScrollReveal key={item.year} direction="left" delay={index * 50}>
                    <Card padding="md" variant="hover" className="flex gap-6">
                      <div className="flex-shrink-0">
                        <span className="font-display text-2xl font-bold text-burnt-orange">
                          {item.year}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                        <p className="text-text-tertiary text-sm">{item.description}</p>
                      </div>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* The Mission */}
        <Section padding="lg" background="charcoal">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <ScrollReveal direction="up">
                <h2 className="font-display text-3xl font-bold uppercase tracking-display mb-6">
                  The <span className="text-gradient-blaze">Mission</span>
                </h2>

                <p className="text-xl text-text-secondary leading-relaxed mb-8">
                  College baseball is America&apos;s most underserved major sport. ESPN barely
                  covers it. The NCAA&apos;s own stats portal is a nightmare. Box scores disappear.
                  Historical data is scattered across a dozen sites.
                </p>

                <p className="text-text-secondary leading-relaxed mb-8">
                  Blaze Sports Intel exists because someone had to fix it. Complete box scores.
                  Real-time updates. Conference standings that actually work. Analytics that help
                  coaches, scouts, and fans make better decisions.
                </p>

                <p className="text-lg text-white font-semibold">
                  Born to blaze the path less beaten.
                </p>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Contact */}
        <Section padding="lg">
          <Container center>
            <ScrollReveal direction="up">
              <div className="max-w-xl mx-auto text-center">
                <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-4">
                  Get in Touch
                </h2>
                <p className="text-text-secondary mb-6">
                  Questions, partnerships, or just want to talk baseball? I read every email.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:ahump20@outlook.com"
                    className="btn-primary px-6 py-3 text-center"
                  >
                    ahump20@outlook.com
                  </a>
                  <Link href="/pricing" className="btn-secondary px-6 py-3 text-center">
                    View Pricing
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>
    </>
  );
}
