'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { ChevronRight } from 'lucide-react';

const editorialContent = [
  {
    id: 'week-1-preview',
    title: 'Week 1 Preview: Opening Weekend',
    subtitle: 'Key matchups, power rankings, breakout stars, and the Texas dossier',
    category: 'Preview',
    readTime: '10 min read',
    featured: true,
    gradient: 'from-[#BF5700] to-[#FF6B35]',
    href: '/college-baseball/editorial/week-1-preview',
  },
];

export default function EditorialHubPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-white/40 hover:text-[#BF5700] transition-colors">
                College Baseball
              </Link>
              <span className="text-white/40">/</span>
              <span className="text-white font-medium">Editorial</span>
            </nav>
          </Container>
        </Section>

        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-[#BF5700]/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">
                <span className="text-gradient-blaze">Editorial</span>
              </h1>
              <p className="text-white/60 max-w-xl mb-8">
                Analysis, previews, and deep dives beyond the box score.
              </p>
            </ScrollReveal>

            <div className="space-y-6">
              {editorialContent.map((item) => (
                <ScrollReveal key={item.id} direction="up" delay={100}>
                  <Link href={item.href}>
                    <Card padding="none" className="overflow-hidden hover:border-[#BF5700]/50 transition-all cursor-pointer group">
                      <div className={`bg-gradient-to-br ${item.gradient} p-8 md:p-10 relative`}>
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="primary">{item.category}</Badge>
                            <span className="text-white/70 text-sm">{item.readTime}</span>
                            {item.featured && <Badge variant="success">Featured</Badge>}
                          </div>
                          <h2 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-2 group-hover:text-[#BF5700] transition-colors">
                            {item.title}
                          </h2>
                          <p className="text-white/80 mb-4">{item.subtitle}</p>
                          <div className="flex items-center text-[#BF5700] font-medium">
                            Read full preview
                            <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
