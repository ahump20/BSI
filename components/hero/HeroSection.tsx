'use client';

/**
 * BSI Hero Section - Flexible Variants with Parallax
 *
 * Supports multiple visual treatments:
 * - 'home': Three.js ember particles (homepage)
 * - 'gradient': Sport-themed gradient background
 * - 'image': Background image with dark overlay
 * - 'video': Background video with dark overlay
 *
 * Features:
 * - Parallax scrolling effects on background and content
 * - Framer Motion animations for smooth entrance
 * - Responsive design with mobile-first approach
 */

import Link from 'next/link';
import { type ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HeroEmbers } from '@/components/three/HeroEmbers';
import { Marquee } from '@/components/ui/Marquee';

export type HeroVariant = 'home' | 'gradient' | 'image' | 'video';
export type SportTheme = 'baseball' | 'football' | 'basketball' | 'default';

export interface HeroSectionProps {
  /** Visual treatment variant */
  variant?: HeroVariant;
  /** Sport-specific theming (for gradient variant) */
  sportTheme?: SportTheme;
  /** Background image URL (for 'image' variant) */
  backgroundImage?: string;
  /** Background video URL (for 'video' variant) */
  backgroundVideo?: string;
  /** Hero title - defaults to homepage title */
  title?: ReactNode;
  /** Subtitle or description */
  subtitle?: ReactNode;
  /** Kicker/eyebrow text above title */
  kicker?: string;
  /** Call-to-action content */
  actions?: ReactNode;
  /** Additional content below actions */
  children?: ReactNode;
  /** Height preset */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Show marquee strip at bottom */
  showMarquee?: boolean;
  /** Enable parallax scrolling effect */
  enableParallax?: boolean;
  /** Additional className */
  className?: string;
}

// Animation variants for staggered content entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const sizeStyles = {
  sm: 'min-h-[40vh] py-16',
  md: 'min-h-[60vh] py-20',
  lg: 'min-h-[80vh] py-24',
  full: 'min-h-screen',
};

const sportGradients: Record<SportTheme, string> = {
  baseball: 'from-[#6b8e23]/20 via-midnight to-midnight',
  football: 'from-[#355e3b]/20 via-midnight to-midnight',
  basketball: 'from-[#e25822]/20 via-midnight to-midnight',
  default: 'from-burnt-orange/20 via-midnight to-midnight',
};

export function HeroSection({
  variant = 'home',
  sportTheme = 'default',
  backgroundImage,
  backgroundVideo,
  title,
  subtitle,
  kicker,
  actions,
  children,
  size = 'full',
  showMarquee = false,
  enableParallax = true,
  className,
}: HeroSectionProps): JSX.Element {
  // Parallax scroll setup
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Parallax transforms - background moves slower than foreground
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Homepage variant with parallax
  if (variant === 'home') {
    return (
      <section
        ref={heroRef}
        className={cn(
          'relative min-h-screen bg-true-black flex flex-col overflow-hidden',
          className
        )}
      >
        {/* Three.js Ember Particles Background with Parallax */}
        <motion.div
          className="absolute inset-0 -z-10"
          style={enableParallax ? { y: backgroundY } : undefined}
        >
          <HeroEmbers className="" />
        </motion.div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-true-black/60 via-transparent to-true-black/80 pointer-events-none" />

        {/* Hero Content with Parallax */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10"
          style={enableParallax ? { y: contentY, opacity: contentOpacity } : undefined}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Establishment Badge */}
          <motion.div className="mb-8" variants={itemVariants}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white/70 text-sm font-medium tracking-wide">
              <span className="w-2 h-2 bg-burnt-orange-500 rounded-full animate-pulse" />
              Est. 1995 · Memphis → Texas
            </span>
          </motion.div>

          {/* Main Typography */}
          <motion.div className="text-center max-w-5xl mx-auto" variants={itemVariants}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-none">
              <span className="block text-white/80 mb-2">Born to</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-burnt-orange-400 via-ember to-burnt-orange-500 py-2">
                BLAZE
              </span>
              <span className="block text-white mt-2">The Path Less Beaten</span>
            </h1>

            {/* Tagline */}
            <p className="mt-8 text-lg sm:text-xl md:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Every game matters to someone. We built the coverage fans actually deserve.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="mt-10 flex flex-col sm:flex-row gap-4 items-center"
            variants={itemVariants}
          >
            <Link href="/about" className="btn-primary px-8 py-4 text-lg">
              Read the Story
            </Link>
            <Link href="/dashboard" className="btn-secondary px-8 py-4 text-lg">
              Follow the Intel
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="mt-16"
            variants={itemVariants}
            animate={{
              y: [0, 8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <svg
              className="w-6 h-6 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Brand Marquee Strip */}
        <Marquee className="border-t-0" />
      </section>
    );
  }

  // Sport page variants (gradient, image, video)
  return (
    <section
      ref={heroRef}
      className={cn(
        'relative flex flex-col items-center justify-center text-center overflow-hidden',
        sizeStyles[size],
        className
      )}
    >
      {/* Background Layer with Parallax */}
      {variant === 'video' && backgroundVideo ? (
        <motion.div
          className="absolute inset-0 z-0"
          style={enableParallax ? { y: backgroundY } : undefined}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover scale-110"
            poster={backgroundImage}
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/60 via-midnight/80 to-midnight" />
        </motion.div>
      ) : variant === 'image' && backgroundImage ? (
        <motion.div
          className="absolute inset-0 z-0"
          style={enableParallax ? { y: backgroundY } : undefined}
        >
          <div
            className="w-full h-full bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/60 via-midnight/80 to-midnight" />
        </motion.div>
      ) : (
        <motion.div
          className={cn('absolute inset-0 z-0 bg-gradient-to-b', sportGradients[sportTheme])}
          style={enableParallax ? { y: backgroundY } : undefined}
        />
      )}

      {/* Ambient glow effect with subtle animation */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-burnt-orange/10 rounded-full blur-3xl pointer-events-none"
        animate={{
          opacity: [0.2, 0.35, 0.2],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content with Parallax and Animations */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6"
        style={enableParallax ? { y: contentY, opacity: contentOpacity } : undefined}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {kicker && (
          <motion.span
            className="inline-block mb-4 px-3 py-1 text-xs font-semibold tracking-widest uppercase text-burnt-orange bg-burnt-orange/10 border border-burnt-orange/20 rounded-full"
            variants={itemVariants}
          >
            {kicker}
          </motion.span>
        )}

        {title && (
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 tracking-tight"
            variants={itemVariants}
          >
            {title}
          </motion.h1>
        )}

        {subtitle && (
          <motion.p
            className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8"
            variants={itemVariants}
          >
            {subtitle}
          </motion.p>
        )}

        {actions && (
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4"
            variants={itemVariants}
          >
            {actions}
          </motion.div>
        )}

        {children && <motion.div variants={itemVariants}>{children}</motion.div>}
      </motion.div>

      {/* Optional marquee */}
      {showMarquee && (
        <div className="absolute bottom-0 left-0 right-0">
          <Marquee className="border-t-0" />
        </div>
      )}
    </section>
  );
}

export default HeroSection;
