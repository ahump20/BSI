'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FanbaseProfileView } from '@/components/fanbase';
import { Footer } from '@/components/layout-ds/Footer';

export default function FanbaseProfileClient({ schoolId }: { schoolId: string }) {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-midnight via-charcoal to-midnight">
        <section className="py-8 md:py-12">
          <Container>
            {/* Breadcrumb */}
            <nav className="mb-6">
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <Link
                    href="/fanbase"
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    Fanbases
                  </Link>
                </li>
                <li className="text-white/30">/</li>
                <li className="text-white capitalize">{schoolId.replace(/-/g, ' ')}</li>
              </ol>
            </nav>

            <FanbaseProfileView schoolId={schoolId} />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
