import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { TexasCovenantQuote } from '@/components/cinematic/CovenantQuote';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'About | Blaze Sports Intel',
  description:
    'Born in Memphis on Texas soil. The story behind Blaze Sports Intel—professional sports intelligence for MLB, NFL, and NCAA, named after my dog Blaze.',
  openGraph: {
    title: 'About Blaze Sports Intel',
    description:
      'Born in Memphis on Texas soil. Professional sports intelligence that serves the game.',
    images: [{ url: '/images/texas-soil.webp' }],
  },
};

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
];

export default function AboutPage() {
  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
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

        {/* The Birth Story */}
        <Section padding="lg" background="charcoal">
          <Container>
            <div className="max-w-3xl mx-auto">
              <ScrollReveal direction="up">
                <div className="prose prose-invert prose-lg max-w-none">
                  <p className="text-xl text-text-secondary leading-relaxed mb-8">
                    August 17, 1995. Memphis, Tennessee. The same day Davy Crockett was born 209
                    years earlier—same day as the legendary Tennessee senator and folk hero who died
                    defending the Alamo in the fight for Texas independence.
                  </p>

                  <p className="text-text-secondary leading-relaxed mb-8">
                    My father did what any self-respecting Texan would do when his son was about to
                    be born outside state lines—he packed a bag of West Columbia dirt and placed it
                    beneath my mother&apos;s hospital bed. That soil came from the birthplace of the
                    Republic of Texas, where Stephen F. Austin walked when he was bringing settlers
                    to Mexican Texas.
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
                    News of my birth made the local paper back in El Campo—my father&apos;s hometown,
                    where my grandad Bill founded banks after growing up dirt poor in West Texas and
                    meeting my grandma Helen at Hardin-Simmons following his service in WWII.
                  </p>

                  <p className="text-text-secondary leading-relaxed mb-8">
                    Yes, I still have the Texas soil and the newspaper article to this day.
                  </p>
                </div>
              </ScrollReveal>

              {/* Texas Soil Image */}
              <ScrollReveal direction="up" delay={100}>
                <Card padding="none" className="overflow-hidden my-12">
                  <div className="relative aspect-video">
                    <Image
                      src="/images/texas-soil.webp"
                      alt="Texas soil from West Columbia—the birthplace of the Republic of Texas"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="p-4 bg-charcoal">
                    <p className="text-sm text-text-tertiary text-center">
                      West Columbia, Texas — birthplace of the Republic of Texas
                    </p>
                  </div>
                </Card>
              </ScrollReveal>

              {/* The Texas Covenant Quote */}
              <TexasCovenantQuote variant="featured" className="my-12" />
            </div>
          </Container>
        </Section>

        {/* What Texas Means */}
        <Section padding="lg">
          <Container>
            <div className="max-w-3xl mx-auto">
              <ScrollReveal direction="up">
                <h2 className="font-display text-3xl font-bold uppercase tracking-display mb-8 text-center">
                  A <span className="text-gradient-blaze">Covenant</span>
                </h2>

                <div className="prose prose-invert prose-lg max-w-none">
                  <blockquote className="border-l-4 border-texas-soil pl-6 my-8 text-text-secondary italic">
                    <p className="mb-4">
                      &quot;I have said that Texas is a state of mind, but I think it is more than
                      that. It is a mystique closely approximating a religion. And this is true to
                      the extent that people either passionately love Texas or passionately hate it
                      and, as in other religions, few people dare to inspect it for fear of losing
                      their bearings in mystery or paradox.&quot;
                    </p>
                    <footer className="text-burnt-orange not-italic">— John Steinbeck</footer>
                  </blockquote>

                  <p className="text-text-secondary leading-relaxed mb-8">
                    For myself, personally, I think Texas is how you choose to treat the best and
                    worst of us. A covenant with oneself and the company he keeps to ever allow each
                    other to never stop dreaming beyond the horizon, regardless of race, ethnicity,
                    religion, or even birth soil. A home, a family, a philosophy.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* The Longhorn Tradition */}
        <Section padding="lg" background="charcoal">
          <Container>
            <div className="max-w-3xl mx-auto">
              <ScrollReveal direction="up">
                <h2 className="font-display text-3xl font-bold uppercase tracking-display mb-8 text-center">
                  Memphis to Austin, <span className="text-gradient-blaze">Every Thanksgiving</span>
                </h2>

                <div className="prose prose-invert prose-lg max-w-none">
                  <p className="text-text-secondary leading-relaxed mb-8">
                    My family has held the same four season tickets to Longhorn football games for
                    longer than my lifespan—40 to 50 years. Every Thanksgiving, we&apos;d make the
                    drive from Memphis to Austin to cheer on the Horns and spend the holiday with
                    my grandad Bill and grandma Helen.
                  </p>

                  <p className="text-text-secondary leading-relaxed mb-8">
                    One game that stands out: I was just a kid when Ricky Williams broke the NCAA
                    rushing record against A&M. I was there. That moment—feeling 85,000 people erupt
                    when a single player did something no one had ever done before—that&apos;s when
                    I understood what sports could mean.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={100}>
                <Card padding="none" className="overflow-hidden my-8">
                  <div className="relative aspect-video">
                    <Image
                      src="/images/longhorns-kid.webp"
                      alt="Young Austin at the Ricky Williams record-breaking game against A&M"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 bg-charcoal">
                    <p className="text-sm text-text-tertiary text-center">
                      Me at the Ricky Williams record-breaking game — Hook &apos;em til I die
                    </p>
                  </div>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Playing the Game */}
        <Section padding="lg">
          <Container>
            <div className="max-w-3xl mx-auto">
              <ScrollReveal direction="up">
                <h2 className="font-display text-3xl font-bold uppercase tracking-display mb-8 text-center">
                  Playing the <span className="text-gradient-blaze">Game</span>
                </h2>

                <div className="prose prose-invert prose-lg max-w-none">
                  <h3 className="text-xl font-semibold text-white mb-4">70 Yards to the House</h3>
                  <p className="text-text-secondary leading-relaxed mb-8">
                    My first ever time touching the ball at running back came in 7th grade. First play
                    of the season. I took it 70 yards to the house. That moment taught me something:
                    when you get your shot, you make it count.
                  </p>

                  <h3 className="text-xl font-semibold text-white mb-4">Friday Night Lights at Boerne Champion</h3>
                  <p className="text-text-secondary leading-relaxed mb-8">
                    At Boerne Champion, I scored the first touchdown of a home game against our big
                    rival, Kerrville Tivy, tying up the score. There&apos;s nothing like running into
                    the end zone with your hometown crowd behind you against a team you&apos;ve been
                    wanting to beat since middle school.
                  </p>

                  <h3 className="text-xl font-semibold text-white mb-4">The Marble Falls Game</h3>
                  <p className="text-text-secondary leading-relaxed mb-8">
                    Then came the game that put me on ESPN. We played Marble Falls and the legendary
                    coach Todd Dodge. Their quarterback set a state record that night. It was an
                    insane shootout. I scored on the first play via screen pass. By luck, that play
                    landed me a highlight on ESPN. Sometimes the universe just lines up.
                  </p>

                  <h3 className="text-xl font-semibold text-white mb-4">Baseball: The Perfect Game</h3>
                  <p className="text-text-secondary leading-relaxed mb-8">
                    On the diamond, I pitched a perfect game. 27 up, 27 down. No walks, no hits, no
                    errors. Pure focus for seven innings. That day taught me that perfection is possible
                    when you trust your preparation and stay present.
                  </p>

                  <h3 className="text-xl font-semibold text-white mb-4">The South Texas Sliders</h3>
                  <p className="text-text-secondary leading-relaxed mb-8">
                    I played travel ball for the South Texas Sliders. We took a tour of Texas Tech&apos;s
                    campus during a tournament, and I started later that day against the number one team
                    in the country—on Tech&apos;s field. Those are the moments that shape you.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Why Blaze */}
        <Section padding="lg" background="charcoal">
          <Container>
            <div className="max-w-3xl mx-auto">
              <ScrollReveal direction="up">
                <h2 className="font-display text-3xl font-bold uppercase tracking-display mb-8 text-center">
                  Why <span className="text-gradient-blaze">&quot;Blaze&quot;</span>
                </h2>

                <div className="prose prose-invert prose-lg max-w-none">
                  <p className="text-text-secondary leading-relaxed mb-8">
                    The name Blaze Sports Intel comes from my dog—a dachshund we named Blaze after
                    the first baseball team I ever played on: the Bartlett Blaze. That dog was my
                    buddy through some of the best years of my life.
                  </p>

                  <p className="text-text-secondary leading-relaxed mb-8">
                    When it came time to name this company, I wanted something that meant something.
                    Something that connected my love for sports with the memories that made me who I am.
                    Blaze was the perfect fit—and the perfect tribute to a good boy who was always
                    there when I came home from practice.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={100}>
                <Card padding="none" className="overflow-hidden my-8">
                  <div className="relative aspect-video">
                    <Image
                      src="/images/blaze-and-austin.webp"
                      alt="Austin and Blaze the dachshund"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 bg-charcoal">
                    <p className="text-sm text-text-tertiary text-center">
                      Blaze and me — the namesake of Blaze Sports Intel
                    </p>
                  </div>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* The Journey Timeline */}
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
                    description: 'August 17—same day as Davy Crockett. Dad put West Columbia dirt under the hospital bed.',
                  },
                  {
                    year: '1998',
                    title: 'Ricky Williams Game',
                    description: 'Watched Ricky Williams break the NCAA rushing record at DKR Memorial Stadium.',
                  },
                  {
                    year: '2007',
                    title: '70 Yards to the House',
                    description: 'First play of the season, first time at RB. Took it all the way.',
                  },
                  {
                    year: '2010s',
                    title: 'Friday Night Lights',
                    description: 'Boerne Champion. TD against Tivy. ESPN highlight against Marble Falls. Perfect game on the mound.',
                  },
                  {
                    year: '2017',
                    title: 'University of Texas at Austin',
                    description:
                      'International Relations. Minors in European Studies, Political Science, Economics. Hook \'em.',
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
                      'Got tired of ESPN treating college baseball like an afterthought. Built what fans deserve.',
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

        {/* My Teams */}
        <Section padding="lg" background="charcoal">
          <Container>
            <div className="max-w-3xl mx-auto">
              <ScrollReveal direction="up">
                <h2 className="font-display text-3xl font-bold uppercase tracking-display mb-8 text-center">
                  My <span className="text-gradient-blaze">Teams</span>
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <Card padding="md" className="flex flex-col items-center">
                    <span className="text-3xl mb-2">⚾</span>
                    <span className="font-semibold text-white">Cardinals</span>
                    <span className="text-xs text-text-tertiary">MLB</span>
                  </Card>
                  <Card padding="md" className="flex flex-col items-center">
                    <span className="text-3xl mb-2">🏈</span>
                    <span className="font-semibold text-white">Titans</span>
                    <span className="text-xs text-text-tertiary">NFL</span>
                  </Card>
                  <Card padding="md" className="flex flex-col items-center">
                    <span className="text-3xl mb-2">🏀</span>
                    <span className="font-semibold text-white">Grizzlies</span>
                    <span className="text-xs text-text-tertiary">NBA</span>
                  </Card>
                  <Card padding="md" className="flex flex-col items-center">
                    <span className="text-3xl mb-2">🤘</span>
                    <span className="font-semibold text-white">Longhorns</span>
                    <span className="text-xs text-text-tertiary">Everything</span>
                  </Card>
                </div>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* The Mission */}
        <Section padding="lg">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <ScrollReveal direction="up">
                <h2 className="font-display text-3xl font-bold uppercase tracking-display mb-6">
                  The <span className="text-gradient-blaze">Mission</span>
                </h2>

                <p className="text-xl text-text-secondary leading-relaxed mb-8">
                  Every game matters to someone. MLB, NFL, NBA, College Baseball, NCAA Football—fans
                  deserve complete analytics, not just scores. Real data. Real coverage. Real intelligence.
                </p>

                <p className="text-text-secondary leading-relaxed mb-8">
                  Blaze Sports Intel exists because I got tired of waiting. ESPN treats college baseball
                  like an afterthought. Fans deserve better. So I built what fans deserve myself. Live
                  scores that update. Standings that stay current. Analytics that help coaches, scouts,
                  and fans make better decisions across every sport we cover.
                </p>

                <p className="text-lg text-white font-semibold">
                  Born to blaze the path less beaten.
                </p>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Contact */}
        <Section padding="lg" background="charcoal">
          <Container center>
            <ScrollReveal direction="up">
              <div className="max-w-xl mx-auto text-center">
                <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-4">
                  Get in Touch
                </h2>
                <p className="text-text-secondary mb-6">
                  Questions, partnerships, or just want to talk sports? I read every email.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
                  <a
                    href="mailto:Austin@blazesportsintel.com"
                    className="btn-primary px-6 py-3 text-center"
                  >
                    Austin@blazesportsintel.com
                  </a>
                  <a href="tel:+12102755538" className="btn-secondary px-6 py-3 text-center">
                    (210) 275-5538
                  </a>
                </div>
                <Link href="/pricing" className="text-burnt-orange hover:underline">
                  View Pricing →
                </Link>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
