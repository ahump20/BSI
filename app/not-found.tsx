'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout-ds/Footer';

// Animation variants
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

export default function NotFound() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 min-h-[70vh] flex items-center">
          <Container center>
            <motion.div
              className="max-w-lg mx-auto text-center"
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
                Page Not <span className="text-gradient-blaze">Found</span>
              </motion.h2>
              <motion.p className="text-text-secondary mb-8" variants={itemVariants}>
                Looks like this play got called back. The page you are looking for does not exist or
                has been moved.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
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
                  <Link href="/college-baseball">
                    <Button variant="secondary" size="lg">
                      College Baseball
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
