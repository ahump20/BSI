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
    { conferenceId: 'pac-12' },
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
