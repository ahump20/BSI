'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout-ds/Footer';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const numberVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const buttonContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export default function NotFound() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 min-h-[70vh] flex items-center">
          <Container center>
            <motion.div
              className="max-w-xl mx-auto text-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h1
                className="font-display text-8xl font-bold text-burnt-orange mb-4"
                variants={numberVariants}
              >
                404
              </motion.h1>
              <motion.h2
                className="font-display text-2xl font-bold uppercase tracking-display mb-4"
                variants={itemVariants}
              >
                Page Not Found
              </motion.h2>
              <motion.p className="text-xl text-text-secondary mb-4" variants={itemVariants}>
                This one got away—like a passed ball in the ninth.
              </motion.p>
              <motion.p className="text-text-tertiary mb-10" variants={itemVariants}>
                The page you're looking for doesn't exist. It might have been moved, deleted, or
                never existed in the first place.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
                variants={buttonContainerVariants}
              >
                <motion.div variants={itemVariants}>
                  <Link href="/">
                    <Button variant="primary" size="lg">
                      Back to Home
                    </Button>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link href="/college-baseball/scores">
                    <Button variant="secondary" size="lg">
                      Live Scores
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Popular links */}
              <motion.div
                className="border-t border-border-subtle pt-6 mb-6"
                variants={itemVariants}
              >
                <p className="text-xs text-text-muted uppercase tracking-wider mb-4">
                  Popular Pages
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    { label: 'Transfer Portal', href: '/transfer-portal' },
                    { label: 'College Baseball Scores', href: '/college-baseball/scores' },
                    { label: 'MLB Standings', href: '/mlb' },
                    { label: 'Rankings', href: '/college-baseball/rankings' },
                    { label: 'Dashboard', href: '/dashboard' },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-border-subtle text-text-secondary hover:text-burnt-orange hover:border-burnt-orange/30 transition-all"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <p className="text-sm text-text-muted italic">
                  Fun fact: A passed ball is scored against the catcher, not a wild pitch. Details
                  matter. That&apos;s why we&apos;re here.
                </p>
              </motion.div>
            </motion.div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
