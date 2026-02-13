'use client';

/**
 * Vision AI Intelligence Hub
 *
 * Flagship long-form page covering how computer vision is transforming
 * sports analytics across 8 application areas. Positions BSI as the
 * authoritative source on CV in sports, with college sports as the
 * strategic anchor.
 *
 * Data is structured from BSI's research survey — no live API calls.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { TechMaturityMap } from '@/components/vision-ai/TechMaturityMap';
import { SonyEmpireTimeline } from '@/components/vision-ai/SonyEmpireTimeline';
import { CollegeSportsGap } from '@/components/vision-ai/CollegeSportsGap';
import { StrikeZoneModel } from '@/components/mlb/StrikeZoneModel';

// ─── Section Navigation ────────────────────────────────────────────────────

type SectionId =
  | 'overview'
  | 'tracking'
  | 'biomechanics'
  | 'injury'
  | 'play-recognition'
  | 'officiating'
  | 'fan-engagement'
  | 'scouting'
  | 'frontier'
  | 'sony'
  | 'college-gap'
  | 'open-source'
  | 'tools';

interface NavSection {
  id: SectionId;
  label: string;
  shortLabel: string;
}

const NAV_SECTIONS: NavSection[] = [
  { id: 'overview', label: 'Application Overview', shortLabel: 'Overview' },
  { id: 'tracking', label: 'Player Tracking', shortLabel: 'Tracking' },
  { id: 'biomechanics', label: 'Biomechanics', shortLabel: 'Biomechanics' },
  { id: 'injury', label: 'Injury Prediction', shortLabel: 'Injury' },
  { id: 'play-recognition', label: 'Play Recognition', shortLabel: 'Plays' },
  { id: 'officiating', label: 'Officiating', shortLabel: 'Officials' },
  { id: 'fan-engagement', label: 'Fan Engagement', shortLabel: 'Fans' },
  { id: 'scouting', label: 'Scouting at Scale', shortLabel: 'Scouting' },
  { id: 'frontier', label: 'Frontier Tech', shortLabel: 'Frontier' },
  { id: 'sony', label: 'Sony CV Empire', shortLabel: 'Sony' },
  { id: 'college-gap', label: 'College Gap', shortLabel: 'College' },
  { id: 'open-source', label: 'Open Source Toolbox', shortLabel: 'OSS' },
  { id: 'tools', label: 'Try It', shortLabel: 'Tools' },
];

// ─── Application Area Data ─────────────────────────────────────────────────

interface AppArea {
  id: SectionId;
  title: string;
  tagline: string;
  companies: { name: string; maturity: 'Production' | 'Growth' | 'Research' }[];
  sports: string[];
  stats: { label: string; value: string }[];
  description: string;
  bsiTake: string;
}

const APP_AREAS: AppArea[] = [
  {
    id: 'tracking',
    title: 'Player Tracking',
    tagline: 'Where every player is, every frame, every game',
    companies: [
      { name: 'Statcast / Hawk-Eye', maturity: 'Production' },
      { name: 'Second Spectrum (Genius Sports)', maturity: 'Production' },
      { name: 'SkillCorner', maturity: 'Growth' },
      { name: 'RF-DETR / ByteTrack', maturity: 'Research' },
    ],
    sports: ['MLB', 'NBA', 'NFL', 'NCAA Football'],
    stats: [
      { label: 'Cameras per MLB park', value: '12' },
      { label: 'Metrics per pitch', value: '225+' },
      { label: 'NBA keypoints/player', value: '29' },
      { label: 'Data per MLB game', value: '~7TB' },
    ],
    description: 'Optical tracking captures the physical position of every player and the ball in real-time using synchronized camera arrays. Hawk-Eye (Sony) dominates MLB and NBA; the NFL uses Zebra UWB tags. Broadcast-derived tracking from SkillCorner is pushing coverage to leagues and programs that can\'t afford dedicated camera installations.',
    bsiTake: 'Tracking data is the foundation layer. Every other application — biomechanics, play recognition, injury prediction — is built on top of knowing where people are. The gap between pro-level tracking and college is the single largest analytics inequality in sports.',
  },
  {
    id: 'biomechanics',
    title: 'Biomechanics',
    tagline: 'Measuring how athletes move, not just where',
    companies: [
      { name: 'KinaTrax (Sony)', maturity: 'Production' },
      { name: 'Driveline Baseball', maturity: 'Growth' },
      { name: 'PitcherNet', maturity: 'Research' },
      { name: 'RTMPose (open source)', maturity: 'Research' },
    ],
    sports: ['MLB', 'NCAA Baseball', 'NFL'],
    stats: [
      { label: 'KinaTrax skeletal points', value: '18' },
      { label: 'NCAA installs', value: '7' },
      { label: 'Cost per install', value: '~$500K' },
      { label: 'Capture rate', value: '30fps' },
    ],
    description: 'Biomechanical analysis uses markerless motion capture to measure joint angles, torque, and kinematic sequences. KinaTrax, now owned by Sony, is the gold standard — tracking 18 skeletal keypoints to measure elbow torque (critical for UCL health), shoulder rotation, hip-shoulder separation, and arm slot consistency.',
    bsiTake: 'This is where the money is in player development. A pitcher\'s elbow torque trend over a season is more predictive of injury than any subjective scouting report. The 7 NCAA programs with KinaTrax have a genuine competitive advantage in arm care — the other ~300 D1 programs are flying blind.',
  },
  {
    id: 'injury',
    title: 'Injury Prediction',
    tagline: 'Seeing injuries before they happen',
    companies: [
      { name: 'NFL Digital Athlete', maturity: 'Growth' },
      { name: 'Zone7', maturity: 'Growth' },
      { name: 'KinaTrax UCL monitoring', maturity: 'Growth' },
      { name: 'DARI Motion', maturity: 'Research' },
    ],
    sports: ['NFL', 'MLB', 'NBA'],
    stats: [
      { label: 'NFL cameras for impact', value: '38' },
      { label: 'NFL video resolution', value: '5K' },
      { label: 'Impact detection speed', value: '83x faster' },
      { label: 'Concussion reduction (2024)', value: '17%' },
    ],
    description: 'Computer vision enables predictive injury modeling by tracking biomechanical load, contact forces, and movement asymmetries over time. The NFL\'s Digital Athlete program uses 38 cameras at 5K resolution to detect helmet impacts 83x faster than manual review. Zone7 processes tracking + wearable data to flag injury risk before symptoms appear.',
    bsiTake: 'The NFL\'s 17% concussion reduction in 2024 is the single most compelling stat in sports technology. That\'s not incrementalism — that\'s material harm reduction powered by CV. College football, which has zero standardized impact detection, is the obvious next frontier.',
  },
  {
    id: 'play-recognition',
    title: 'Play Recognition',
    tagline: 'Teaching machines to read the game',
    companies: [
      { name: 'Hudl IQ', maturity: 'Growth' },
      { name: 'Sportlogiq (Teamworks)', maturity: 'Growth' },
      { name: 'Synergy Sports', maturity: 'Production' },
      { name: 'MLB pitch classification', maturity: 'Production' },
    ],
    sports: ['NCAA Football', 'NBA', 'MLB', 'NCAA Baseball'],
    stats: [
      { label: 'Synergy D1 baseball coverage', value: '~90%' },
      { label: 'NBA play types classified', value: '7+' },
      { label: 'Sportlogiq acq. by Teamworks', value: 'Jan 2026' },
      { label: 'Hudl IQ deployments', value: 'Growing' },
    ],
    description: 'Play recognition uses CV to classify actions from video: formations, play types, pitch types, pick-and-roll variants. Hudl IQ extracts tracking data from standard All-22 coaching film. Sportlogiq (acquired by Teamworks January 2026) does formation and route recognition. Synergy Sports provides comprehensive play-type tagging for basketball and baseball.',
    bsiTake: 'Sportlogiq\'s acquisition by Teamworks is the most significant college sports tech deal of 2026. Teamworks already owns INFLCR (NIL) and Hudl competitor tools — adding CV-based play recognition puts them on a collision course with Hudl for the college coaching market.',
  },
  {
    id: 'officiating',
    title: 'Officiating Technology',
    tagline: 'When cameras become the umpire',
    companies: [
      { name: 'ABS / Hawk-Eye (MLB)', maturity: 'Production' },
      { name: 'FIFA SAOT', maturity: 'Production' },
      { name: 'NBA auto-referee (research)', maturity: 'Research' },
    ],
    sports: ['MLB', 'NBA'],
    stats: [
      { label: 'ABS accuracy', value: '99.7%' },
      { label: 'Human umpire accuracy', value: '94.0%' },
      { label: 'Challenge review time', value: '~17 sec' },
      { label: 'Challenges per team/game', value: '2' },
    ],
    description: 'CV-assisted officiating uses real-time tracking to validate or overturn human calls. MLB\'s ABS (Automated Ball-Strike System) uses Hawk-Eye cameras to generate batter-specific strike zones based on skeletal pose estimation and adjudicates challenges in ~17 seconds. FIFA\'s SAOT tracks limb positions for offside calls at the World Cup.',
    bsiTake: 'ABS is the most visible deployment of computer vision in American sports. BSI tracks it in depth — challenge rates, success by role, umpire accuracy comparisons — because it\'s the proof point that CV can fundamentally change how games are called.',
  },
  {
    id: 'fan-engagement',
    title: 'Fan Engagement',
    tagline: 'From raw tracking to stories fans feel',
    companies: [
      { name: 'WSC Sports', maturity: 'Production' },
      { name: 'Beyond Sports (Sony)', maturity: 'Growth' },
      { name: 'Pixellot', maturity: 'Production' },
      { name: 'Viz.ai', maturity: 'Growth' },
    ],
    sports: ['MLB', 'NFL', 'NBA', 'NCAA Baseball', 'NCAA Football'],
    stats: [
      { label: 'WSC highlight generation', value: 'Real-time' },
      { label: 'Pixellot installations', value: '25,000+' },
      { label: 'Beyond Sports rendering', value: 'Live 3D' },
      { label: 'Auto-camera cost', value: '$5K-$25K' },
    ],
    description: 'CV-powered fan tools include automated highlight generation (WSC Sports), real-time 3D game visualization (Beyond Sports), and automated camera systems for broadcasting events that wouldn\'t otherwise be covered (Pixellot). These technologies democratize content creation — a mid-tier college baseball program can now stream games without a camera crew.',
    bsiTake: 'Pixellot is the quiet revolution in college sports. 25,000+ installations means thousands of games that were previously invisible are now watchable. For scouting, that\'s a force multiplier — you can see mid-major talent that used to require being in the stadium.',
  },
  {
    id: 'scouting',
    title: 'Scouting at Scale',
    tagline: 'Seeing every player, not just the ones on TV',
    companies: [
      { name: 'Synergy Sports', maturity: 'Production' },
      { name: 'Rapsodo', maturity: 'Production' },
      { name: 'TrackMan', maturity: 'Production' },
      { name: 'SkillCorner (broadcast-derived)', maturity: 'Growth' },
    ],
    sports: ['MLB', 'NCAA Baseball', 'NBA', 'NFL'],
    stats: [
      { label: 'Rapsodo unit cost', value: '$3K-$5K' },
      { label: 'TrackMan unit cost', value: '$20K+' },
      { label: 'Synergy D1 coverage', value: '~90%' },
      { label: 'SkillCorner coverage', value: 'Expanding' },
    ],
    description: 'CV-powered scouting multiplies the number of players a front office can evaluate by orders of magnitude. Rapsodo and TrackMan provide pitch/hit tracking at the program level. Synergy Sports processes game film to tag every play. Broadcast-derived tracking (SkillCorner) is the emerging frontier — extracting positional data from standard TV feeds without any in-venue hardware.',
    bsiTake: 'The cost curve matters: Rapsodo at $3K-$5K vs TrackMan at $20K+ means mid-tier programs can access pitch tracking that was exclusive to MLB a decade ago. The next step is broadcast-derived tracking making positional data available from any streamed game — that\'s when scouting truly scales.',
  },
  {
    id: 'frontier',
    title: 'Frontier Technology',
    tagline: 'Where sports CV goes next',
    companies: [
      { name: 'Crowd analytics', maturity: 'Research' },
      { name: 'Emotion detection', maturity: 'Research' },
      { name: 'Pre-snap prediction AI', maturity: 'Research' },
      { name: 'SAM 2 (Meta)', maturity: 'Research' },
    ],
    sports: ['All'],
    stats: [
      { label: 'SAM 2 segmentation', value: 'Real-time' },
      { label: 'Pre-snap play prediction', value: '>70% accuracy' },
      { label: 'Crowd density models', value: 'Emerging' },
      { label: 'Multi-modal fusion', value: 'Active research' },
    ],
    description: 'Frontier applications include crowd behavior analytics (density, flow, safety), emotion detection from facial and body language cues, and predictive play recognition — predicting what will happen before the ball is snapped. Meta\'s SAM 2 enables real-time video segmentation that could power new classes of interactive fan experiences.',
    bsiTake: 'Pre-snap prediction is the most immediately relevant frontier tech. If you can predict play type from formation and pre-snap motion with >70% accuracy, that changes how coaching staffs prepare. The research is there — the production deployment in college football is the gap.',
  },
];

// ─── Open Source Tools ─────────────────────────────────────────────────────

const OPEN_SOURCE_TOOLS = [
  { name: 'RF-DETR', role: 'Object Detection', license: 'Apache 2.0', org: 'Roboflow', note: 'Real-time detection, optimized for sports scenes' },
  { name: 'RTMPose', role: 'Pose Estimation', license: 'Apache 2.0', org: 'MMPose / OpenMMLab', note: '26 keypoints at real-time speeds' },
  { name: 'ByteTrack', role: 'Multi-Object Tracking', license: 'MIT', org: 'ByteDance', note: 'Associates detections across frames — no ReID model needed' },
  { name: 'SAM 2', role: 'Video Segmentation', license: 'Apache 2.0', org: 'Meta', note: 'Segment anything in video — players, ball, field' },
  { name: 'Supervision', role: 'CV Toolkit', license: 'MIT', org: 'Roboflow', note: 'Annotations, tracking, and visualization utilities' },
  { name: 'YOLOv8/11', role: 'Detection + Tracking', license: 'AGPL-3.0', org: 'Ultralytics', note: 'AGPL license — commercial use requires paid license' },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function VisionAIPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const isScrolling = useRef(false);

  // Sync nav highlight with manual scrolling via IntersectionObserver
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const sectionIds = NAV_SECTIONS.map((s) => s.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrolling.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
            break;
          }
        }
      },
      { rootMargin: '-160px 0px -60% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function scrollToSection(id: SectionId) {
    setActiveSection(id);
    isScrolling.current = true;
    const el = document.getElementById(id);
    if (el) {
      const offset = 140; // account for sticky nav
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    // Release scroll lock after animation
    setTimeout(() => { isScrolling.current = false; }, 800);
  }

  return (
    <>
      <main id="main-content">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <Section padding="xl" className="relative overflow-hidden">
          {/* Background treatment */}
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/8 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(191,87,0,0.06) 0%, transparent 50%),
                              radial-gradient(circle at 80% 50%, rgba(255,107,53,0.04) 0%, transparent 50%)`,
          }} />

          {/* Subtle grid lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="accent">2026 Intelligence Report</Badge>
                <Badge variant="secondary">8 Application Areas</Badge>
                <Badge variant="secondary">40+ Companies</Badge>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={80}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display mb-4">
                How Computer Vision is{' '}
                <span className="text-gradient-blaze">Reshaping Sports</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={120}>
              <p className="text-text-secondary max-w-3xl text-lg mb-2">
                From 12-camera Hawk-Eye arrays tracking 225+ metrics per pitch to open-source
                pose estimation anyone can run on a laptop — the technology landscape that
                powers modern sports analytics.
              </p>
              <p className="text-text-tertiary max-w-2xl">
                BSI covers what the major platforms won&apos;t: how this technology actually works,
                who builds it, what it costs, and where the gaps are — especially in college sports.
              </p>
            </ScrollReveal>

            {/* KPI Strip */}
            <ScrollReveal direction="up" delay={180}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                {[
                  { label: 'Cameras / MLB Park', value: '12' },
                  { label: 'Data / Game', value: '~7TB' },
                  { label: 'Metrics / Pitch', value: '225+' },
                  { label: 'Concussion Reduction', value: '17%' },
                ].map((kpi) => (
                  <Card key={kpi.label} variant="default" padding="md" className="text-center backdrop-blur-sm">
                    <p className="text-2xl md:text-3xl font-bold font-mono text-burnt-orange">{kpi.value}</p>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">{kpi.label}</p>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Section Navigation ───────────────────────────────── */}
        <Section padding="none" className="bg-charcoal border-y border-border-subtle sticky top-16 z-30">
          <Container size="wide">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
              {NAV_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${
                    activeSection === section.id
                      ? 'text-burnt-orange border-b-2 border-burnt-orange'
                      : 'text-text-tertiary hover:text-white'
                  }`}
                >
                  <span className="hidden md:inline">{section.label}</span>
                  <span className="md:hidden">{section.shortLabel}</span>
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── Application Overview (8-card grid) ───────────────── */}
        <Section id="overview" padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="mb-8">
                <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Application Areas</span>
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mt-2 text-white">
                  Eight Ways CV is Changing the Game
                </h2>
                <p className="text-text-secondary mt-2 max-w-2xl">
                  Click any card to jump to its detailed section below.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {APP_AREAS.map((area, i) => (
                <ScrollReveal key={area.id} delay={i * 60}>
                  <Card
                    variant="hover"
                    padding="lg"
                    className="h-full group relative overflow-hidden cursor-pointer"
                    onClick={() => scrollToSection(area.id)}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-burnt-orange/15 flex items-center justify-center text-burnt-orange text-xs font-bold">
                        {i + 1}
                      </span>
                      <Badge variant="secondary" size="sm">
                        {area.companies.filter((c) => c.maturity === 'Production').length > 0 ? 'Active' : 'Emerging'}
                      </Badge>
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-1">{area.title}</h3>
                    <p className="text-text-tertiary text-xs leading-relaxed">{area.tagline}</p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {area.sports.slice(0, 3).map((sport) => (
                        <span key={sport} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted font-mono">
                          {sport}
                        </span>
                      ))}
                      {area.sports.length > 3 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted font-mono">
                          +{area.sports.length - 3}
                        </span>
                      )}
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── Detailed Application Sections ─────────────────────── */}
        {APP_AREAS.map((area, i) => (
          <Section
            key={area.id}
            id={area.id}
            padding="lg"
            background={i % 2 === 0 ? 'midnight' : 'charcoal'}
            borderTop
          >
            <Container>
              <ScrollReveal>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-burnt-orange/15 flex items-center justify-center text-burnt-orange text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">
                    Application Area {i + 1} of {APP_AREAS.length}
                  </span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display text-white mb-1">
                  {area.title}
                </h2>
                <p className="text-text-secondary italic mb-6">{area.tagline}</p>
              </ScrollReveal>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                  <ScrollReveal delay={100}>
                    <Card variant="default" padding="lg">
                      <p className="text-text-secondary leading-relaxed">{area.description}</p>
                    </Card>
                  </ScrollReveal>

                  {/* Companies */}
                  <ScrollReveal delay={150}>
                    <Card variant="default" padding="lg">
                      <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-burnt-orange" />
                        Key Companies
                      </h3>
                      <div className="space-y-2">
                        {area.companies.map((company) => (
                          <div key={company.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-white text-sm">{company.name}</span>
                            <Badge
                              variant={company.maturity === 'Production' ? 'success' : company.maturity === 'Growth' ? 'warning' : 'secondary'}
                              size="sm"
                            >
                              {company.maturity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </ScrollReveal>

                  {/* BSI Take */}
                  <ScrollReveal delay={200}>
                    <div className="bg-burnt-orange/5 border-l-2 border-burnt-orange rounded-r-lg p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">BSI Take</span>
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed">{area.bsiTake}</p>
                    </div>
                  </ScrollReveal>

                  {/* Strike zone model on the officiating section */}
                  {area.id === 'officiating' && (
                    <ScrollReveal delay={250}>
                      <Card variant="default" padding="lg">
                        <h3 className="text-white font-semibold text-sm mb-4">ABS Strike Zone Model</h3>
                        <StrikeZoneModel compact />
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <Link href="/mlb/abs" className="text-burnt-orange text-sm font-semibold hover:underline">
                            Full ABS Challenge Tracker &rarr;
                          </Link>
                        </div>
                      </Card>
                    </ScrollReveal>
                  )}
                </div>

                {/* Sidebar stats */}
                <div className="space-y-4">
                  <ScrollReveal delay={120}>
                    <Card variant="default" padding="none" className="overflow-hidden">
                      <div className="bg-graphite px-4 py-3 border-b border-white/5">
                        <h4 className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">Key Numbers</h4>
                      </div>
                      <div className="p-4 space-y-4">
                        {area.stats.map((stat) => (
                          <div key={stat.label} className="flex justify-between items-baseline">
                            <span className="text-text-tertiary text-xs">{stat.label}</span>
                            <span className="text-white font-mono text-sm font-bold">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </ScrollReveal>

                  <ScrollReveal delay={160}>
                    <Card variant="default" padding="none" className="overflow-hidden">
                      <div className="bg-graphite px-4 py-3 border-b border-white/5">
                        <h4 className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">BSI Sports</h4>
                      </div>
                      <div className="p-4 flex gap-2 flex-wrap">
                        {area.sports.map((sport) => (
                          <Badge key={sport} variant="primary" size="sm">{sport}</Badge>
                        ))}
                      </div>
                    </Card>
                  </ScrollReveal>
                </div>
              </div>
            </Container>
          </Section>
        ))}

        {/* ── Sony CV Empire ───────────────────────────────────── */}
        <Section id="sony" padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Industry Analysis</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mt-2 text-white mb-2">
                The Sony CV Empire
              </h2>
              <p className="text-text-secondary max-w-2xl mb-8">
                Sony has quietly assembled the most comprehensive computer vision stack in sports
                through five strategic acquisitions spanning 14 years. They now own every layer:
                data capture, biomechanics, wearables, visualization, and distribution.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <Card variant="default" padding="lg">
                <SonyEmpireTimeline />
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── College Sports Gap ──────────────────────────────── */}
        <Section id="college-gap" padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Strategic Section</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mt-2 text-white mb-2">
                The College Sports Gap
              </h2>
              <p className="text-text-secondary max-w-2xl mb-8">
                Pro leagues have near-complete tracking infrastructure. College sports — where BSI
                focuses — have massive gaps. This comparison shows exactly where the coverage drops off.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <Card variant="default" padding="lg">
                <CollegeSportsGap />
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Tech Maturity Map ───────────────────────────────── */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Interactive Map</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mt-2 text-white mb-2">
                Technology Maturity Map
              </h2>
              <p className="text-text-secondary max-w-2xl mb-8">
                Filter by sport and maturity level to see who&apos;s building what — and how far along they are.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <Card variant="default" padding="lg">
                <TechMaturityMap />
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Open Source Toolbox ──────────────────────────────── */}
        <Section id="open-source" padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Technical Reference</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mt-2 text-white mb-2">
                Open Source Toolbox
              </h2>
              <p className="text-text-secondary max-w-2xl mb-8">
                Production-grade open-source tools for sports computer vision. License matters —
                AGPL means you can&apos;t use it commercially without releasing your own code.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <Card variant="default" padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-graphite border-b border-border-subtle">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Tool</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Role</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">License</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Org</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden md:table-cell">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {OPEN_SOURCE_TOOLS.map((tool) => (
                        <tr key={tool.name} className="border-b border-border-subtle hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 text-white font-semibold text-sm font-mono">{tool.name}</td>
                          <td className="py-3 px-4 text-text-secondary text-sm">{tool.role}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={tool.license.includes('AGPL') ? 'warning' : 'success'}
                              size="sm"
                            >
                              {tool.license}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-text-tertiary text-sm">{tool.org}</td>
                          <td className="py-3 px-4 text-text-tertiary text-xs hidden md:table-cell">{tool.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="mt-6 bg-yellow-500/5 border border-yellow-500/15 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1 h-4 bg-yellow-500 rounded-full" />
                  <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">Legal Note</span>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Processing broadcast video without league authorization likely violates copyright and
                  broadcast agreements, regardless of what the model license allows. Open-source tools
                  are technically capable, but the legal right to process the video is a separate question.
                  This applies to any broadcast-derived tracking system.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Cross-Links / Tools ──────────────────────────────── */}
        <Section id="tools" padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Explore More</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mt-2 text-white mb-8">
                Go Deeper
              </h2>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-6">
              <ScrollReveal delay={60}>
                <Link href="/mlb/abs" className="block group">
                  <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Badge variant="success" size="sm" className="mb-3">Live Tracker</Badge>
                    <h3 className="text-white font-semibold mb-2">ABS Robot Umpire Tracker</h3>
                    <p className="text-text-tertiary text-sm mb-4">
                      Challenge rates, success by role, umpire accuracy comparisons — the most tracked
                      CV deployment in baseball.
                    </p>
                    <span className="text-burnt-orange text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                      View Tracker
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Card>
                </Link>
              </ScrollReveal>

              <ScrollReveal delay={120}>
                <Link href="/vision-AI-Intelligence" className="block group">
                  <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Badge variant="info" size="sm" className="mb-3">Interactive Tool</Badge>
                    <h3 className="text-white font-semibold mb-2">Real-Time Pose Estimation</h3>
                    <p className="text-text-tertiary text-sm mb-4">
                      Try TensorFlow.js pose estimation in your browser — the same class of technology
                      that powers Hawk-Eye skeletal tracking.
                    </p>
                    <span className="text-burnt-orange text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                      Launch Tool
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Card>
                </Link>
              </ScrollReveal>

              <ScrollReveal delay={180}>
                <Link href="/college-baseball" className="block group">
                  <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Badge variant="primary" size="sm" className="mb-3">BSI Flagship</Badge>
                    <h3 className="text-white font-semibold mb-2">College Baseball Hub</h3>
                    <p className="text-text-tertiary text-sm mb-4">
                      Where the technology gap is most visible — and where BSI covers what the major
                      platforms skip.
                    </p>
                    <span className="text-burnt-orange text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                      Explore
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Card>
                </Link>
              </ScrollReveal>
            </div>

            {/* Attribution */}
            <div className="mt-12 pt-6 border-t border-white/5 text-center">
              <p className="text-text-muted text-xs">
                Research compiled by Blaze Sports Intel. Data from public sources, league announcements,
                and company documentation. Last updated February 2026.
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
