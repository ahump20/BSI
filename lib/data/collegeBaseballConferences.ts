export interface CollegeBaseballConference {
  id: string;
  shortName: string;
  displayName: string;
  standingsQueryValue: string;
  slug: string;
  aliases: string[];
  isPrimary: boolean;
}

const BASE_CONFERENCES: CollegeBaseballConference[] = [
  {
    id: 'SEC',
    shortName: 'SEC',
    displayName: 'Southeastern Conference',
    standingsQueryValue: 'SEC',
    slug: 'sec',
    aliases: ['southeastern'],
    isPrimary: true,
  },
  {
    id: 'ACC',
    shortName: 'ACC',
    displayName: 'Atlantic Coast Conference',
    standingsQueryValue: 'ACC',
    slug: 'acc',
    aliases: ['atlanticcoast'],
    isPrimary: true,
  },
  {
    id: 'Big 12',
    shortName: 'Big 12',
    displayName: 'Big 12 Conference',
    standingsQueryValue: 'Big 12',
    slug: 'big12',
    aliases: ['big-12', 'bigxii'],
    isPrimary: true,
  },
  {
    id: 'Big Ten',
    shortName: 'Big Ten',
    displayName: 'Big Ten Conference',
    standingsQueryValue: 'Big Ten',
    slug: 'bigten',
    aliases: ['big-ten', 'b1g'],
    isPrimary: true,
  },
  {
    id: 'Pac-12',
    shortName: 'Pac-12',
    displayName: 'Pac-12 Conference',
    standingsQueryValue: 'Pac-12',
    slug: 'pac12',
    aliases: ['pac-12', 'pac 12'],
    isPrimary: true,
  },
  {
    id: 'Sun Belt',
    shortName: 'Sun Belt',
    displayName: 'Sun Belt Conference',
    standingsQueryValue: 'Sun Belt',
    slug: 'sunbelt',
    aliases: ['sun-belt'],
    isPrimary: true,
  },
  {
    id: 'AAC',
    shortName: 'AAC',
    displayName: 'American Athletic Conference',
    standingsQueryValue: 'AAC',
    slug: 'aac',
    aliases: ['american', 'americanathletic'],
    isPrimary: true,
  },
  {
    id: 'A-10',
    shortName: 'A-10',
    displayName: 'Atlantic 10 Conference',
    standingsQueryValue: 'A-10',
    slug: 'a10',
    aliases: ['atlantic10', 'a-10'],
    isPrimary: false,
  },
  {
    id: 'America East',
    shortName: 'Am. East',
    displayName: 'America East Conference',
    standingsQueryValue: 'America East',
    slug: 'americaeast',
    aliases: [],
    isPrimary: false,
  },
  {
    id: 'ASUN',
    shortName: 'ASUN',
    displayName: 'Atlantic Sun Conference',
    standingsQueryValue: 'ASUN',
    slug: 'asun',
    aliases: ['atlanticsun'],
    isPrimary: false,
  },
  {
    id: 'Big East',
    shortName: 'Big East',
    displayName: 'Big East Conference',
    standingsQueryValue: 'Big East',
    slug: 'bigeast',
    aliases: [],
    isPrimary: false,
  },
  {
    id: 'Big South',
    shortName: 'Big South',
    displayName: 'Big South Conference',
    standingsQueryValue: 'Big South',
    slug: 'bigsouth',
    aliases: [],
    isPrimary: false,
  },
  {
    id: 'Big West',
    shortName: 'Big West',
    displayName: 'Big West Conference',
    standingsQueryValue: 'Big West',
    slug: 'bigwest',
    aliases: [],
    isPrimary: false,
  },
  {
    id: 'CAA',
    shortName: 'CAA',
    displayName: 'Colonial Athletic Association',
    standingsQueryValue: 'CAA',
    slug: 'caa',
    aliases: ['colonial'],
    isPrimary: false,
  },
  {
    id: 'CUSA',
    shortName: 'C-USA',
    displayName: 'Conference USA',
    standingsQueryValue: 'CUSA',
    slug: 'cusa',
    aliases: ['conferenceusa', 'c-usa'],
    isPrimary: false,
  },
  {
    id: 'Horizon',
    shortName: 'Horizon',
    displayName: 'Horizon League',
    standingsQueryValue: 'Horizon',
    slug: 'horizon',
    aliases: ['horizonleague'],
    isPrimary: false,
  },
  {
    id: 'Missouri Valley',
    shortName: 'MVC',
    displayName: 'Missouri Valley Conference',
    standingsQueryValue: 'Missouri Valley',
    slug: 'missourivalley',
    aliases: ['mvc'],
    isPrimary: false,
  },
  {
    id: 'Mountain West',
    shortName: 'MW',
    displayName: 'Mountain West Conference',
    standingsQueryValue: 'Mountain West',
    slug: 'mountainwest',
    aliases: ['mw'],
    isPrimary: false,
  },
  {
    id: 'Patriot League',
    shortName: 'Patriot',
    displayName: 'Patriot League',
    standingsQueryValue: 'Patriot League',
    slug: 'patriotleague',
    aliases: ['patriot'],
    isPrimary: false,
  },
  {
    id: 'Southern',
    shortName: 'SoCon',
    displayName: 'Southern Conference',
    standingsQueryValue: 'Southern',
    slug: 'southern',
    aliases: ['socon'],
    isPrimary: false,
  },
  {
    id: 'Southland',
    shortName: 'Southland',
    displayName: 'Southland Conference',
    standingsQueryValue: 'Southland',
    slug: 'southland',
    aliases: [],
    isPrimary: false,
  },
  {
    id: 'Summit',
    shortName: 'Summit',
    displayName: 'Summit League',
    standingsQueryValue: 'Summit',
    slug: 'summit',
    aliases: ['summitleague'],
    isPrimary: false,
  },
  {
    id: 'WAC',
    shortName: 'WAC',
    displayName: 'Western Athletic Conference',
    standingsQueryValue: 'WAC',
    slug: 'wac',
    aliases: ['westernathletic'],
    isPrimary: false,
  },
  {
    id: 'WCC',
    shortName: 'WCC',
    displayName: 'West Coast Conference',
    standingsQueryValue: 'WCC',
    slug: 'wcc',
    aliases: ['westcoast'],
    isPrimary: false,
  },
  {
    id: 'Independent',
    shortName: 'Ind.',
    displayName: 'Independent',
    standingsQueryValue: 'Independent',
    slug: 'independent',
    aliases: ['ind'],
    isPrimary: false,
  },
];

const normalizeToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const COLLEGE_BASEBALL_CONFERENCES = BASE_CONFERENCES;

const aliasToId = new Map<string, string>();
for (const conference of COLLEGE_BASEBALL_CONFERENCES) {
  aliasToId.set(normalizeToken(conference.id), conference.id);
  aliasToId.set(normalizeToken(conference.slug), conference.id);
  aliasToId.set(normalizeToken(conference.standingsQueryValue), conference.id);
  for (const alias of conference.aliases) {
    aliasToId.set(normalizeToken(alias), conference.id);
  }
}

export const PRIMARY_COLLEGE_BASEBALL_CONFERENCES = COLLEGE_BASEBALL_CONFERENCES.filter(
  (conference) => conference.isPrimary,
);

export function normalizeCollegeBaseballConference(
  input: string | null | undefined,
): string | null {
  if (!input) return null;
  return aliasToId.get(normalizeToken(input)) ?? null;
}

export function getCollegeBaseballConferenceById(
  id: string,
): CollegeBaseballConference | undefined {
  return COLLEGE_BASEBALL_CONFERENCES.find((conference) => conference.id === id);
}
