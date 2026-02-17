import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Footer } from '@/components/layout-ds/Footer';
import Link from 'next/link';

export default function BlazeCraftPage() {
  return (
    <>
      <Section className="pt-24 pb-12">
        <Container>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/arcade" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Arcade
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white text-sm font-semibold">BlazeCraft</span>
          </div>

          <div className="max-w-2xl mx-auto text-center py-20">
            <span className="text-6xl mb-6 block">&#x2694;&#xFE0F;</span>
            <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400">
              Coming Soon
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-heading uppercase tracking-tight mb-4">
              Blaze<span className="text-[#BF5700]">Craft</span>
            </h1>
            <p className="text-white/60 mb-8 leading-relaxed">
              Real-time strategy meets system health monitoring. Inspired by Warcraft 3: Frozen Throne
              and MicroRTS, BlazeCraft visualizes BSI infrastructure as an RTS battlefield.
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-10">
              <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4">
                <p className="text-2xl font-bold text-[#8B4513]">RTS</p>
                <p className="text-xs text-white/40 mt-1">Mechanics</p>
              </div>
              <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4">
                <p className="text-2xl font-bold text-[#8B4513]">Live</p>
                <p className="text-xs text-white/40 mt-1">System Health</p>
              </div>
              <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4">
                <p className="text-2xl font-bold text-[#8B4513]">53</p>
                <p className="text-xs text-white/40 mt-1">Workers Mapped</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/arcade"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#BF5700]/20 text-[#BF5700] rounded-lg hover:bg-[#BF5700]/30 transition-colors text-sm font-semibold"
              >
                &#x2190; Back to Arcade
              </Link>
              <a
                href="https://blazecraft.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-sm font-semibold"
              >
                Visit blazecraft.app &#x2197;
              </a>
            </div>
          </div>
        </Container>
      </Section>
      <Footer />
    </>
  );
}
