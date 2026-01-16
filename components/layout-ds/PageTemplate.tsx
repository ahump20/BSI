'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { HeroSection, type HeroVariant, type SportTheme } from '@/components/hero/HeroSection';
import { Footer } from './Footer';

export interface PageTemplateProps {
  /** Page title for hero section */
  title?: ReactNode;
  /** Subtitle/description for hero section */
  subtitle?: ReactNode;
  /** Kicker text above title */
  kicker?: string;
  /** Hero variant */
  heroVariant?: HeroVariant;
  /** Hero size */
  heroSize?: 'sm' | 'md' | 'lg' | 'full';
  /** Sport theme */
  sportTheme?: SportTheme;
  /** Background image for hero */
  backgroundImage?: string;
  /** Background video for hero */
  backgroundVideo?: string;
  /** Hero actions (buttons) */
  heroActions?: ReactNode;
  /** Show marquee in hero */
  showMarquee?: boolean;
  /** Enable parallax effect */
  enableParallax?: boolean;
  /** Main content */
  children: ReactNode;
  /** Sidebar content */
  sidebar?: ReactNode;
  /** Sidebar position */
  sidebarPosition?: 'left' | 'right';
  /** Show footer */
  showFooter?: boolean;
  /** Additional className for main content */
  className?: string;
  /** Additional className for container */
  containerClassName?: string;
}

// Animation variants for page content
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const sectionVariants = {
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

/**
 * PageTemplate - Consistent page layout wrapper
 *
 * Provides:
 * - Flexible hero section with multiple variants
 * - Animated content entrance
 * - Optional sidebar layout
 * - Footer inclusion
 * - Sport-themed styling
 */
export function PageTemplate({
  title,
  subtitle,
  kicker,
  heroVariant = 'gradient',
  heroSize = 'md',
  sportTheme = 'default',
  backgroundImage,
  backgroundVideo,
  heroActions,
  showMarquee = false,
  enableParallax = true,
  children,
  sidebar,
  sidebarPosition = 'right',
  showFooter = true,
  className,
  containerClassName,
}: PageTemplateProps): JSX.Element {
  const hasSidebar = !!sidebar;

  return (
    <>
      {/* Hero Section */}
      {(title || subtitle || kicker) && (
        <HeroSection
          variant={heroVariant}
          size={heroSize}
          sportTheme={sportTheme}
          backgroundImage={backgroundImage}
          backgroundVideo={backgroundVideo}
          title={title}
          subtitle={subtitle}
          kicker={kicker}
          actions={heroActions}
          showMarquee={showMarquee}
          enableParallax={enableParallax}
        />
      )}

      {/* Main Content */}
      <main id="main-content" className={cn('min-h-[50vh]', className)}>
        <Container className={containerClassName}>
          <motion.div
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            className="py-8 md:py-12"
          >
            {hasSidebar ? (
              <div
                className={cn(
                  'grid gap-8 lg:gap-12',
                  sidebarPosition === 'right'
                    ? 'lg:grid-cols-[1fr_320px]'
                    : 'lg:grid-cols-[320px_1fr]'
                )}
              >
                {sidebarPosition === 'left' && (
                  <motion.aside variants={sectionVariants} className="space-y-6 order-2 lg:order-1">
                    {sidebar}
                  </motion.aside>
                )}

                <motion.div
                  variants={sectionVariants}
                  className={cn(
                    'space-y-8',
                    sidebarPosition === 'left' ? 'order-1 lg:order-2' : ''
                  )}
                >
                  {children}
                </motion.div>

                {sidebarPosition === 'right' && (
                  <motion.aside variants={sectionVariants} className="space-y-6">
                    {sidebar}
                  </motion.aside>
                )}
              </div>
            ) : (
              <motion.div variants={sectionVariants}>{children}</motion.div>
            )}
          </motion.div>
        </Container>
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </>
  );
}

/**
 * PageSection - Animated section within a page
 */
export function PageSection({
  children,
  className,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}): JSX.Element {
  return (
    <motion.section variants={sectionVariants} className={cn('space-y-4', className)}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            {title && (
              <h2 className="text-xl md:text-2xl font-display font-bold text-text-primary">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
}

/**
 * PageGrid - Responsive grid layout
 */
export function PageGrid({
  children,
  columns = 3,
  gap = 'md',
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}): JSX.Element {
  const columnStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gapStyles = {
    sm: 'gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
  };

  return (
    <div className={cn('grid', columnStyles[columns], gapStyles[gap], className)}>{children}</div>
  );
}

export default PageTemplate;
