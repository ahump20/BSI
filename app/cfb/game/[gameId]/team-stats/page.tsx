import TeamStatsClient from './TeamStatsClient';

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export default function CFBTeamStatsPage() {
  return <TeamStatsClient />;
}
