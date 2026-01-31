import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export interface PlayerBioProps {
  bio: {
    birthDate?: string;
    birthPlace?: string;
    height?: string;
    weight?: string;
    college?: string;
    highSchool?: string;
    draft?: {
      year: number;
      round: number;
      pick: number;
      team: string;
    };
    experience?: number;
    recruitingRank?: string;
    hometown?: string;
  };
}

export function PlayerBio({ bio }: PlayerBioProps) {
  const bioItems = [
    bio.birthDate && { label: 'Born', value: bio.birthDate },
    bio.birthPlace && { label: 'Birthplace', value: bio.birthPlace },
    bio.hometown && { label: 'Hometown', value: bio.hometown },
    bio.height && { label: 'Height', value: bio.height },
    bio.weight && { label: 'Weight', value: bio.weight },
    bio.highSchool && { label: 'High School', value: bio.highSchool },
    bio.college && { label: 'College', value: bio.college },
    bio.experience !== undefined && {
      label: 'Experience',
      value: `${bio.experience} ${bio.experience === 1 ? 'year' : 'years'}`,
    },
    bio.recruitingRank && { label: 'HS Recruiting', value: bio.recruitingRank },
    bio.draft && {
      label: 'Draft',
      value: `${bio.draft.year} Round ${bio.draft.round}, Pick #${bio.draft.pick}`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Card variant="default" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-burnt-orange"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Player Bio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {bioItems.map((item) => (
            <div
              key={item.label}
              className="flex justify-between py-2 border-b border-border-subtle last:border-0"
            >
              <dt className="text-sm text-text-tertiary">{item.label}</dt>
              <dd className="text-sm font-medium text-white">{item.value}</dd>
            </div>
          ))}
        </dl>

        {/* Draft Card (if applicable) */}
        {bio.draft && (
          <div className="mt-6 p-4 bg-gradient-to-br from-burnt-orange/20 to-gold/10 rounded-xl border border-burnt-orange/30 text-center">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">
              {bio.draft.year} Draft
            </p>
            <p className="text-3xl font-display font-bold text-burnt-orange">
              RD {bio.draft.round}
            </p>
            <p className="text-sm text-white mt-1">Pick #{bio.draft.pick} Overall</p>
            <div className="inline-flex items-center gap-2 bg-burnt-orange/30 px-3 py-1.5 rounded-lg mt-3">
              <svg
                className="w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-sm font-semibold text-white">{bio.draft.team}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
