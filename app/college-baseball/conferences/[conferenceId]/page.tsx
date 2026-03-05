import ConferencePageClient from './ConferencePageClient';
// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

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
