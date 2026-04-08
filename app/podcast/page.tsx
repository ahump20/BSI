'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';

type NotebookStatus = 'public' | 'private' | 'source-only' | 'feed';
type FeaturedTier = 'hero' | 'public-lane' | 'publish-next' | 'archive';
type FeedSourceStatus = 'live' | 'empty' | 'degraded';
type FeedLaneStatus = FeedSourceStatus | 'loading';

type CuratedEpisode = {
  id: string;
  title: string;
  slug: string;
  publishedDate: string;
  durationLabel: string;
  category: string;
  series: string;
  description: string;
  tags: string[];
  notebookStatus: Exclude<NotebookStatus, 'feed'>;
  featuredTier: FeaturedTier;
  sourceCount: number;
  selectionReason: string;
  sourceLabel: string;
  sourceUrl?: string;
  notebookUrl?: string;
  quote?: string;
};

type FeedApiEpisode = {
  title: string;
  description: string;
  pubDate: string | null;
  duration: string;
  audioUrl: string;
  link: string;
  showKey: string;
  showName: string;
  showHost: string;
  spotify?: string;
  apple?: string;
  category?: string;
};

type FeedApiResponse = {
  success: boolean;
  fromCache: boolean;
  episodes: FeedApiEpisode[];
  sources?: Array<{
    key: string;
    name: string;
    host: string;
    feedUrl: string;
    website?: string;
    status: FeedSourceStatus;
    totalEpisodes: number;
    message: string;
    channelTitle?: string;
    lastBuildDate?: string;
    spotify?: string;
    apple?: string;
    category?: string;
  }>;
  meta?: {
    fetchedAt?: string;
    fetched_at?: string;
    totalShows?: number;
    totalEpisodes?: number;
    responsiveShows?: number;
    liveShows?: number;
    emptyShows?: number;
    degradedShows?: number;
    laneStatus?: FeedSourceStatus;
    liveAudioAvailable?: boolean;
    statusMessage?: string;
    timezone?: string;
    cacheTTL?: string;
  };
};

type BrowseEpisode = {
  id: string;
  title: string;
  slug: string;
  publishedDate: string;
  durationLabel: string;
  category: string;
  series: string;
  description: string;
  tags: string[];
  notebookStatus: NotebookStatus;
  featuredTier: FeaturedTier;
  sourceCount: number;
  selectionReason: string;
  sourceLabel: string;
  sourceUrl?: string;
  notebookUrl?: string;
  quote?: string;
  originKind: 'curated' | 'feed';
  hasPlayableAudio: boolean;
  audioUrl?: string;
  spotifyUrl?: string;
  appleUrl?: string;
  hostLabel?: string;
};

const NOTEBOOKLM_HOME_URL = 'https://notebooklm.google.com/';
const MAX_FEED_EPISODES = 48;
const MAX_FEED_DESCRIPTION_LENGTH = 280;
const BLAZE_ASSET_URLS = {
  crest: '/brand/blaze-crest.png',
  portrait: '/brand/blaze-portrait.png',
  roundel: '/brand/blaze-roundel-tight.png',
  wordmark: '/brand/blaze-wordmark-wide.png',
};

const CURATED_EPISODES: CuratedEpisode[] = [
  {
    id: 'texas-longhorns-formula-2026',
    title: '2026 Texas Longhorns Baseball Formula',
    slug: '2026-texas-longhorns-baseball-formula',
    publishedDate: '2026-03-26',
    durationLabel: 'Audio Overview',
    category: 'Baseball',
    series: 'Weekly Intel',
    description:
      'Texas is 20-4, No. 2 nationally, No. 1 RPI heading into the Oklahoma series. Robbins hit 3 HR at Auburn. The bullpen hierarchy after SEC play. What the numbers say about Omaha odds.',
    tags: ['Texas', 'College Baseball', '2026', 'SEC', 'NotebookLM'],
    notebookStatus: 'public',
    featuredTier: 'hero',
    sourceCount: 29,
    selectionReason:
      'First weekly AI-generated audio overview for the 2026 season. 29 sources including UT Athletics, D1Baseball rankings, Houston Today, and BSI editorial.',
    sourceLabel: 'NotebookLM Audio Overview',
    notebookUrl: 'https://notebooklm.google.com/notebook/977a2568-a932-45ed-9625-a7e22c385e4c',
    quote: 'The formula isn\'t complicated. It\'s execution.',
  },
  {
    id: 'garrido-code-public',
    title: 'The Garrido Code Podcast Series Outline notebook',
    slug: 'the-garrido-code-podcast-series-outline-notebook',
    publishedDate: '2025-10-17',
    durationLabel: 'Notebook',
    category: 'Baseball',
    series: 'Public NotebookLM',
    description:
      'The only verified public NotebookLM podcast notebook in the current workspace. It is already live, already source-backed, and already shaped like a visitor-facing podcast launch point.',
    tags: ['NotebookLM', 'Augie Garrido', 'Baseball', 'Public'],
    notebookStatus: 'public',
    featuredTier: 'hero',
    sourceCount: 13,
    selectionReason:
      'This is the cleanest live handoff because it already clears the public-sharing line. It should lead the page until more notebooks are published.',
    sourceLabel: 'NotebookLM public notebook',
    notebookUrl: 'https://notebooklm.google.com/notebook/1b326e81-f8e6-43eb-ab87-e707356d23ad',
    quote: 'One public notebook beats a page full of broken promises.',
  },
  {
    id: 'rose-bowl-truth-vs-myth',
    title: '2005 Rose Bowl: Texas Truth vs. USC Myth',
    slug: '2005-rose-bowl-texas-truth-vs-usc-myth',
    publishedDate: '2025-04-20',
    durationLabel: 'Notebook',
    category: 'CFB',
    series: 'Game Reframed',
    description:
      'A Texas-centered reframing of the 2005 Rose Bowl with a deeper source stack than the current live route gives it credit for.',
    tags: ['Texas', 'USC', 'Rose Bowl', 'NotebookLM'],
    notebookStatus: 'private',
    featuredTier: 'publish-next',
    sourceCount: 22,
    selectionReason:
      'This is one of the strongest immediate promotions because the topic is iconic, the title already hits, and the source depth is high enough to justify a public launch.',
    sourceLabel: 'NotebookLM workspace notebook',
    sourceUrl: 'https://drive.google.com/file/d/13VSH9bZWtfzPnoluxPQRV6cnxFGfP5b2',
    quote: 'Texas does not need mythology here. The evidence is enough.',
  },
  {
    id: 'augie-championship-blueprint',
    title: 'The Augie Garrido Championship Blueprint: Life Is Yours to Win',
    slug: 'the-augie-garrido-championship-blueprint-life-is-yours-to-win',
    publishedDate: '2025-07-17',
    durationLabel: 'Notebook',
    category: 'Baseball',
    series: 'Championship Blueprint',
    description:
      'A private NotebookLM build around Augie Garrido with a deeper source base than a one-off article and a clearer long-run fit than a generic podcast shelf.',
    tags: ['Augie Garrido', 'Championship Culture', 'Texas', 'NotebookLM'],
    notebookStatus: 'private',
    featuredTier: 'publish-next',
    sourceCount: 15,
    selectionReason:
      'This belongs near the front because it matches the BSI identity directly: standards, systems, baseball, and Texas authority in one lane.',
    sourceLabel: 'NotebookLM workspace notebook',
  },
  {
    id: 'unified-master-football-playbook',
    title: 'Unified Master Football Playbook: Process & Presence',
    slug: 'unified-master-football-playbook-process-and-presence',
    publishedDate: '2025-09-02',
    durationLabel: 'Notebook',
    category: 'CFB',
    series: 'Football Process',
    description:
      'A private football notebook with one of the deepest source stacks in the workspace, built around process language instead of hot-take noise.',
    tags: ['Football', 'Process', 'Presence', 'NotebookLM'],
    notebookStatus: 'private',
    featuredTier: 'publish-next',
    sourceCount: 26,
    selectionReason:
      'This is a page-worthy second wave item because it carries real source depth and broadens the route beyond baseball without diluting the BSI point of view.',
    sourceLabel: 'NotebookLM workspace notebook',
  },
  {
    id: 'ai-driven-baseball-scouting-business',
    title: 'AI-Driven Baseball Scouting, Business Plan, and Framework Validity',
    slug: 'ai-driven-baseball-scouting-business-plan-and-framework-validity',
    publishedDate: '2025-02-16',
    durationLabel: 'Notebook',
    category: 'NCAA Baseball',
    series: 'BSI Thesis',
    description:
      'A private notebook that sits close to the core BSI product thesis: baseball evaluation, business logic, and why the framework has a right to exist.',
    tags: ['Baseball', 'Scouting', 'Business Plan', 'BSI'],
    notebookStatus: 'private',
    featuredTier: 'publish-next',
    sourceCount: 32,
    selectionReason:
      'If the page is supposed to explain why BSI exists, this notebook is one of the clearest candidate promotions in the entire stack.',
    sourceLabel: 'NotebookLM workspace notebook',
  },
  {
    id: 'sports-coverage-ai-engagement-ratings',
    title: 'Sports Coverage: AI, Engagement, and Media Ratings',
    slug: 'sports-coverage-ai-engagement-and-media-ratings',
    publishedDate: '2025-10-12',
    durationLabel: 'Notebook',
    category: 'Media',
    series: 'Market Structure',
    description:
      'A private media notebook that speaks directly to the coverage wedge BSI is trying to own: where mainstream sports media misses the market and why that creates room.',
    tags: ['Media', 'AI', 'Ratings', 'Engagement'],
    notebookStatus: 'private',
    featuredTier: 'publish-next',
    sourceCount: 18,
    selectionReason:
      'This is a strong page candidate because it explains the market failure underneath the brand instead of just presenting another team or player take.',
    sourceLabel: 'NotebookLM workspace notebook',
  },
  {
    id: 'nil-revolution',
    title: 'Architecting the NIL Revolution in College Sports',
    slug: 'architecting-the-nil-revolution-in-college-sports',
    publishedDate: '2025-05-25',
    durationLabel: 'Notebook',
    category: 'NCAA',
    series: 'Power Shift',
    description:
      'A private NIL notebook with enough structure to matter and enough source depth to work as more than a surface-level college sports talking point.',
    tags: ['NIL', 'College Sports', 'Labor', 'Power 4'],
    notebookStatus: 'private',
    featuredTier: 'publish-next',
    sourceCount: 9,
    selectionReason:
      'It belongs in the publish-next lane because it expands the route from game analysis into market architecture without leaving the sports lane.',
    sourceLabel: 'NotebookLM workspace notebook',
    quote: 'The system stopped being amateur long before the paperwork admitted it.',
  },
  {
    id: 'baseball-athleticism-biomechanics',
    title: 'Baseball: Athleticism, Biomechanics, and Mental Challenge',
    slug: 'baseball-athleticism-biomechanics-and-mental-challenge',
    publishedDate: '2025-12-12',
    durationLabel: 'Notebook',
    category: 'Baseball',
    series: 'Mechanics and Mind',
    description:
      'A private baseball notebook aimed at the overlap between body control, movement, and the mental load of the sport.',
    tags: ['Baseball', 'Biomechanics', 'Athleticism', 'Mental Game'],
    notebookStatus: 'private',
    featuredTier: 'publish-next',
    sourceCount: 10,
    selectionReason:
      'This is one of the cleaner baseball-specific adds because the title is sharp, the angle is specific, and the source base is already real.',
    sourceLabel: 'NotebookLM workspace notebook',
  },
  {
    id: 'building-peak-performance',
    title: 'Building Peak Performance: Sports Psychology & Team Culture',
    slug: 'building-peak-performance-sports-psychology-and-team-culture',
    publishedDate: '2025-08-16',
    durationLabel: 'Notebook',
    category: 'Psychology',
    series: 'Culture and Performance',
    description:
      'A private notebook focused on sports psychology and team culture, with enough source depth to support a public-facing performance lane.',
    tags: ['Psychology', 'Culture', 'Leadership', 'Performance'],
    notebookStatus: 'private',
    featuredTier: 'publish-next',
    sourceCount: 11,
    selectionReason:
      'This works because it stretches the page into performance systems and team culture without drifting into generic self-help language.',
    sourceLabel: 'NotebookLM workspace notebook',
  },
  {
    id: 'college-baseball-wedge-brief',
    title: 'College Baseball Intel: Why the Wedge Is Real',
    slug: 'college-baseball-intel-why-the-wedge-is-real',
    publishedDate: '2026-02-25',
    durationLabel: 'Research brief',
    category: 'NCAA Baseball',
    series: 'Source-backed Brief',
    description:
      'A BSI research brief that explains the college baseball product wedge directly, even though it is not yet a NotebookLM notebook.',
    tags: ['College Baseball', 'Product Wedge', 'Transfer Portal', 'NIL'],
    notebookStatus: 'source-only',
    featuredTier: 'archive',
    sourceCount: 1,
    selectionReason:
      'This should stay on the page as a source-backed brief because it explains the business case cleanly, even before a NotebookLM version exists.',
    sourceLabel: 'Google Drive research brief',
    sourceUrl: 'https://docs.google.com/document/d/1rNSDiNWlJRcm9ZaJaW9WwJDJDsiBE83NtNlIOuSNN7Y',
    quote: 'BSI wins by translating hard sports information into something the market can actually use.',
  },
];

function parseLocalDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function getDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return parseLocalDateInput(value);
  return new Date(value);
}

function formatDisplayDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  }).format(getDate(value));
}

function formatMetaTimestamp(value?: string): string {
  if (!value) return 'Waiting on response';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
  }).format(parsed);
}

function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseDurationLabel(durationLabel: string): number {
  const parts = durationLabel.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isPlayableAudioUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /(\.mp3|\.m4a|\.aac|\.wav|\.ogg)(\?|$)/i.test(url);
}

function getNotebookStatusLabel(status: NotebookStatus): string {
  switch (status) {
    case 'public':
      return 'Public notebook';
    case 'private':
      return 'Publish next';
    case 'source-only':
      return 'Source brief';
    case 'feed':
      return 'Live feed';
    default:
      return 'Reference';
  }
}

function getNotebookStatusClass(status: NotebookStatus): string {
  switch (status) {
    case 'public':
      return styles.statePublic;
    case 'private':
      return styles.statePrivate;
    case 'source-only':
      return styles.stateSourceOnly;
    case 'feed':
      return styles.stateFeed;
    default:
      return '';
  }
}

function getFeedStatusLabel(status: FeedLaneStatus): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'empty':
      return 'No live audio';
    case 'degraded':
      return 'Degraded';
    case 'loading':
    default:
      return 'Loading';
  }
}

function getFeedLaneCopy(status: FeedLaneStatus, statusMessage?: string, errorMessage?: string): string {
  if (errorMessage) return errorMessage;
  if (statusMessage) return statusMessage;

  switch (status) {
    case 'live':
      return 'The external audio lane is live through the repo-native media API with verified market feeds.';
    case 'empty':
      return 'The external audio lane is wired through the repo-native media API, but the checked market feeds are empty right now.';
    case 'degraded':
      return 'The external audio lane is wired, but the checked market feeds are degraded right now.';
    case 'loading':
    default:
      return 'Checking the external audio lane through the repo-native media API.';
  }
}

function summarizeFeedDescription(description: string): string {
  const normalized = description.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'Live market audio carried through the repo-native Cloudflare feed lane.';
  }

  if (normalized.length <= MAX_FEED_DESCRIPTION_LENGTH) {
    return normalized;
  }

  const candidate = normalized.slice(0, MAX_FEED_DESCRIPTION_LENGTH + 1);
  const boundary = Math.max(
    candidate.lastIndexOf('. '),
    candidate.lastIndexOf('! '),
    candidate.lastIndexOf('? '),
    candidate.lastIndexOf('; '),
    candidate.lastIndexOf(', '),
    candidate.lastIndexOf(' ')
  );
  const cutoff = boundary > Math.floor(MAX_FEED_DESCRIPTION_LENGTH * 0.55) ? boundary : MAX_FEED_DESCRIPTION_LENGTH;

  return `${candidate.slice(0, cutoff).trimEnd()}…`;
}

function normalizeCuratedEpisode(episode: CuratedEpisode): BrowseEpisode {
  return {
    id: episode.id,
    title: episode.title,
    slug: episode.slug,
    publishedDate: episode.publishedDate,
    durationLabel: episode.durationLabel,
    category: episode.category,
    series: episode.series,
    description: episode.description,
    tags: episode.tags,
    notebookStatus: episode.notebookStatus,
    featuredTier: episode.featuredTier,
    sourceCount: episode.sourceCount,
    selectionReason: episode.selectionReason,
    sourceLabel: episode.sourceLabel,
    sourceUrl: episode.sourceUrl,
    notebookUrl: episode.notebookUrl,
    quote: episode.quote,
    originKind: 'curated',
    hasPlayableAudio: false,
  };
}

function normalizeFeedEpisode(episode: FeedApiEpisode, index: number): BrowseEpisode {
  const audioCandidate = isPlayableAudioUrl(episode.audioUrl) ? episode.audioUrl : undefined;
  const publishedDate = episode.pubDate ?? '2025-01-01T00:00:00Z';

  return {
    id: `feed-${episode.showKey}-${index}-${slugify(episode.title)}`,
    title: episode.title,
    slug: slugify(episode.title),
    publishedDate,
    durationLabel: episode.duration || '00:00',
    category: episode.category ? String(episode.category).toUpperCase() : 'Feed',
    series: episode.showName,
    description: summarizeFeedDescription(episode.description),
    tags: [episode.showName, episode.showHost, 'External Feed'],
    notebookStatus: 'feed',
    featuredTier: 'archive',
    sourceCount: 0,
    selectionReason:
      'This stays in the route as the live market-audio lane, sourced from the repo-native Cloudflare media endpoint rather than the NotebookLM workspace.',
    sourceLabel: 'Cloudflare market feed lane',
    sourceUrl: episode.apple || episode.spotify || episode.link,
    originKind: 'feed',
    hasPlayableAudio: Boolean(audioCandidate),
    audioUrl: audioCandidate,
    spotifyUrl: episode.spotify,
    appleUrl: episode.apple,
    hostLabel: episode.showHost,
  };
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statPill}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
    </div>
  );
}

export default function PodcastPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>(CURATED_EPISODES[0].id);
  const [externalFeed, setExternalFeed] = useState<FeedApiResponse | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.88);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeed(): Promise<void> {
      try {
        setFeedLoading(true);
        setFeedError(null);
        const response = await fetch('/api/media/podcasts', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Feed request failed with HTTP ${response.status}`);
        }

        const payload = (await response.json()) as FeedApiResponse;
        setExternalFeed(payload);
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Failed to load external podcast feed.';
        setFeedError(message);
      } finally {
        if (!controller.signal.aborted) setFeedLoading(false);
      }
    }

    void loadFeed();
    return () => controller.abort();
  }, []);

  const curatedEpisodes = useMemo(() => CURATED_EPISODES.map(normalizeCuratedEpisode), []);

  const feedEpisodes = useMemo(() => {
    return (externalFeed?.episodes ?? [])
      .map(normalizeFeedEpisode)
      .sort((left, right) => getDate(right.publishedDate).getTime() - getDate(left.publishedDate).getTime())
      .slice(0, MAX_FEED_EPISODES);
  }, [externalFeed]);

  const publicEpisodes = useMemo(() => {
    return curatedEpisodes.filter((episode) => episode.notebookStatus === 'public');
  }, [curatedEpisodes]);

  const publishNextEpisodes = useMemo(() => {
    return curatedEpisodes.filter((episode) => episode.featuredTier === 'publish-next');
  }, [curatedEpisodes]);

  const sourceOnlyEpisode = useMemo(() => {
    return curatedEpisodes.find((episode) => episode.notebookStatus === 'source-only');
  }, [curatedEpisodes]);

  const publicHero = useMemo(() => {
    return curatedEpisodes.find((episode) => episode.featuredTier === 'hero') ?? curatedEpisodes[0];
  }, [curatedEpisodes]);

  const allEpisodes = useMemo(() => {
    return [...curatedEpisodes, ...feedEpisodes].sort((left, right) => {
      return getDate(right.publishedDate).getTime() - getDate(left.publishedDate).getTime();
    });
  }, [curatedEpisodes, feedEpisodes]);

  const currentEpisode = useMemo(() => {
    return allEpisodes.find((episode) => episode.id === currentEpisodeId) ?? publicHero;
  }, [allEpisodes, currentEpisodeId, publicHero]);

  const availableCategories = useMemo(() => {
    const unique = new Set<string>(['All']);
    allEpisodes.forEach((episode) => unique.add(episode.category));
    return Array.from(unique);
  }, [allEpisodes]);

  const filteredEpisodes = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return allEpisodes.filter((episode) => {
      const categoryMatch = activeCategory === 'All' || episode.category === activeCategory;
      const textMatch =
        normalized.length === 0 ||
        episode.title.toLowerCase().includes(normalized) ||
        episode.description.toLowerCase().includes(normalized) ||
        episode.series.toLowerCase().includes(normalized) ||
        episode.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
        episode.selectionReason.toLowerCase().includes(normalized);

      return categoryMatch && textMatch;
    });
  }, [activeCategory, allEpisodes, query]);

  const currentIndex = useMemo(() => {
    return allEpisodes.findIndex((episode) => episode.id === currentEpisode.id);
  }, [allEpisodes, currentEpisode.id]);

  const publicCount = publicEpisodes.length;
  const publishNextCount = publishNextEpisodes.length;
  const feedPlayableCount = useMemo(() => feedEpisodes.filter((episode) => episode.hasPlayableAudio).length, [feedEpisodes]);
  const auditedSourceCount = useMemo(() => {
    return curatedEpisodes.reduce((sum, episode) => sum + episode.sourceCount, 0);
  }, [curatedEpisodes]);
  const feedLaneStatus: FeedLaneStatus = feedLoading
    ? 'loading'
    : feedError
      ? 'degraded'
      : externalFeed?.meta?.laneStatus ?? (feedEpisodes.length > 0 ? 'live' : 'empty');
  const feedStatusLabel = getFeedStatusLabel(feedLaneStatus);
  const feedStatusMessage = getFeedLaneCopy(feedLaneStatus, externalFeed?.meta?.statusMessage, feedError ?? undefined);
  const feedUpdatedAt = externalFeed?.meta?.fetchedAt ?? externalFeed?.meta?.fetched_at;
  const configuredFeedSources = externalFeed?.meta?.totalShows ?? externalFeed?.sources?.length ?? 0;
  const liveFeedEpisodes = externalFeed?.meta?.totalEpisodes ?? feedEpisodes.length;
  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      const nextPlayable = allEpisodes.find((episode, index) => index > currentIndex && episode.hasPlayableAudio);
      if (nextPlayable) setCurrentEpisodeId(nextPlayable.id);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [allEpisodes, currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentEpisode.hasPlayableAudio || !currentEpisode.audioUrl) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setCurrentTime(0);
      setDuration(parseDurationLabel(currentEpisode.durationLabel));
      setIsPlaying(false);
      return;
    }

    audio.src = currentEpisode.audioUrl;
    audio.load();
    setCurrentTime(0);
    setDuration(0);

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise?.catch) {
        playPromise.catch(() => setIsPlaying(false));
      }
    }
  }, [currentEpisode.audioUrl, currentEpisode.durationLabel, currentEpisode.hasPlayableAudio, isPlaying]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode.hasPlayableAudio) return;

    if (audio.paused) {
      const playPromise = audio.play();
      if (playPromise?.catch) playPromise.catch(() => setIsPlaying(false));
      return;
    }

    audio.pause();
  }, [currentEpisode.hasPlayableAudio]);

  const seekBy = useCallback(
    (amount: number) => {
      const audio = audioRef.current;
      if (!audio || !currentEpisode.hasPlayableAudio || !Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.min(Math.max(audio.currentTime + amount, 0), audio.duration);
    },
    [currentEpisode.hasPlayableAudio]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTyping = tagName === 'input' || tagName === 'textarea' || target?.isContentEditable;
      if (isTyping) return;

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayPause();
      }
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        seekBy(15);
      }
      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        seekBy(-15);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [seekBy, togglePlayPause]);

  const selectEpisode = useCallback((episodeId: string) => {
    setCurrentEpisodeId(episodeId);
  }, []);

  const goToAdjacent = useCallback(
    (direction: number) => {
      if (allEpisodes.length === 0) return;
      const nextIndex = (currentIndex + direction + allEpisodes.length) % allEpisodes.length;
      setCurrentEpisodeId(allEpisodes[nextIndex].id);
    },
    [allEpisodes, currentIndex]
  );

  const handleScrub = useCallback(
    (clientX: number) => {
      const audio = audioRef.current;
      const progressElement = progressRef.current;
      if (!audio || !progressElement || !currentEpisode.hasPlayableAudio || !Number.isFinite(audio.duration)) return;

      const rect = progressElement.getBoundingClientRect();
      const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      audio.currentTime = percent * audio.duration;
      setCurrentTime(audio.currentTime);
    },
    [currentEpisode.hasPlayableAudio]
  );

  const handleShare = useCallback(async () => {
    const payload = {
      title: `${currentEpisode.title} | Blaze Sports Intel`,
      text: currentEpisode.description,
      url: currentEpisode.notebookUrl || currentEpisode.sourceUrl || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }

      await navigator.clipboard.writeText(`${payload.title}\n${payload.url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [currentEpisode.description, currentEpisode.notebookUrl, currentEpisode.sourceUrl, currentEpisode.title]);

  return (
    <div className={styles.pageShell}>
      <audio ref={audioRef} preload="metadata" />

      <main id="main-content" className={styles.page}>
        <section className={styles.heroGrid}>
          <div className={styles.heroCard}>
            <div className={styles.heroEyebrow}>Blaze Sports Intel x NotebookLM</div>
            <h1 className={styles.heroTitle}>One notebook is live now. The better slate is queued behind it.</h1>
            <p className={styles.heroCopy}>
              This route now tells the truth about the workspace. There is one public NotebookLM briefing ready for visitors today, a stronger private wave that should be published next, and a live external audio lane pulled through the repo-native media API from verified market feeds.
            </p>

            <div className={styles.statGrid}>
              <StatPill label="Public now" value={String(publicCount).padStart(2, '0')} />
              <StatPill label="Publish next" value={String(publishNextCount).padStart(2, '0')} />
              <StatPill label="Feed audio" value={String(feedPlayableCount).padStart(2, '0')} />
              <StatPill label="Sources audited" value={String(auditedSourceCount)} />
            </div>

            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href={publicHero.notebookUrl ?? NOTEBOOKLM_HOME_URL} target="_blank" rel="noreferrer">
                Open live notebook
              </a>
              <a className={styles.secondaryButton} href="#publish-next">
                Review publish-next lane
              </a>
              <a className={styles.secondaryButton} href="#intelligence-console">
                Open intelligence console
              </a>
            </div>
          </div>

          <div className={styles.brandCard}>
            <div className={styles.brandFrame}>
              <div className={styles.brandWordmarkShell}>
                <img src={BLAZE_ASSET_URLS.wordmark} alt="Blaze Sports Intel wordmark" className={styles.brandWordmark} loading="eager" />
              </div>

              <div className={styles.brandPortraitShell}>
                <div className={styles.brandCrestShell}>
                  <img src={BLAZE_ASSET_URLS.crest} alt="Blaze Sports Intel crest mark" className={styles.brandCrest} loading="eager" />
                </div>
                <img src={BLAZE_ASSET_URLS.portrait} alt="Blaze Sports Intel portrait mark" className={styles.brandPortrait} loading="eager" />
              </div>

              <div className={styles.brandTokenCard}>
                <img src={BLAZE_ASSET_URLS.roundel} alt="Blaze Sports Intel roundel mark" className={styles.brandRoundel} loading="lazy" />
                <div className={styles.brandTokenCopy}>
                  <div className={styles.brandEyebrow}>Asset family</div>
                  <strong className={styles.brandTokenTitle}>Shield for authority. Portrait for presence. Roundel for field identity.</strong>
                </div>
              </div>
            </div>
            <div className={styles.brandMeta}>
              <div className={styles.brandEyebrow}>Born to Blaze the Path Beaten Less</div>
              <p className={styles.brandCopy}>
                The route now runs on a full brand stack instead of one borrowed image: a live wordmark, a portrait mark, a shield, and a roundel, all sitting inside an industrial editorial surface built for sports intelligence instead of generic podcast chrome.
              </p>
            </div>
            <dl className={styles.brandFacts}>
              <div>
                <dt>Feed status</dt>
                <dd>{feedStatusLabel}</dd>
              </div>
              <div>
                <dt>Feed updated</dt>
                <dd>{formatMetaTimestamp(feedUpdatedAt)}</dd>
              </div>
              <div>
                <dt>Sources checked</dt>
                <dd>{String(configuredFeedSources)}</dd>
              </div>
              <div>
                <dt>Timezone</dt>
                <dd>{externalFeed?.meta?.timezone ?? 'America/Chicago'}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={styles.laneSection} id="public-now">
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.cardEyebrow}>Public NotebookLM lane</div>
              <h2 className={styles.sectionTitle}>What visitors can actually open today</h2>
            </div>
            <p className={styles.sectionCaption}>{publicCount} verified public notebook</p>
          </div>

          <div className={styles.publicLaneGrid}>
            <article className={styles.publicFeatureCard}>
              <div className={styles.cardMetaRow}>
                <span className={`${styles.stateBadge} ${getNotebookStatusClass(publicHero.notebookStatus)}`}>
                  {getNotebookStatusLabel(publicHero.notebookStatus)}
                </span>
                <span>{publicHero.category}</span>
                <span>{formatDisplayDate(publicHero.publishedDate)}</span>
                <span>{publicHero.sourceCount} sources</span>
              </div>

              <h3 className={styles.featureTitle}>{publicHero.title}</h3>
              <p className={styles.featureCopy}>{publicHero.description}</p>

              <div className={styles.reasonBlock}>
                <span className={styles.reasonLabel}>Why it leads</span>
                <p>{publicHero.selectionReason}</p>
              </div>

              {publicHero.quote ? (
                <blockquote className={styles.quoteBlock}>
                  <p>{publicHero.quote}</p>
                </blockquote>
              ) : null}

              <div className={styles.actionRow}>
                <a className={styles.primaryButton} href={publicHero.notebookUrl ?? NOTEBOOKLM_HOME_URL} target="_blank" rel="noreferrer">
                  Open public notebook
                </a>
                <button type="button" className={styles.secondaryButton} onClick={() => selectEpisode(publicHero.id)}>
                  Load in console
                </button>
              </div>
            </article>

            <aside className={styles.publicSupportCard}>
              <div className={styles.cardEyebrow}>Why the page changed</div>
              <h3 className={styles.supportTitle}>Public-safe now. Stronger later.</h3>
              <p className={styles.supportCopy}>
                The old route treated NotebookLM like a generic launch button. The new route separates what is genuinely public from what is still private, so the page stops overpromising and starts curating.
              </p>
              <ul className={styles.supportList}>
                <li>Only public notebooks get public notebook buttons.</li>
                <li>Private notebooks stay visible as publish candidates, not fake live links.</li>
                <li>The external audio lane stays dynamic through <code>/api/media/podcasts</code>.</li>
              </ul>
              {sourceOnlyEpisode ? (
                <div className={styles.sourceOnlyCard}>
                  <span className={styles.reasonLabel}>Source-backed brief in queue</span>
                  <strong>{sourceOnlyEpisode.title}</strong>
                  <p>{sourceOnlyEpisode.selectionReason}</p>
                  <a className={styles.inlineLink} href={sourceOnlyEpisode.sourceUrl} target="_blank" rel="noreferrer">
                    Open research brief
                  </a>
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        <section className={styles.laneSection} id="publish-next">
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.cardEyebrow}>Best next to publish</div>
              <h2 className={styles.sectionTitle}>The notebooks that deserve the next public wave</h2>
            </div>
            <p className={styles.sectionCaption}>{publishNextCount} private notebooks ready for promotion</p>
          </div>

          <div className={styles.publishGrid}>
            {publishNextEpisodes.map((episode) => {
              const isCurrent = currentEpisode.id === episode.id;

              return (
                <button
                  key={episode.id}
                  type="button"
                  onClick={() => selectEpisode(episode.id)}
                  className={`${styles.publishCard} ${isCurrent ? styles.publishCardActive : ''}`}
                >
                  <div className={styles.publishTopRow}>
                    <span className={`${styles.stateBadge} ${getNotebookStatusClass(episode.notebookStatus)}`}>
                      {getNotebookStatusLabel(episode.notebookStatus)}
                    </span>
                    <span>{episode.sourceCount} sources</span>
                  </div>
                  <h3 className={styles.publishTitle}>{episode.title}</h3>
                  <p className={styles.publishCopy}>{episode.description}</p>
                  <p className={styles.publishReason}>{episode.selectionReason}</p>
                  <div className={styles.tagRow}>
                    {episode.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={styles.tagPill}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.discoveryGrid}>
          <aside className={styles.discoveryRail}>
            <div className={styles.railCard}>
              <label className={styles.searchLabel} htmlFor="podcast-search">
                Search notebooks and external audio
              </label>
              <input
                id="podcast-search"
                className={styles.searchInput}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="team, theme, or market angle"
              />

              <div className={styles.filterWrap}>
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`${styles.filterChip} ${activeCategory === category ? styles.filterChipActive : ''}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.railCard}>
              <div className={styles.cardEyebrow}>Repo-native audio lane</div>
              <h2 className={styles.railTitle}>
                {feedLaneStatus === 'live'
                  ? 'The route is carrying live market baseball audio through Cloudflare'
                  : feedLaneStatus === 'empty'
                    ? 'The external audio lane is wired, but the checked feeds are empty right now'
                    : feedLaneStatus === 'degraded'
                      ? 'The external audio lane is degraded right now'
                      : 'Checking the external audio lane'}
              </h2>
              <p className={styles.railCopy}>
                {feedStatusMessage}
              </p>
              <dl className={styles.metaList}>
                <div>
                  <dt>Status</dt>
                  <dd>{feedStatusLabel}</dd>
                </div>
                <div>
                  <dt>Total feed episodes</dt>
                  <dd>{String(liveFeedEpisodes || 0)}</dd>
                </div>
                <div>
                  <dt>Cache timestamp</dt>
                  <dd>{formatMetaTimestamp(feedUpdatedAt)}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.railCard}>
              <div className={styles.cardEyebrow}>Selection rule</div>
              <p className={styles.railCopy}>
                A notebook makes the page for one of two reasons: it is already public, or it is strong enough that publishing it would improve the route immediately. Presence alone is not enough.
              </p>
            </div>
          </aside>

          <div className={styles.discoveryMain}>
            <section id="episode-index" className={styles.indexCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.cardEyebrow}>Intelligence index</div>
                  <h2 className={styles.sectionTitle}>Curated notebooks and the external audio lane</h2>
                </div>
                <p className={styles.sectionCaption}>{filteredEpisodes.length} items visible</p>
              </div>

              <div className={styles.episodeList}>
                {filteredEpisodes.map((episode) => {
                  const isCurrent = currentEpisode.id === episode.id;

                  return (
                    <button
                      key={episode.id}
                      type="button"
                      onClick={() => selectEpisode(episode.id)}
                      className={`${styles.episodeCard} ${isCurrent ? styles.episodeCardActive : ''}`}
                    >
                      <div className={styles.episodeTopRow}>
                        <div className={styles.episodeMetaRow}>
                          <span className={styles.categoryBadge}>{episode.category}</span>
                          <span>{episode.series}</span>
                          <span>{formatDisplayDate(episode.publishedDate)}</span>
                          <span>{episode.originKind === 'feed' ? episode.durationLabel : `${episode.sourceCount} sources`}</span>
                        </div>
                        <span className={`${styles.stateBadge} ${getNotebookStatusClass(episode.notebookStatus)}`}>
                          {getNotebookStatusLabel(episode.notebookStatus)}
                        </span>
                      </div>

                      <div className={styles.episodeBody}>
                        <div className={styles.episodeCopy}>
                          <h3 className={styles.episodeTitle}>{episode.title}</h3>
                          <p className={styles.episodeDescription}>{episode.description}</p>
                          <p className={styles.episodeReason}>{episode.selectionReason}</p>
                          <div className={styles.tagRow}>
                            {episode.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className={styles.tagPill}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section id="intelligence-console" className={styles.detailGrid}>
              <article className={styles.detailCard}>
                <div className={styles.cardEyebrow}>Current selection</div>
                <h2 className={styles.detailTitle}>{currentEpisode.title}</h2>
                <p className={styles.detailCopy}>{currentEpisode.description}</p>
                <div className={styles.detailMeta}>
                  <span>{currentEpisode.category}</span>
                  <span>{formatDisplayDate(currentEpisode.publishedDate)}</span>
                  <span>{currentEpisode.originKind === 'feed' ? currentEpisode.durationLabel : `${currentEpisode.sourceCount} sources`}</span>
                  <span>{currentEpisode.sourceLabel}</span>
                </div>
                {currentEpisode.quote ? (
                  <blockquote className={styles.quoteBlock}>
                    <p>{currentEpisode.quote}</p>
                  </blockquote>
                ) : null}
              </article>

              <article className={styles.detailCard}>
                <div className={styles.cardEyebrow}>Why it belongs</div>
                <p className={styles.detailCopy}>{currentEpisode.selectionReason}</p>
                <div className={styles.factGrid}>
                  <div className={styles.factCard}>
                    <span className={styles.factLabel}>Notebook status</span>
                    <strong>{getNotebookStatusLabel(currentEpisode.notebookStatus)}</strong>
                  </div>
                  <div className={styles.factCard}>
                    <span className={styles.factLabel}>Lane</span>
                    <strong>{currentEpisode.originKind === 'feed' ? 'Live feed' : currentEpisode.featuredTier.replace('-', ' ')}</strong>
                  </div>
                  <div className={styles.factCard}>
                    <span className={styles.factLabel}>Source count</span>
                    <strong>{currentEpisode.originKind === 'feed' ? 'Feed metadata' : String(currentEpisode.sourceCount)}</strong>
                  </div>
                  <div className={styles.factCard}>
                    <span className={styles.factLabel}>Audio</span>
                    <strong>{currentEpisode.hasPlayableAudio ? 'Playable now' : 'No public audio yet'}</strong>
                  </div>
                </div>
              </article>

              <article className={styles.detailCard}>
                <div className={styles.cardEyebrow}>Actions</div>
                <div className={styles.actionStack}>
                  {currentEpisode.notebookStatus === 'public' && currentEpisode.notebookUrl ? (
                    <a className={styles.primaryButton} href={currentEpisode.notebookUrl} target="_blank" rel="noreferrer">
                      Open public notebook
                    </a>
                  ) : null}

                  {currentEpisode.sourceUrl ? (
                    <a className={styles.secondaryButton} href={currentEpisode.sourceUrl} target="_blank" rel="noreferrer">
                      Open source document
                    </a>
                  ) : null}

                  {currentEpisode.originKind === 'feed' && currentEpisode.sourceUrl ? (
                    <a className={styles.secondaryButton} href={currentEpisode.sourceUrl} target="_blank" rel="noreferrer">
                      Open feed source
                    </a>
                  ) : null}
                </div>

                <div className={styles.statusNotice}>
                  {currentEpisode.notebookStatus === 'private' ? (
                    <p>This notebook belongs in the next publish wave. The page shows it as a candidate, not as a fake public destination.</p>
                  ) : null}
                  {currentEpisode.notebookStatus === 'source-only' ? (
                    <p>This is a source-backed brief that earns page space now, even before a NotebookLM version exists.</p>
                  ) : null}
                  {currentEpisode.notebookStatus === 'feed' ? (
                    <p>This item comes from the live market-audio lane and can play inside the route because the feed exposes a direct audio file.</p>
                  ) : null}
                  {currentEpisode.notebookStatus === 'public' ? (
                    <p>This is the live public NotebookLM handoff. It is the benchmark for what the rest of the notebook lane needs to become.</p>
                  ) : null}
                </div>
              </article>
            </section>

            <section className={styles.playerShell}>
              <div className={styles.playerInfo}>
                <div className={styles.cardEyebrow}>Player console</div>
                <h2 className={styles.playerTitle}>{currentEpisode.title}</h2>
                <p className={styles.playerDescription}>{currentEpisode.description}</p>
                <div className={styles.playerMetaRow}>
                  <span>{currentEpisode.category}</span>
                  <span>{formatDisplayDate(currentEpisode.publishedDate)}</span>
                  <span>{currentEpisode.originKind === 'feed' ? currentEpisode.durationLabel : currentEpisode.sourceLabel}</span>
                  <span>{getNotebookStatusLabel(currentEpisode.notebookStatus)}</span>
                </div>
              </div>

              <div className={styles.playerCard}>
                <div className={styles.playerHeaderRow}>
                  <div>
                    <div className={styles.cardEyebrow}>Current mode</div>
                    <div className={styles.playerMode}>{currentEpisode.hasPlayableAudio ? 'Audio playback' : 'Notebook and source review'}</div>
                  </div>
                  <button type="button" className={styles.iconButton} onClick={handleShare} aria-label="Share current selection">
                    {copied ? 'Copied' : 'Share'}
                  </button>
                </div>

                <div
                  ref={progressRef}
                  className={`${styles.progressTrack} ${currentEpisode.hasPlayableAudio ? styles.progressTrackInteractive : ''}`}
                  onClick={currentEpisode.hasPlayableAudio ? (event) => handleScrub(event.clientX) : undefined}
                  role="presentation"
                >
                  <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
                  <div className={styles.progressThumb} style={{ left: `${progressPercent}%` }} />
                </div>

                <div className={styles.clockRow}>
                  <span>{formatClock(currentTime)}</span>
                  <span>{formatClock(duration || parseDurationLabel(currentEpisode.durationLabel))}</span>
                </div>

                <div className={styles.playerControls}>
                  <button type="button" className={styles.controlButton} onClick={() => goToAdjacent(-1)} aria-label="Previous item">
                    Prev
                  </button>
                  <button type="button" className={styles.controlButton} onClick={() => seekBy(-15)} disabled={!currentEpisode.hasPlayableAudio}>
                    -15s
                  </button>
                  <button type="button" className={styles.playButton} onClick={togglePlayPause} disabled={!currentEpisode.hasPlayableAudio}>
                    {currentEpisode.hasPlayableAudio ? (isPlaying ? 'Pause' : 'Play') : 'No audio'}
                  </button>
                  <button type="button" className={styles.controlButton} onClick={() => seekBy(15)} disabled={!currentEpisode.hasPlayableAudio}>
                    +15s
                  </button>
                  <button type="button" className={styles.controlButton} onClick={() => goToAdjacent(1)} aria-label="Next item">
                    Next
                  </button>
                </div>

                <div className={styles.sliderRow}>
                  <div className={styles.volumeShell}>
                    <button type="button" className={styles.iconButton} onClick={() => setIsMuted((value) => !value)} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                      {isMuted || volume === 0 ? 'Mute' : 'Vol'}
                    </button>
                    <input
                      className={styles.slider}
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(event) => {
                        const nextVolume = Number(event.target.value);
                        setVolume(nextVolume);
                        setIsMuted(nextVolume === 0);
                      }}
                      aria-label="Volume"
                    />
                  </div>

                  <div className={styles.rateRow}>
                    {[1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        className={`${styles.rateButton} ${playbackRate === rate ? styles.rateButtonActive : ''}`}
                        onClick={() => setPlaybackRate(rate)}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {!currentEpisode.hasPlayableAudio ? (
                  <div className={styles.playerNotice}>
                    <p>
                      {currentEpisode.notebookStatus === 'public'
                        ? 'This selection is live as a public NotebookLM briefing, but not as a route-native audio file.'
                        : currentEpisode.notebookStatus === 'private'
                          ? 'This selection is strong enough for the page, but it still needs to be published out of NotebookLM before it becomes a public destination.'
                          : 'This selection is source-backed, not route-playable audio.'}
                    </p>
                    <div className={styles.noticeActions}>
                      {currentEpisode.notebookStatus === 'public' && currentEpisode.notebookUrl ? (
                        <a className={styles.primaryButton} href={currentEpisode.notebookUrl} target="_blank" rel="noreferrer">
                          Open notebook
                        </a>
                      ) : null}
                      {currentEpisode.sourceUrl ? (
                        <a className={styles.secondaryButton} href={currentEpisode.sourceUrl} target="_blank" rel="noreferrer">
                          Open source
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
