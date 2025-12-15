import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'About', href: '/about' },
];

export default function NotFound() {
  return (
    <>
      <Navbar items={navItems} />
      <main id="main-content">
        <Section padding="lg" className="pt-24 min-h-[70vh] flex items-center">
          <Container center>
            <div className="max-w-lg mx-auto text-center">
              <h1 className="font-display text-8xl font-bold text-burnt-orange mb-4">404</h1>
              <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-4">
                Page Not <span className="text-gradient-blaze">Found</span>
              </h2>
              <p className="text-text-secondary mb-8">
                Looks like this play got called back. The page you are looking for does not exist or has been moved.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button variant="primary" size="lg">
                    Back to Home
                  </Button>
                </Link>
                <Link href="/college-baseball">
                  <Button variant="secondary" size="lg">
                    College Baseball
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
