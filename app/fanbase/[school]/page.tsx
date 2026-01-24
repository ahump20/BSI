import FanbaseProfileClient from './FanbaseProfileClient';

// Static params for all fanbase pages (for static export)
export function generateStaticParams() {
  return [
    // SEC Teams
    { school: 'texas-longhorns' },
    { school: 'oklahoma-sooners' },
    { school: 'georgia-bulldogs' },
    { school: 'alabama-crimson-tide' },
    { school: 'lsu-tigers' },
    { school: 'ole-miss-rebels' },
    { school: 'tennessee-volunteers' },
    { school: 'texas-am-aggies' },
    { school: 'florida-gators' },
    { school: 'auburn-tigers' },
    { school: 'missouri-tigers' },
    { school: 'kentucky-wildcats' },
    { school: 'arkansas-razorbacks' },
    { school: 'mississippi-state-bulldogs' },
    { school: 'south-carolina-gamecocks' },
    { school: 'vanderbilt-commodores' },
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
