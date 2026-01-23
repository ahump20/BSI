'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout-ds/Footer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const numberVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const buttonContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export default function NotFound(): JSX.Element {
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
                className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
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
                  <Link href="/transfer-portal">
                    <Button variant="secondary" size="lg">
                      Transfer Portal
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
              <motion.div className="border-t border-border-subtle pt-6" variants={itemVariants}>
                <p className="text-sm text-text-muted italic">
                  Fun fact: A passed ball is scored against the catcher, not a wild pitch. Details
                  matter. That's why we're here.
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
