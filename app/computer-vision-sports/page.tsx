'use client';

/**
 * Computer Vision in Sports - Strategic Innovations Page
 *
 * Comprehensive editorial page showcasing how computer vision is transforming
 * sports across player tracking, biomechanics, injury prediction, officiating,
 * fan engagement, and scouting. Built with real industry data and BSI-specific
 * strategic context for MLB, NFL, NBA, and college sports.
 *
 * Accessibility: WCAG AA compliant with keyboard navigation and ARIA labels.
 */

import React, { useState } from 'react';
import {
  Eye,
  Activity,
  Target,
  Users,
  Zap,
  TrendingUp,
  Camera,
  Monitor,
  Cpu,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shield,
  Heart,
  Crosshair,
  Layers,
  Brain,
  Video,
  Radio,
  Tv,
  Search,
  Radar,
} from 'lucide-react';
import { Container, Section } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

/* ------------------------------------------------------------------ */
/*  Data & Types                                                       */
/* ------------------------------------------------------------------ */

interface Innovation {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  summary: string;
  details: string[];
  keyStats: { label: string; value: string }[];
  companies: string[];
  sports: string[];
  impact: 'High' | 'Very High' | 'Transformative';
  maturity: 'Emerging' | 'Growing' | 'Production';
}

interface CategoryTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const categories: CategoryTab[] = [
  { id: 'all', label: 'All', icon: <Layers className="w-4 h-4" /> },
  { id: 'tracking', label: 'Tracking', icon: <Crosshair className="w-4 h-4" /> },
  { id: 'biomechanics', label: 'Biomechanics', icon: <Activity className="w-4 h-4" /> },
  { id: 'safety', label: 'Safety', icon: <Shield className="w-4 h-4" /> },
  { id: 'officiating', label: 'Officiating', icon: <Target className="w-4 h-4" /> },
  { id: 'fan-experience', label: 'Fan Experience', icon: <Users className="w-4 h-4" /> },
  { id: 'scouting', label: 'Scouting', icon: <Search className="w-4 h-4" /> },
];

const innovations: Innovation[] = [
  {
    id: 'statcast-optical-tracking',
    title: 'MLB Statcast: Full-Stadium Optical Tracking',
    category: 'tracking',
    icon: <Camera className="w-6 h-6" />,
    summary:
      'Hawk-Eye\'s 12-camera system per ballpark captures ball and player positions at 50-100 fps with sub-inch accuracy. The system tracks 18 skeletal keypoints per player at 30 fps, generating up to 7 TB of data per game on Google Cloud.',
    details: [
      'Bat tracking (swing path, attack angle) is now operational across all 30 MLB parks',
      'Baseball Savant provides the most open public data portal in any professional sport',
      'ESPN\'s Statcast Edition altcast uses the data for real-time broadcast overlays',
      'Spin rate, launch angle, exit velocity, and sprint speed derived entirely from optical CV',
      'Data pipeline feeds Sportradar for third-party integration including platforms like BSI',
    ],
    keyStats: [
      { label: 'Cameras per park', value: '12' },
      { label: 'Accuracy', value: '\u00b10.1 in' },
      { label: 'Data per game', value: '7 TB' },
      { label: 'Keypoints tracked', value: '18' },
    ],
    companies: ['Hawk-Eye (Sony)', 'Google Cloud', 'Sportradar'],
    sports: ['MLB', 'College Baseball'],
    impact: 'Transformative',
    maturity: 'Production',
  },
  {
    id: 'nba-skeletal-tracking',
    title: 'NBA 3D Skeletal Tracking',
    category: 'tracking',
    icon: <Eye className="w-6 h-6" />,
    summary:
      'Sony\'s Hawk-Eye deployed 12 cameras per arena starting in 2023-24, capturing 29 skeletal keypoints per player in real-time 3D. Second Spectrum (Genius Sports, $200M acquisition) provides the analytics layer powering play-type classification.',
    details: [
      '29 keypoints per player is a leap from previous 2D positional data to full body mechanics',
      'Second Spectrum\'s Dragon platform processes billions of data points per game including hand positioning',
      'Play-type classification automatically labels pick-and-roll, isolation, spot-up, and post-up possessions',
      'Broadcast augmentation adds AR overlays, shot probability arcs, and defensive coverage visualizations',
      'Data powers both coaching tools and fan-facing products like the NBA App',
    ],
    keyStats: [
      { label: 'Keypoints', value: '29' },
      { label: 'Cameras', value: '12/arena' },
      { label: 'Analytics', value: 'Real-time' },
      { label: 'Acquisition', value: '$200M' },
    ],
    companies: ['Hawk-Eye (Sony)', 'Second Spectrum (Genius Sports)'],
    sports: ['NBA'],
    impact: 'Transformative',
    maturity: 'Production',
  },
  {
    id: 'broadcast-feed-tracking',
    title: 'Broadcast-Feed CV: Tracking Without Hardware',
    category: 'tracking',
    icon: <Tv className="w-6 h-6" />,
    summary:
      'SkillCorner uses temporal and graph-based neural networks to extract XY positions for all 22 players from a single camera feed, even extrapolating off-screen player positions. Their $60M funding round (Dec 2025) targets North American college sports expansion.',
    details: [
      'No stadium hardware required -- works from standard broadcast or All-22 film',
      'Extracts sprint speed, acceleration, separation, total distance from any single-camera feed',
      'NBA is an investor, signaling league-level confidence in broadcast-derived tracking quality',
      'College sports are the primary expansion target -- filling the gap where no league-wide tracking exists',
      'Sportlogiq (acquired by Teamworks, Jan 2026) offers competing patented broadcast-feed CV with 97% NHL adoption',
    ],
    keyStats: [
      { label: 'Funding', value: '$60M' },
      { label: 'Players tracked', value: '22' },
      { label: 'Hardware needed', value: 'None' },
      { label: 'NHL adoption', value: '97%' },
    ],
    companies: ['SkillCorner', 'Sportlogiq (Teamworks)', 'Hudl IQ'],
    sports: ['College Football', 'College Baseball', 'Soccer', 'NFL'],
    impact: 'Transformative',
    maturity: 'Growing',
  },
  {
    id: 'kinatrax-biomechanics',
    title: 'Markerless Motion Capture for Baseball Biomechanics',
    category: 'biomechanics',
    icon: <Activity className="w-6 h-6" />,
    summary:
      'KinaTrax (acquired by Sony, Oct 2024) leads in-game markerless motion capture. Multi-camera systems at 300-600 fps reconstruct 3D kinematic models producing 225+ discrete pitching metrics per throw, including elbow torque and hip-shoulder separation.',
    details: [
      'Over 100 systems deployed across MLB, MiLB, and 7 NCAA programs',
      'Generates approximately 48,000 biomechanical data files per MLB team per year',
      'Metrics include arm speed, trunk rotation, stride length, and release point consistency',
      'Expanding into NBA basketball biomechanics at the Banner Health High Performance Center',
      'Part of Sony\'s full-stack sports CV ecosystem alongside Hawk-Eye and Beyond Sports',
    ],
    keyStats: [
      { label: 'Metrics per pitch', value: '225+' },
      { label: 'Frame rate', value: '300-600 fps' },
      { label: 'Systems deployed', value: '100+' },
      { label: 'NCAA programs', value: '7' },
    ],
    companies: ['KinaTrax (Sony)', 'Driveline Baseball'],
    sports: ['MLB', 'College Baseball', 'NBA'],
    impact: 'Transformative',
    maturity: 'Production',
  },
  {
    id: 'pitchernet-smartphone',
    title: 'PitcherNet: 3D Biomechanics from Smartphone Video',
    category: 'biomechanics',
    icon: <Brain className="w-6 h-6" />,
    summary:
      'Developed by the University of Waterloo with the Baltimore Orioles and presented at CVPR 2024, PitcherNet extracts 3D biomechanical models from standard broadcast or smartphone video -- no specialized cameras needed.',
    details: [
      'Democratizes biomechanical analysis for programs that cannot afford KinaTrax ($500K+ installations)',
      'Scouts sitting in bleachers with phones can capture draft-relevant biomechanical data',
      'Estimates pitch velocity and arm mechanics from a single viewpoint',
      'Driveline Baseball has complementary CV-based bat tracking using YOLOv8 object detection (patent filed 2024)',
      'Driveline\'s OpenBiomechanics Project releases open-source biomechanics data for research',
    ],
    keyStats: [
      { label: 'Camera needed', value: 'Smartphone' },
      { label: 'Venue', value: 'CVPR 2024' },
      { label: 'Cost', value: 'Near zero' },
      { label: 'Detection model', value: 'YOLOv8' },
    ],
    companies: ['U of Waterloo', 'Baltimore Orioles', 'Driveline Baseball'],
    sports: ['MLB', 'College Baseball'],
    impact: 'Very High',
    maturity: 'Emerging',
  },
  {
    id: 'nfl-digital-athlete',
    title: 'NFL Digital Athlete: CV-Powered Injury Prevention',
    category: 'safety',
    icon: <Shield className="w-6 h-6" />,
    summary:
      'The most ambitious CV-based injury prevention system in sports. 38 cameras per stadium capture 5K video at 60 fps, detecting helmet impacts 83x faster than manual review. Results: 17% reduction in concussions in 2024 and 700 fewer injury-related game absences in 2023.',
    details: [
      'Available to all 32 NFL clubs since 2023, running on AWS infrastructure',
      'Data-informed rule changes include the Dynamic Kickoff format and hip-drop tackle ban',
      '2024 saw the fewest concussions on record in the NFL',
      'Combines optical CV data with RFID tracking and equipment sensor data',
      'Framework applicable to building play-level risk analysis features for college football',
    ],
    keyStats: [
      { label: 'Cameras/stadium', value: '38' },
      { label: 'Resolution', value: '5K @ 60fps' },
      { label: 'Impact detection', value: '83x faster' },
      { label: 'Concussion drop', value: '17%' },
    ],
    companies: ['NFL', 'AWS', 'Zebra Technologies'],
    sports: ['NFL', 'NCAA Football'],
    impact: 'Transformative',
    maturity: 'Production',
  },
  {
    id: 'ucl-prediction',
    title: 'UCL Injury Prediction from In-Game Motion Capture',
    category: 'safety',
    icon: <Heart className="w-6 h-6" />,
    summary:
      'A 2025 prospective study of 305 MLB pitchers confirmed that high elbow varus torque -- measurable via markerless CV systems like KinaTrax -- is significantly associated with UCL surgery risk. Pitch-by-pitch monitoring detects mechanical drift that signals fatigue.',
    details: [
      'Prospective validation (Fleisig et al., Orthopaedic Journal of Sports Medicine, 2025) endorsed in-game motion capture',
      'KinaTrax generates ~48,000 biomechanical files per team per year for longitudinal monitoring',
      'Mechanical drift analysis detects fatigue-related form changes before injury occurs',
      'Zone7 AI integrates CV-derived data for daily injury risk predictions at 72.4% accuracy across 11 soccer teams',
      'ACL injury detection from broadcast video achieved AUC-ROC of 0.88 (Schulc et al., 2024)',
    ],
    keyStats: [
      { label: 'Study size', value: '305 pitchers' },
      { label: 'Zone7 accuracy', value: '72.4%' },
      { label: 'ACL detection', value: '0.88 AUC' },
      { label: 'Files/team/year', value: '48K' },
    ],
    companies: ['KinaTrax', 'Zone7 AI'],
    sports: ['MLB', 'College Baseball', 'NBA', 'Soccer'],
    impact: 'Transformative',
    maturity: 'Production',
  },
  {
    id: 'automated-ball-strike',
    title: 'Robot Umpires: Automated Ball-Strike System (ABS)',
    category: 'officiating',
    icon: <Target className="w-6 h-6" />,
    summary:
      'Approved for the 2026 MLB season, ABS uses Hawk-Eye pose-tracking cameras to generate batter-specific strike zones. Each team gets 2 challenges per game (~17 seconds each). During 2025 spring training, 52.2% of challenges were successful.',
    details: [
      'Human umpires still make every initial call -- ABS operates via a challenge system, not full automation',
      'Challenge success rates: catchers 56%, hitters 50%, pitchers 41%',
      'Average of 4.1 challenges per game during testing; current human umpire accuracy is ~94%',
      'Progressively tested since 2019 (Atlantic League) through Triple-A and spring training',
      'South Korea\'s KBO League already uses full ABS without challenges',
    ],
    keyStats: [
      { label: 'Challenges/game', value: '4.1 avg' },
      { label: 'Success rate', value: '52.2%' },
      { label: 'Human accuracy', value: '~94%' },
      { label: 'Challenge time', value: '~17 sec' },
    ],
    companies: ['Hawk-Eye (Sony)', 'T-Mobile 5G', 'MLB'],
    sports: ['MLB'],
    impact: 'Transformative',
    maturity: 'Production',
  },
  {
    id: 'fifa-offside',
    title: 'Semi-Automated Offside & Officiating Technology',
    category: 'officiating',
    icon: <Radar className="w-6 h-6" />,
    summary:
      'FIFA\'s Semi-Automated Offside Technology tracks limb positions with centimeter accuracy, now deployed in the Premier League via Genius Sports\' GeniusIQ using ~30 iPhones per stadium. The NBA is working on automated goaltending and out-of-bounds calls.',
    details: [
      'Premier League deployment uses approximately 30 iPhones per stadium for tracking',
      'Goal-line technology determines ball position with sub-centimeter precision across multiple camera angles',
      'NBA\'s automated officiating group targets goaltending, out-of-bounds, and 2-vs-3-point shot classification',
      'NFL exploring automated ball spotting and illegal formation detection (described as "super aspirational")',
      'Decision latency under 1 second enables real-time assistance without disrupting game flow',
    ],
    keyStats: [
      { label: 'Cameras', value: '~30/stadium' },
      { label: 'Precision', value: 'Sub-cm' },
      { label: 'Latency', value: '<1 second' },
      { label: 'Platform', value: 'GeniusIQ' },
    ],
    companies: ['FIFA', 'Genius Sports', 'NBA', 'NFL'],
    sports: ['Soccer', 'NBA', 'NFL'],
    impact: 'Very High',
    maturity: 'Production',
  },
  {
    id: 'wsc-highlights',
    title: 'WSC Sports: 10.2 Million Automated Highlights Per Year',
    category: 'fan-experience',
    icon: <Video className="w-6 h-6" />,
    summary:
      'WSC Sports produced 10.2 million highlights in 2024 -- one every 3.1 seconds -- across 530+ clients including the NBA, NFL, and ESPN. Their GenAI division generates multilingual AI voice-over narration with 75%+ completion rates.',
    details: [
      'NBA saw a 700% increase in video views through personalized highlight stories in the NBA App',
      'GenAI division (launched 2024) produces narrated highlights in French, Portuguese, and Spanish',
      'Temporal action detection identifies events with precise start/end timestamps from continuous video',
      'Excitement scoring ranks moments by crowd noise, player celebration, and game context',
      'Personalized highlight reels generated for individual players, teams, or fan preferences',
    ],
    keyStats: [
      { label: 'Highlights/year', value: '10.2M' },
      { label: 'Frequency', value: '1 per 3.1s' },
      { label: 'Clients', value: '530+' },
      { label: 'NBA view increase', value: '700%' },
    ],
    companies: ['WSC Sports', 'NBA', 'NFL', 'ESPN'],
    sports: ['All Sports'],
    impact: 'Very High',
    maturity: 'Production',
  },
  {
    id: 'immersive-broadcast',
    title: 'Virtual Replays & AR-Enhanced Broadcasting',
    category: 'fan-experience',
    icon: <Monitor className="w-6 h-6" />,
    summary:
      'Beyond Sports (Sony) converts tracking data into animated virtual replays, powering the NFL\'s Emmy-winning "Toy Story Funday Football" and ESPN\'s InsightCast 3D replays within 15-20 seconds of live play.',
    details: [
      'NFL\'s "Toy Story Funday Football" won 3 Sports Emmys; "The Simpsons Funday Football" followed in Dec 2024',
      'First animated NBA game "Dunk the Halls" broadcast on Christmas 2024',
      'ESPN InsightCast provides virtual 3D replays from any angle within 15-20 seconds of play',
      'Genius Sports\' BetVision overlays live stats and odds with "Touch-to-Bet" -- tap a player to access markets',
      'Sportradar\'s 4Sight (120 fps single-camera CV) reported 188% increase in betting sessions per event',
    ],
    keyStats: [
      { label: 'Replay latency', value: '15-20 sec' },
      { label: 'Sports Emmys', value: '3' },
      { label: 'Betting boost', value: '188%' },
      { label: '4Sight fps', value: '120' },
    ],
    companies: ['Beyond Sports (Sony)', 'Genius Sports', 'Sportradar', 'ESPN'],
    sports: ['NFL', 'NBA', 'MLB', 'Soccer'],
    impact: 'Very High',
    maturity: 'Growing',
  },
  {
    id: 'automated-production',
    title: 'AI-Directed Camera Systems for College Sports',
    category: 'fan-experience',
    icon: <Camera className="w-6 h-6" />,
    summary:
      'Pixellot has 30,000+ AI-directed camera systems in 10,000+ U.S. high schools, producing multi-camera broadcasts with automated scorebugs and highlights -- no crew needed. These systems create a content pipeline for college programs with zero previous broadcast coverage.',
    details: [
      'AI-directed multi-camera production requires no human camera operators or producers',
      'Automated scorebugs, graphics, and highlight generation built into the camera system',
      'Hudl Focus and Veo (~$1,200 + subscription) provide portable, affordable alternatives',
      'Creates new content sources for platforms like BSI where broadcast footage was previously unavailable',
      'Particularly impactful for college baseball and mid-major programs with thin media coverage',
    ],
    keyStats: [
      { label: 'Pixellot systems', value: '30,000+' },
      { label: 'U.S. schools', value: '10,000+' },
      { label: 'Veo cost', value: '~$1,200' },
      { label: 'Crew needed', value: 'None' },
    ],
    companies: ['Pixellot', 'Hudl Focus', 'Veo'],
    sports: ['College Baseball', 'College Football', 'High School Sports'],
    impact: 'High',
    maturity: 'Production',
  },
  {
    id: 'synergy-scouting',
    title: 'Synergy Sports: Scouting at Scale for College Baseball',
    category: 'scouting',
    icon: <Search className="w-6 h-6" />,
    summary:
      'Synergy Sports (now Sportradar) is used by every NBA, WNBA, G-League, and D1 basketball team. Critically, it expanded into baseball in 2017 and now covers ~90% of D1 baseball programs -- the largest structured college baseball data source.',
    details: [
      'Every possession tagged by play type and linked to video across D1 basketball and baseball',
      'Rapsodo units ($3,000-$5,000 vs. TrackMan\'s $20,000+) democratize pitch/hit metrics for mid-tier programs',
      'Rapsodo partnered with ESPN for the 2024 MLB Draft, integrating collegiate training data into coverage',
      'Exit velocity accuracy of \u00b10.3 mph makes Rapsodo data draft-relevant for professional scouting',
      'Florida, Wake Forest, and Tennessee among collegiate adopters of affordable pitch tracking',
    ],
    keyStats: [
      { label: 'D1 BB coverage', value: '~90%' },
      { label: 'Rapsodo cost', value: '$3-5K' },
      { label: 'TrackMan cost', value: '$20K+' },
      { label: 'Exit velo accuracy', value: '\u00b10.3 mph' },
    ],
    companies: ['Synergy (Sportradar)', 'Rapsodo', 'TrackMan'],
    sports: ['College Baseball', 'College Basketball', 'MLB Draft'],
    impact: 'Transformative',
    maturity: 'Production',
  },
  {
    id: 'broadcast-scouting',
    title: 'Broadcast-Derived Scouting: No Hardware Required',
    category: 'scouting',
    icon: <Brain className="w-6 h-6" />,
    summary:
      'The convergence of SkillCorner, Hudl IQ, and PitcherNet means structured scouting data can be extracted for thousands of college athletes from standard game footage -- no hardware deployment needed.',
    details: [
      'SkillCorner extracts sprint speed, acceleration, separation, and get-off time from All-22 broadcast feeds',
      'Hudl IQ provides formation-level classification and route trees from standard game film with 10x more data than competitors',
      'PitcherNet estimates pitch velocity and biomechanics from a scout\'s smartphone video',
      'HomeCourt (NBA partner, investors include Mark Cuban and Steve Nash) tracks shooting mechanics via iPhone CV',
      'MLS NEXT deployed aiScout for smartphone-based virtual trials reaching ~45,000 athletes',
    ],
    keyStats: [
      { label: 'SkillCorner funding', value: '$60M' },
      { label: 'Hudl users', value: '4.3M+' },
      { label: 'aiScout athletes', value: '45,000' },
      { label: 'Hardware cost', value: '$0' },
    ],
    companies: ['SkillCorner', 'Hudl IQ', 'HomeCourt', 'aiScout'],
    sports: ['College Football', 'College Baseball', 'College Basketball'],
    impact: 'Transformative',
    maturity: 'Growing',
  },
  {
    id: 'pre-snap-prediction',
    title: 'Real-Time Play Prediction & Tactical AI',
    category: 'scouting',
    icon: <Radar className="w-6 h-6" />,
    summary:
      'ESPN\'s MNF Playbook uses Adrenaline\'s TruPlay AI engine (370,000+ NFL play database) to overlay real-time run-pass probabilities and expected target distributions before the snap. DeepMind\'s TacticAI generates AI-driven tactical recommendations for set pieces.',
    details: [
      'Pre-snap play prediction overlays run-pass probability dynamically on broadcast in real time',
      'Database of 370,000+ NFL plays trains classification models for formation recognition',
      'DeepMind\'s TacticAI (developed with Liverpool FC) analyzes and recommends set-piece tactics',
      'Expected target distribution shows which receivers are most likely to be targeted based on defensive alignment',
      'Moving from research to broadcast: ESPN\'s Dec 2025 MNF deployment is a milestone',
    ],
    keyStats: [
      { label: 'Play database', value: '370K+' },
      { label: 'Prediction type', value: 'Pre-snap' },
      { label: 'Partner', value: 'ESPN MNF' },
      { label: 'AI partner', value: 'DeepMind' },
    ],
    companies: ['Adrenaline (TruPlay)', 'ESPN', 'DeepMind', 'Liverpool FC'],
    sports: ['NFL', 'Soccer'],
    impact: 'Very High',
    maturity: 'Emerging',
  },
];

/* ------------------------------------------------------------------ */
/*  Injury Prevention Table Data                                       */
/* ------------------------------------------------------------------ */

const injuryTechTable = [
  { tech: 'NFL Digital Athlete', predicts: 'Concussion risk, impact severity', result: '17% concussion reduction', sports: 'NFL, NCAA Football', status: 'Production' },
  { tech: 'KinaTrax Biomechanics', predicts: 'UCL stress, mechanical fatigue', result: 'Prospective validation (2025)', sports: 'MLB, College Baseball', status: 'Production' },
  { tech: 'Zone7 AI', predicts: 'Multi-type injury, 1-7 day horizon', result: '72.4% accuracy', sports: 'NFL, NBA, MLB', status: 'Production' },
  { tech: 'ACL Detection (Video)', predicts: 'Knee injury from broadcast feeds', result: 'AUC-ROC 0.88', sports: 'All sports', status: 'Research' },
];

/* ------------------------------------------------------------------ */
/*  Open-Source Toolbox Data                                           */
/* ------------------------------------------------------------------ */

const toolboxItems = [
  { component: 'Detection', tool: 'RF-DETR', license: 'Apache 2.0', why: 'SOTA accuracy (60+ mAP on COCO), fine-tuning friendly, no copyleft' },
  { component: 'Pose Estimation', tool: 'RTMPose (MMPose)', license: 'Apache 2.0', why: 'Best speed/accuracy tradeoff for sports' },
  { component: 'Tracking', tool: 'ByteTrack', license: 'Apache 2.0', why: '84.0 HOTA on SoccerNet, handles sports occlusion' },
  { component: 'Segmentation', tool: 'SAM 2', license: 'Apache 2.0', why: 'Annotation acceleration, player isolation' },
  { component: 'Pipeline', tool: 'Supervision + OpenCV', license: 'MIT / Apache 2.0', why: 'Industry-standard glue code, 20K+ GitHub stars' },
  { component: 'Structured Data', tool: 'Sportradar API', license: 'Commercial', why: 'Covers all BSI sports (Statcast, NFL, NBA, NCAA)' },
];

/* ------------------------------------------------------------------ */
/*  Sub-Components                                                     */
/* ------------------------------------------------------------------ */

function ImpactBadge({ impact }: { impact: Innovation['impact'] }) {
  const variant = impact === 'Transformative' ? 'accent' : impact === 'Very High' ? 'success' : 'info';
  return <Badge variant={variant} size="sm">{impact} Impact</Badge>;
}

function MaturityBadge({ maturity }: { maturity: Innovation['maturity'] }) {
  const variant = maturity === 'Production' ? 'success' : maturity === 'Growing' ? 'warning' : 'outline';
  return <Badge variant={variant} size="sm">{maturity}</Badge>;
}

function InnovationCard({ innovation }: { innovation: Innovation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="hover" padding="lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-[#BF5700]/20 text-[#BF5700] flex-shrink-0">
              {innovation.icon}
            </div>
            <CardTitle className="text-lg leading-tight">{innovation.title}</CardTitle>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <ImpactBadge impact={innovation.impact} />
            <MaturityBadge maturity={innovation.maturity} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-white/70 mb-4 leading-relaxed">{innovation.summary}</p>

        {/* Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {innovation.keyStats.map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-lg px-3 py-2 text-center border border-white/5">
              <p className="text-sm font-bold text-[#BF5700]">{stat.value}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Sports & Companies */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {innovation.sports.map((sport) => (
            <span
              key={sport}
              className="px-2 py-0.5 text-xs rounded-md bg-[#BF5700]/10 text-[#BF5700]/80 border border-[#BF5700]/20"
            >
              {sport}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {innovation.companies.map((company) => (
            <span
              key={company}
              className="px-2 py-0.5 text-xs rounded-md bg-white/5 text-white/40 border border-white/10"
            >
              {company}
            </span>
          ))}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm text-[#BF5700] hover:text-[#ff6b35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF5700] rounded px-1"
          aria-expanded={expanded}
          aria-controls={`details-${innovation.id}`}
        >
          {expanded ? 'Show less' : 'Deep dive'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <ul
            id={`details-${innovation.id}`}
            className="mt-4 space-y-2"
            role="list"
          >
            {innovation.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                <Zap className="w-3 h-3 mt-1.5 text-[#fdb913] flex-shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats Bar                                                          */
/* ------------------------------------------------------------------ */

const heroStats = [
  { label: 'Technologies Profiled', value: '15', icon: <Cpu className="w-5 h-5" /> },
  { label: 'BSI Sports Covered', value: '6', icon: <Activity className="w-5 h-5" /> },
  { label: 'Companies Tracked', value: '30+', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Data Points Cited', value: '50+', icon: <BarChart3 className="w-5 h-5" /> },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ComputerVisionSportsPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered =
    activeCategory === 'all'
      ? innovations
      : innovations.filter((i) => i.category === activeCategory);

  return (
    <>
      <main id="main-content">
        {/* Hero */}
        <Section padding="xl" className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#BF5700]/10 rounded-full blur-[120px]" />
          </div>

          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="primary">Computer Vision</Badge>
                <Badge variant="outline">Strategic Survey 2026</Badge>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
                Computer Vision in{' '}
                <span className="text-[#BF5700]">Sports</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p className="text-lg md:text-xl text-white/60 max-w-3xl leading-relaxed mb-4">
                From MLB Statcast&apos;s 7 TB-per-game optical tracking to smartphone-based
                pitching biomechanics, computer vision is reshaping how athletes train,
                teams strategize, officials make calls, and fans experience sports.
              </p>
              <p className="text-base text-white/40 max-w-3xl leading-relaxed mb-8">
                While pro leagues are saturated with dedicated tracking infrastructure,{' '}
                <span className="text-white/70 font-medium">college sports remain a massive white space</span>{' '}
                where broadcast-derived CV and affordable camera systems can deliver
                pro-level analytics at a fraction of the cost.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300}>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" href="/vision-AI-Intelligence">
                  <Camera className="w-4 h-4 mr-2" />
                  Try Vision AI Coach
                </Button>
                <Button variant="secondary" href="#innovations">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Explore All Innovations
                </Button>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Stats Bar */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {heroStats.map((stat, i) => (
                <ScrollReveal key={stat.label} direction="up" delay={i * 80}>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <div className="text-[#BF5700]">{stat.icon}</div>
                    <div>
                      <p className="text-2xl font-bold font-display">{stat.value}</p>
                      <p className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Innovation Grid */}
        <Section padding="lg" borderTop id="innovations">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                Innovation Landscape
              </h2>
              <p className="text-white/50 mb-8 max-w-2xl">
                15 technologies reshaping sports across tracking, biomechanics, safety,
                officiating, fan experience, and scouting -- with real company data,
                accuracy metrics, and adoption numbers.
              </p>
            </ScrollReveal>

            {/* Category Tabs */}
            <ScrollReveal direction="up" delay={100}>
              <div
                className="flex flex-wrap gap-2 mb-8"
                role="tablist"
                aria-label="Filter innovations by category"
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    role="tab"
                    aria-selected={activeCategory === cat.id}
                    aria-controls="innovation-grid"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF5700] ${
                      activeCategory === cat.id
                        ? 'bg-[#BF5700] text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Grid */}
            <div
              id="innovation-grid"
              role="tabpanel"
              className="grid gap-6 lg:grid-cols-2"
            >
              {filtered.map((innovation, i) => (
                <ScrollReveal key={innovation.id} direction="up" delay={i * 60}>
                  <InnovationCard innovation={innovation} />
                </ScrollReveal>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-white/40">
                No innovations found in this category.
              </div>
            )}
          </Container>
        </Section>

        {/* Injury Prevention Comparison Table */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                Injury Prevention Technology Comparison
              </h2>
              <p className="text-white/50 mb-8 max-w-2xl">
                CV-powered systems moving injury management from reactive to predictive.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Technology</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">What It Predicts</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Result</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">BSI Sports</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {injuryTechTable.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{row.tech}</td>
                        <td className="py-3 px-4 text-white/60">{row.predicts}</td>
                        <td className="py-3 px-4 text-[#BF5700] font-medium">{row.result}</td>
                        <td className="py-3 px-4 text-white/60">{row.sports}</td>
                        <td className="py-3 px-4">
                          <Badge variant={row.status === 'Production' ? 'success' : 'outline'} size="sm">
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Technology Pipeline */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                The Technology Pipeline
              </h2>
              <p className="text-white/50 mb-10 max-w-2xl">
                How raw video becomes actionable sports intelligence.
              </p>
            </ScrollReveal>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Capture',
                  description:
                    'Hawk-Eye cameras (50-100 fps), broadcast feeds, Pixellot AI cameras (30,000+ systems), or smartphone cameras capture raw athletic performance.',
                  icon: <Camera className="w-6 h-6" />,
                },
                {
                  step: '02',
                  title: 'Detect & Track',
                  description:
                    'RF-DETR and YOLO detect players and equipment. MoveNet and RTMPose estimate 17-29 body keypoints. ByteTrack maintains identity across frames and occlusions.',
                  icon: <Eye className="w-6 h-6" />,
                },
                {
                  step: '03',
                  title: 'Analyze',
                  description:
                    'KinaTrax produces 225+ pitching metrics. SkillCorner extracts spatial data from broadcast. Zone7 computes daily injury risk. Play-type classifiers label every possession.',
                  icon: <Cpu className="w-6 h-6" />,
                },
                {
                  step: '04',
                  title: 'Deliver',
                  description:
                    'WSC Sports generates 10.2M highlights/year. Beyond Sports renders 3D replays in 15 seconds. BetVision overlays live odds. Coaches receive real-time biomechanical alerts.',
                  icon: <BarChart3 className="w-6 h-6" />,
                },
              ].map((item, i) => (
                <ScrollReveal key={item.step} direction="up" delay={i * 120}>
                  <Card variant="default" padding="lg" className="relative h-full">
                    <div className="text-[#BF5700]/30 text-5xl font-display font-bold absolute top-4 right-4">
                      {item.step}
                    </div>
                    <div className="p-2 rounded-lg bg-[#BF5700]/20 text-[#BF5700] w-fit mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {item.description}
                    </p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Open-Source Toolbox */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                The Startup-Accessible Toolbox
              </h2>
              <p className="text-white/50 mb-8 max-w-2xl">
                Production-grade, Apache 2.0-licensed open-source models that can power
                competitive CV features today.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Component</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Recommended Tool</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">License</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toolboxItems.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{row.component}</td>
                        <td className="py-3 px-4 text-[#BF5700] font-medium">{row.tool}</td>
                        <td className="py-3 px-4">
                          <Badge variant={row.license === 'Commercial' ? 'outline' : 'success'} size="sm">
                            {row.license}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-white/60">{row.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <Card variant="default" padding="md" className="mt-6">
                <div className="flex items-start gap-3">
                  <Radio className="w-5 h-5 text-[#fdb913] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/70">
                      <span className="text-white font-medium">Cost reality:</span>{' '}
                      Processing 100 hours of video monthly at 30 fps on cloud vision APIs
                      costs ~$16,200/month. A dedicated RTX 4090 GPU server amortizes to
                      $200-$400/month and runs YOLOv8x at 60+ fps on 1080p. Recommended path:
                      Roboflow for prototyping (free tier: 3 projects, 10K API calls/month),
                      then self-hosted GPU for production.
                    </p>
                  </div>
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Sony Ecosystem */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <ScrollReveal direction="up">
              <Card variant="elevated" padding="lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-[#BF5700]/20 text-[#BF5700]">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-display font-bold">
                    Sony&apos;s Sports CV Empire
                  </h2>
                </div>
                <p className="text-white/60 mb-6 leading-relaxed">
                  Sony has quietly assembled the most comprehensive sports computer vision
                  ecosystem in the world, creating a full-stack integration from optical
                  tracking to visualization:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  {[
                    { name: 'Hawk-Eye Innovations', role: 'Optical tracking (MLB, NBA, FIFA, tennis, cricket)' },
                    { name: 'KinaTrax', role: 'Markerless biomechanics (acquired Oct 2024)' },
                    { name: 'STATSports', role: 'GPS wearable tracking (acquired Oct 2025)' },
                    { name: 'Beyond Sports', role: 'Virtual replay visualization (3 Sports Emmys)' },
                    { name: 'Pulselive', role: 'Digital sports platform' },
                  ].map((item) => (
                    <div key={item.name} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-white/50 mt-1">{item.role}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/40">
                  Every BSI focus sport is touched by at least two Sony properties. The
                  integrated pipeline -- optical tracking to biomechanical analysis to
                  wearable biometrics to visualization -- sets the trajectory for the
                  entire industry.
                </p>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* CTA */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container size="narrow">
            <ScrollReveal direction="up">
              <Card variant="elevated" padding="lg" className="text-center">
                <div className="p-3 rounded-full bg-[#BF5700]/20 text-[#BF5700] w-fit mx-auto mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
                  Experience Vision AI Coaching
                </h2>
                <p className="text-white/60 mb-6 max-w-lg mx-auto">
                  BSI&apos;s built-in Vision AI tool uses TensorFlow.js MoveNet to
                  analyze your form in real time -- right in the browser, no
                  downloads required.
                </p>
                <Button variant="primary" href="/vision-AI-Intelligence">
                  Launch Vision AI Coach
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
