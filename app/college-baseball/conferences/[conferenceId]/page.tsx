import type { Metadata } from 'next';
import ConferencePageClient from './ConferencePageClient';
import { ogImage } from '@/lib/metadata';

// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

const CONF_META: Record<string, { name: string; full: string }> = {
  sec: { name: 'SEC', full: 'Southeastern Conference' },
  acc: { name: 'ACC', full: 'Atlantic Coast Conference' },
  'big-12': { name: 'Big 12', full: 'Big 12 Conference' },
  'big-ten': { name: 'Big Ten', full: 'Big Ten Conference' },
  'big-east': { name: 'Big East', full: 'Big East Conference' },
  aac: { name: 'AAC', full: 'American Athletic Conference' },
  'sun-belt': { name: 'Sun Belt', full: 'Sun Belt Conference' },
  'mountain-west': { name: 'Mountain West', full: 'Mountain West Conference' },
  'c-usa': { name: 'C-USA', full: 'Conference USA' },
  'a-10': { name: 'A-10', full: 'Atlantic 10 Conference' },
  colonial: { name: 'CAA', full: 'Colonial Athletic Association' },
  'missouri-valley': { name: 'MVC', full: 'Missouri Valley Conference' },
  wcc: { name: 'WCC', full: 'West Coast Conference' },
  'big-west': { name: 'Big West', full: 'Big West Conference' },
  southland: { name: 'Southland', full: 'Southland Conference' },
  asun: { name: 'ASUN', full: 'Atlantic Sun Conference' },
  'america-east': { name: 'Am. East', full: 'America East Conference' },
  'big-south': { name: 'Big South', full: 'Big South Conference' },
  horizon: { name: 'Horizon', full: 'Horizon League' },
  'patriot-league': { name: 'Patriot', full: 'Patriot League' },
  southern: { name: 'SoCon', full: 'Southern Conference' },
  summit: { name: 'Summit', full: 'Summit League' },
  wac: { name: 'WAC', full: 'Western Athletic Conference' },
  independent: { name: 'Independent', full: 'Independent Programs' },
};

export async function generateMetadata({ params }: { params: Promise<{ conferenceId: string }> }): Promise<Metadata> {
  const { conferenceId } = await params;
  const conf = CONF_META[conferenceId] || { name: conferenceId.toUpperCase(), full: conferenceId };
  return {
    title: `${conf.full} Baseball | Standings, Teams & Stats | BSI`,
    description: `${conf.full} college baseball standings, team rankings, conference strength index, and advanced analytics. Updated daily with live scores and sabermetrics from Blaze Sports Intel.`,
    alternates: { canonical: `/college-baseball/conferences/${conferenceId}` },
    openGraph: {
      title: `${conf.name} College Baseball | Blaze Sports Intel`,
      description: `${conf.full} standings, strength index, and team analytics for the ${new Date().getFullYear()} season.`,
      images: ogImage('/images/og-college-baseball.png'),
    },
  };
}

export async function generateStaticParams() {
  return [
    // Power Conferences
    { conferenceId: 'sec' },
    { conferenceId: 'acc' },
    { conferenceId: 'big-12' },
    { conferenceId: 'big-ten' },
    // Mid-Major / Group of 5
    { conferenceId: 'big-east' },
    { conferenceId: 'aac' },
    { conferenceId: 'sun-belt' },
    { conferenceId: 'mountain-west' },
    { conferenceId: 'c-usa' },
    { conferenceId: 'a-10' },
    { conferenceId: 'colonial' },
    { conferenceId: 'missouri-valley' },
    { conferenceId: 'wcc' },
    { conferenceId: 'big-west' },
    { conferenceId: 'southland' },
    // D1 Contender Conferences
    { conferenceId: 'asun' },
    { conferenceId: 'america-east' },
    { conferenceId: 'big-south' },
    { conferenceId: 'horizon' },
    { conferenceId: 'patriot-league' },
    { conferenceId: 'southern' },
    { conferenceId: 'summit' },
    { conferenceId: 'wac' },
    // Independent
    { conferenceId: 'independent' },
  ];
}

export default async function ConferenceDetailPage({
  params,
}: {
  params: Promise<{ conferenceId: string }>;
}) {
  const { conferenceId } = await params;
  return <ConferencePageClient conferenceId={conferenceId} />;
}
