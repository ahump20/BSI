import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Austin Humphrey | Born on Texas Soil | Blaze Sports Intel',
  description: 'The story of John Austin Humphrey, founder of Blaze Sports Intel. Born in Memphis on Davy Crockett\'s birthday, on Texas soil from West Columbia. Named after his dog Blaze, who was named after his first baseball team, the Bartlett Blaze. "You know you ain\'t the first to do this—but they\'ve ALL been from Texas."'
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-900" id="about">
      {/* Hero Section */}
      <section className="relative py-24 px-6 text-center bg-gradient-to-b from-slate-900 via-slate-900 to-orange-950/20">
        <div className="max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-semibold tracking-wider uppercase mb-6">
            The Origin Story
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300 mb-6">
            Born on Texas Soil
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-8">
            <strong className="text-orange-400">August 17, 1995</strong> — Memphis, Tennessee.
            The same birthday as <strong className="text-orange-400">Davy Crockett</strong>,
            the legendary Tennessee Senator and folk hero who died defending Texas at the Alamo.
            Born literally on Texas soil from <strong className="text-orange-400">West Columbia</strong>,
            the birthplace of the Republic.
          </p>

          {/* Doctor's Quote */}
          <blockquote className="max-w-2xl mx-auto p-6 bg-orange-500/10 border-2 border-orange-500/50 rounded-2xl">
            <p className="text-xl md:text-2xl italic text-white mb-3">
              "You know you ain't the first to do this—but they've ALL been from Texas."
            </p>
            <cite className="text-orange-400 font-semibold not-italic">
              — The Delivering Physician, Baptist Memorial Hospital, Memphis, TN
            </cite>
          </blockquote>
        </div>
      </section>

      {/* Why "Blaze"? Section */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Why "Blaze"?</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-slate-800/50 border border-orange-500/20 rounded-2xl p-8">
              <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">The Namesake</span>
              <h3 className="text-2xl font-bold text-white mt-2 mb-4">Named After a Dog, Named After a Dream</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                <strong className="text-orange-400">BlazeSportsIntel.com</strong> is named after my old dog,
                <strong className="text-orange-400"> Blaze</strong>.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                And Blaze? He was named after my first baseball team—the <strong className="text-orange-400">Bartlett Blaze</strong>.
                A youth league team from when I was a kid, before the analytics, before the algorithms,
                back when sports was just about showing up, playing hard, and the smell of grass and dirt.
              </p>
              <p className="text-slate-400 italic leading-relaxed">
                "Every algorithm I write, every insight this platform generates, carries that same fire—that
                <strong className="text-orange-400 not-italic"> blaze</strong>—that a kid feels stepping up to the plate for the first time."
              </p>
            </div>

            <div className="bg-slate-800/50 border border-orange-500/20 rounded-2xl p-8">
              <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">The Foundation</span>
              <h3 className="text-2xl font-bold text-white mt-2 mb-4">A Boy and His Bat</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                Before the analytics. Before the algorithms. Before understanding what a batting average even meant.
                There was this: <strong className="text-orange-400">a red bat, a glove, and a dad who taught me to love the game.</strong>
              </p>
              <p className="text-slate-300 leading-relaxed">
                Every great sports analyst starts the same way—not with spreadsheets, but with someone who hands you a bat
                and shows you how to swing. The numbers came later.
                <strong className="text-orange-400"> The love of the game came first.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Humphrey Legacy */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-orange-950/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">The Humphrey Legacy</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto rounded-full"></div>
          </div>

          <div className="bg-slate-800/50 border border-orange-500/30 rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12">
                <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">El Campo, Texas</span>
                <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 mb-6">Grandpa Bill: From Dust to Dynasty</h3>

                <p className="text-slate-300 leading-relaxed mb-4">
                  My grandfather, <strong className="text-orange-400">Bill Humphrey</strong>, grew up
                  <strong className="text-orange-400"> dirt poor in west Texas</strong>—the kind of poor where
                  you don't dream big because survival takes all your energy. But Bill Humphrey dreamed anyway.
                </p>

                <p className="text-slate-300 leading-relaxed mb-4">
                  He served in <strong className="text-orange-400">World War II</strong>, defending the country
                  that would later give him every opportunity he'd make for himself. When he came home, he enrolled
                  at <strong className="text-orange-400">Hardin-Simmons University</strong> in Abilene, Texas—where
                  he met the woman who would become my grandmother, <strong className="text-orange-400">Helen</strong>.
                </p>

                <p className="text-slate-300 leading-relaxed mb-6">
                  Bill Humphrey went on to <strong className="text-orange-400">found and own banks in El Campo, Texas</strong>.
                  The boy from dirt-poor west Texas built institutions that helped other Texans build their dreams.
                </p>

                <blockquote className="p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg">
                  <p className="text-white italic mb-2">"Never stop dreaming beyond the horizon."</p>
                  <cite className="text-orange-400 text-sm not-italic">— The Humphrey family philosophy</cite>
                </blockquote>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-slate-900 p-8 md:p-12 flex flex-col justify-center items-center text-center">
                <div className="text-6xl mb-6">🏦</div>
                <h4 className="text-2xl font-bold text-orange-400 mb-6">Bill Humphrey</h4>
                <div className="grid gap-4 w-full max-w-xs">
                  <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Origin</div>
                    <div className="text-white font-semibold">West Texas</div>
                  </div>
                  <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Service</div>
                    <div className="text-white font-semibold">WWII Veteran</div>
                  </div>
                  <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Education</div>
                    <div className="text-white font-semibold">Hardin-Simmons University</div>
                  </div>
                  <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Legacy</div>
                    <div className="text-white font-semibold">Founded Banks in El Campo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Family Tradition */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">The Annual Pilgrimage</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/50 border border-orange-500/20 rounded-2xl p-8">
              <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">The Tradition • 40-50 Years</span>
              <h3 className="text-2xl font-bold text-white mt-2 mb-4">600 Miles for Family</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                My family has held <strong className="text-orange-400">the same four season tickets to Texas Longhorn football
                for longer than I've been alive—40 to 50 years</strong>. Every year, we'd make the pilgrimage from
                Memphis to Austin—a journey of over 600 miles one way.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                It wasn't just about watching the Longhorns play. It was about
                <strong className="text-orange-400"> Thanksgiving dinner with Grandpa Bill and Grandma Helen</strong>,
                about continuity, about showing up for family and for tradition.
              </p>
              <p className="text-slate-400 italic">
                "Some families pass down jewelry or property. Mine passed down season tickets and a philosophy—that
                you show up, that you're loyal, and that you never stop dreaming beyond the horizon."
              </p>
            </div>

            <div className="bg-slate-800/50 border border-orange-500/20 rounded-2xl p-8">
              <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">The Moment • November 27, 1998</span>
              <h3 className="text-2xl font-bold text-white mt-2 mb-4">The Ricky Williams Game</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                That November, I was three years old. Darrell K Royal-Texas Memorial Stadium.
                <strong className="text-orange-400"> Ricky Williams breaks the NCAA all-time rushing record</strong>
                against Texas A&M. Final score: Texas 26, A&M 24.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                I was there, in a Texas t-shirt, watching history happen in those family seats. Too young to understand
                statistics, old enough to feel the electricity when something legendary unfolds.
              </p>
              <p className="text-slate-300 leading-relaxed">
                That game taught me what numbers can't capture:
                <strong className="text-orange-400"> momentum, pressure, the intangibles that separate statistics from story</strong>.
                Twenty-five years later, I'm still trying to measure what I felt that day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steinbeck Quote */}
      <section className="py-20 px-6 bg-gradient-to-b from-orange-950/20 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className="relative">
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-8xl text-orange-500/20 font-serif">"</span>
            <p className="text-xl md:text-2xl italic text-slate-300 leading-relaxed mb-6">
              Texas has a tight cohesiveness perhaps stronger than any other section of America. Rich, poor,
              Panhandle, Gulf, city, country, Texas is the obsession, the proper study, and the passionate
              possession of all Texans.
            </p>
            <cite className="text-orange-400 font-semibold not-italic block">— John Steinbeck</cite>
            <span className="text-slate-500 text-sm">Travels with Charley: In Search of America, 1962</span>
          </blockquote>
        </div>
      </section>

      {/* Personal Philosophy */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-orange-500/10 to-slate-800/50 border-2 border-orange-500/50 rounded-2xl p-8 md:p-12 text-center">
            <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">My Philosophy</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-6">What Texas Means to Me</h2>
            <p className="text-xl text-slate-300 leading-relaxed italic">
              For myself, personally, I think Texas is <strong className="text-orange-400 not-italic">how you choose to treat
              the best and worst of us</strong>. A covenant with oneself and the company he keeps to never allow each other
              to <strong className="text-orange-400 not-italic">never stop dreaming beyond the horizon</strong>, regardless of
              race, ethnicity, religion, or even birth soil.
            </p>
            <p className="text-2xl font-bold text-orange-400 mt-6">
              A home, a family, a philosophy.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-orange-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Experience Championship Analytics</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Built on Texas heritage, competitive fire, and a philosophy that says never stop dreaming beyond the horizon.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-500 hover:to-orange-400 transition-all">
              Explore Platform
            </a>
            <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 border border-orange-500/30 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all">
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      {/* Footer Philosophy */}
      <footer className="py-8 px-6 border-t border-orange-500/20 text-center">
        <p className="text-slate-500 text-sm">
          © 2025 Blaze Sports Intel. Built with <span className="text-orange-500">passion</span> in Boerne, Texas.
        </p>
        <p className="text-slate-600 text-xs mt-2 italic">
          Born on Texas Soil. Never Stop Dreaming Beyond the Horizon.
        </p>
        <p className="text-slate-700 text-xs mt-1">
          A home, a family, a philosophy.
        </p>
      </footer>
    </main>
  );
}
