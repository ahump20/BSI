/**
 * ESPN Team ID Mapping for College Baseball
 * Used for live data integration
 *
 * Source: ESPN API (site.api.espn.com)
 * @author Blaze Sports Intel
 */

const ESPN_TEAM_IDS = {
  // SEC
  'texas': '251',
  'texas-am': '245',
  'lsu': '99',
  'vanderbilt': '238',
  'arkansas': '8',
  'tennessee': '2633',
  'florida': '57',
  'ole-miss': '145',
  'alabama': '333',
  'auburn': '2',
  'georgia': '61',
  'kentucky': '96',
  'missouri': '142',
  'mississippi-state': '344',
  'south-carolina': '2579',
  'oklahoma': '201',

  // Big 12
  'tcu': '2628',
  'arizona': '12',
  'arizona-state': '9',
  'byu': '252',
  'cincinnati': '2132',
  'colorado': '38',
  'houston': '248',
  'iowa-state': '66',
  'kansas': '2305',
  'kansas-state': '2306',
  'ucf': '2116',
  'utah': '254',
  'west-virginia': '277',

  // ACC
  'clemson': '228',
  'florida-state': '52',
  'georgia-tech': '59',
  'duke': '150',
  'north-carolina': '153',
  'nc-state': '152',
  'virginia': '258',
  'wake-forest': '154',
  'louisville': '97',
  'miami': '2390',
  'boston-college': '103',
  'cal': '25',
  'notre-dame': '87',
  'pitt': '221',
  'smu': '2567',
  'stanford': '24',
  'syracuse': '183',
  'virginia-tech': '259',

  // Pac-12 (post-realignment)
  'oregon-state': '204',
  'washington-state': '265',
  'san-diego-state': '21',
  'fresno-state': '278',
  'colorado-state': '36',
  'utah-state': '328',
  'boise-state': '68',
  'air-force': '2005',

  // Big Ten
  'usc': '30',
  'ucla': '26',
  'oregon': '2483',
  'washington': '264',
  'indiana': '84',
  'maryland': '120',
  'michigan': '130',
  'nebraska': '158',
  'ohio-state': '194',
  'illinois': '356',
  'minnesota': '135',
  'rutgers': '164',
  'penn-state': '213',
  'purdue': '2509',
  'northwestern': '77',
  'iowa': '2294',

  // American
  'east-carolina': '151',
  'tulane': '2655',
  'wichita-state': '2724',
  'memphis': '235',
  'south-florida': '58',
  'rice': '242',
  'charlotte': '2429',
  'uab': '5',
  'north-texas': '249',
  'utsa': '2636',
  'army': '349',
  'navy': '2426',
  'temple': '218',
  'fau': '2226',

  // Sun Belt
  'coastal-carolina': '324',
  'louisiana': '309',
  'troy': '2653',
  'south-alabama': '6',
  'texas-state': '326',
  'southern-miss': '2572',
  'georgia-southern': '290',
  'georgia-state': '2247',
  'arkansas-state': '2032',
  'appalachian-state': '2026',
  'louisiana-monroe': '2433',
  'james-madison': '256',
  'marshall': '276',
  'old-dominion': '295',

  // Conference USA
  'liberty': '2335',
  'new-mexico-state': '166',
  'sam-houston': '2534',
  'jacksonville-state': '55',
  'kennesaw-state': '338',
  'fiu': '2229',
  'western-kentucky': '98',
  'middle-tennessee': '2393',
  'utep': '2638',
  'la-tech': '2348',

  // MVC
  'dallas-baptist': '2166',
  'indiana-state': '282',
  'illinois-state': '2287',
  'evansville': '339',
  'bradley': '71',
  'missouri-state': '2623',
  'southern-illinois': '79',
  'valparaiso': '2674',
  'belmont': '2057',

  // Southland
  'nicholls': '2447',
  'northwestern-state': '2449',
  'mcneese': '2377',
  'southeastern-louisiana': '2545',
  'houston-christian': '2277',
  'incarnate-word': '2916',
  'texas-am-corpus-christi': '357',
  'lamar': '2320',
  'uh-arlington': '250'
};

// Conference groupings
const CONFERENCE_TEAMS = {
  'sec': ['texas', 'texas-am', 'lsu', 'vanderbilt', 'arkansas', 'tennessee', 'florida', 'ole-miss', 'alabama', 'auburn', 'georgia', 'kentucky', 'missouri', 'mississippi-state', 'south-carolina', 'oklahoma'],
  'big12': ['tcu', 'arizona', 'arizona-state', 'byu', 'cincinnati', 'colorado', 'houston', 'iowa-state', 'kansas', 'kansas-state', 'ucf', 'utah', 'west-virginia'],
  'acc': ['clemson', 'florida-state', 'georgia-tech', 'duke', 'north-carolina', 'nc-state', 'virginia', 'wake-forest', 'louisville', 'miami', 'boston-college', 'cal', 'notre-dame', 'pitt', 'smu', 'stanford', 'syracuse', 'virginia-tech'],
  'pac12': ['oregon-state', 'washington-state', 'san-diego-state', 'fresno-state', 'colorado-state', 'utah-state', 'boise-state', 'air-force'],
  'big10': ['usc', 'ucla', 'oregon', 'washington', 'indiana', 'maryland', 'michigan', 'nebraska', 'ohio-state', 'illinois', 'minnesota', 'rutgers', 'penn-state', 'purdue', 'northwestern', 'iowa'],
  'american': ['east-carolina', 'tulane', 'wichita-state', 'memphis', 'south-florida', 'rice', 'charlotte', 'uab', 'north-texas', 'utsa', 'army', 'navy', 'temple', 'fau'],
  'sunbelt': ['coastal-carolina', 'louisiana', 'troy', 'south-alabama', 'texas-state', 'southern-miss', 'georgia-southern', 'georgia-state', 'arkansas-state', 'appalachian-state', 'louisiana-monroe', 'james-madison', 'marshall', 'old-dominion'],
  'cusa': ['liberty', 'new-mexico-state', 'sam-houston', 'jacksonville-state', 'kennesaw-state', 'fiu', 'western-kentucky', 'middle-tennessee', 'utep', 'la-tech'],
  'mvc': ['dallas-baptist', 'indiana-state', 'illinois-state', 'evansville', 'bradley', 'missouri-state', 'southern-illinois', 'valparaiso', 'belmont'],
  'southland': ['nicholls', 'northwestern-state', 'mcneese', 'southeastern-louisiana', 'houston-christian', 'incarnate-word', 'texas-am-corpus-christi', 'lamar', 'uh-arlington']
};

// Get ESPN ID for a team slug
function getTeamESPNId(slug) {
  return ESPN_TEAM_IDS[slug] || null;
}

// Get conference for a team
function getTeamConference(slug) {
  for (const [conf, teams] of Object.entries(CONFERENCE_TEAMS)) {
    if (teams.includes(slug)) return conf;
  }
  return null;
}

// Export
window.ESPN_TEAM_IDS = ESPN_TEAM_IDS;
window.CONFERENCE_TEAMS = CONFERENCE_TEAMS;
window.getTeamESPNId = getTeamESPNId;
window.getTeamConference = getTeamConference;
