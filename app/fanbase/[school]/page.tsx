import FanbaseProfileClient from './FanbaseProfileClient';

// Static params for all fanbase pages (for static export)
// IDs match what bsi-fanbase-sentiment API returns
export function generateStaticParams() {
  return [
    // SEC Teams - using API school IDs
    { school: 'texas' },
    { school: 'oklahoma' },
    { school: 'georgia' },
    { school: 'alabama' },
    { school: 'lsu' },
    { school: 'ole-miss' },
    { school: 'tennessee' },
    { school: 'texas-am' },
    { school: 'florida' },
    { school: 'auburn' },
    { school: 'missouri' },
    { school: 'kentucky' },
    { school: 'arkansas' },
    { school: 'mississippi-state' },
    { school: 'south-carolina' },
    { school: 'vanderbilt' },
  ];
}

export default async function FanbaseProfilePage({
  params,
}: {
  params: Promise<{ school: string }>;
}) {
  const { school } = await params;
  return <FanbaseProfileClient schoolId={school} />;
}
