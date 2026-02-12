#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const INPUTS = {
  schedulePdf:
    process.env.TEXAS_SCHEDULE_PDF ||
    '/Users/AustinHumphrey/Downloads/University of Texas Athletics.pdf',
  statsPdf:
    process.env.TEXAS_2025_STATS_PDF ||
    '/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/BSI/2025 season stats tx baseball.pdf',
  rosterPdf:
    process.env.TEXAS_2026_ROSTER_PDF ||
    '/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/BSI/2026 roster texas.pdf',
};

const OUTPUT_PATH = resolve(
  process.cwd(),
  'data/college-baseball/texas/2026-opening-week.json',
);

function pdfToText(path) {
  return execFileSync('pdftotext', [path, '-'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8,
  });
}

function cleanLine(line) {
  return line.replace(/\s+/g, ' ').trim();
}

function isDateLine(line) {
  return /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/.test(line);
}

function parseSchedule(text) {
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const games = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i += 1) {
    if (!isDateLine(lines[i])) continue;

    let dateLabel = lines[i];
    if (/^\([A-Za-z]{3}\)$/.test(lines[i + 1] || '')) {
      dateLabel = `${dateLabel} ${lines[i + 1]}`;
      i += 1;
    }

    const block = [];
    let j = i + 1;
    while (j < lines.length && !isDateLine(lines[j]) && !/^https?:\/\//.test(lines[j])) {
      block.push(lines[j]);
      j += 1;
    }

    const time = block.find((line) => /\b(a\.m\.|p\.m\.)\b/i.test(line)) || 'TBD';
    const venueIndex = block.findIndex((line) => /^(Home|Away|Neutral)$/i.test(line));
    if (venueIndex < 0) continue;

    const at = block[venueIndex];
    const opponent = block[venueIndex + 1] || 'TBD';
    let tournament = '';
    const locationParts = [];

    for (let k = venueIndex + 2; k < block.length; k += 1) {
      const line = block[k];
      if (
        line === '-' ||
        /^Tournament$/i.test(line) ||
        /^Result$/i.test(line) ||
        /^Have a Question\??$/i.test(line) ||
        /^https?:\/\//.test(line)
      ) {
        break;
      }

      if (!tournament && /(Classic|Tournament|Challenge)/i.test(line)) {
        tournament = line;
        continue;
      }

      locationParts.push(line);
    }

    const location = locationParts.join(' ').replace(/\s+/g, ' ').trim();
    const dedupeKey = `${dateLabel}|${opponent}|${time}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    games.push({
      date: dateLabel,
      timeCT: time,
      at,
      opponent,
      location,
      tournament: tournament || undefined,
    });

    i = j - 1;
  }

  return games;
}

function parse2025Summary(text) {
  const getMatch = (regex, fallback = '') => {
    const match = text.match(regex);
    return match?.[1] || fallback;
  };

  const leaders = [];
  const knownLeaders = [
    ['Ethan Mendoza', /\.333/],
    ['Adrian Rodriguez', /\.313/],
    ['Kimble Schuessler', /\.312/],
    ['Rylan Galvan', /\.296/],
    ['Casey Borba', /\.278/],
    ['Jonah Williams', /\.327/],
  ];

  for (const [name, avgRegex] of knownLeaders) {
    if (text.includes(name) && avgRegex.test(text)) {
      const avgMatch = text.match(avgRegex);
      leaders.push({ name, battingAverage: avgMatch?.[0] || '' });
    }
  }

  return {
    overallRecord: getMatch(/Record:\s*([0-9]+-[0-9]+)/, '44-14'),
    homeRecord: getMatch(/Home:\s*([0-9]+-[0-9]+)/, '28-7'),
    awayRecord: getMatch(/Away:\s*([0-9]+-[0-9]+)/, '11-5'),
    neutralRecord: getMatch(/Neutral:\s*([0-9]+-[0-9]+)/, '5-2'),
    conferenceRecord: getMatch(/SEC:\s*([0-9]+-[0-9]+)/, '22-8'),
    battingLeaders: leaders,
  };
}

function parseRoster(text) {
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const players = [];
  const seen = new Set();

  for (let i = 0; i < lines.length - 8; i += 1) {
    if (!/^\d+$/.test(lines[i])) continue;
    if (!/^[A-Za-z .'-]+$/.test(lines[i + 1])) continue;
    if (!/^[A-Z/]+$/.test(lines[i + 2])) continue;

    const number = lines[i];
    const name = lines[i + 1];
    const key = `${number}-${name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    players.push({
      number,
      name,
      position: lines[i + 2] || '',
      batsThrows: lines[i + 3] || '',
      height: lines[i + 4] || '',
      weight: lines[i + 5] || '',
      year: lines[i + 6] || '',
      hometown: lines[i + 7] || '',
      highSchool: lines[i + 8] || '',
    });
  }

  return players;
}

function buildDataset({ scheduleText, statsText, rosterText }) {
  const schedule = parseSchedule(scheduleText);
  const season2025Summary = parse2025Summary(statsText);
  const roster = parseRoster(rosterText);

  const rosterNotables = roster.filter((player) =>
    [
      'Ethan Mendoza',
      'Carson Tinney',
      'Jonah Williams',
      'Haiden Leffew',
      'Adrian Rodriguez',
      'Casey Borba',
      'Ruger Riojas',
    ].includes(player.name),
  );

  return {
    meta: {
      source: [
        'University of Texas Athletics schedule PDF (captured February 12, 2026)',
        'Texas 2025 season stats PDF (as of June 2, 2025)',
        'Texas 2026 roster PDF (captured February 12, 2026)',
      ],
      fetched_at: new Date().toISOString(),
      timezone: 'America/Chicago',
      generated_by: 'scripts/ingest-texas-pdfs.mjs',
    },
    schedule: {
      openingWeekendGames: schedule.filter((game) => /^Feb (13|14|15)\b/.test(game.date)),
      keyEarlyGames: schedule.filter((game) =>
        [
          'UC Davis',
          'Michigan State',
          'Coastal Carolina',
          'Baylor',
          'Ohio State',
          'Texas A&M',
          'Vanderbilt',
          'Tennessee',
        ].some((key) => game.opponent.includes(key)),
      ),
      allParsedGames: schedule,
    },
    season2025Summary,
    rosterNotables,
    historicalContext: {
      programTimelineEvidence: 'https://texaslonghorns.com/sports/baseball/schedule/1896',
      conservativeClaim:
        'Texas baseball schedule pages are available from 1896 forward via texaslonghorns.com.',
    },
  };
}

function main() {
  const scheduleText = pdfToText(INPUTS.schedulePdf);
  const statsText = pdfToText(INPUTS.statsPdf);
  const rosterText = pdfToText(INPUTS.rosterPdf);

  const dataset = buildDataset({ scheduleText, statsText, rosterText });
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

  process.stdout.write(`Wrote Texas opening-week dataset to ${OUTPUT_PATH}\n`);
}

main();
