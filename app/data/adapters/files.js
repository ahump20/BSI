/**
 * File-based Data Adapter
 * Reads CSV/JSON assets referenced in Notion Master Index
 */

import { FBSData, Teams } from '../schema.js';

async function loadJSON(url) {
  try {
    console.log(`Loading JSON: ${url}`);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`JSON loaded successfully: ${url}`);
    return data;
  } catch (error) {
    console.error(`Failed to load JSON from ${url}:`, error);
    throw error;
  }
}

async function loadCSV(url) {
  try {
    console.log(`Loading CSV: ${url}`);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines
      .slice(1)
      .map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));

    console.log(`CSV loaded successfully: ${url} (${rows.length} rows)`);
    return { headers, rows };
  } catch (error) {
    console.error(`Failed to load CSV from ${url}:`, error);
    throw error;
  }
}

export async function getFBSFromFiles(jsonUrl, csvUrl) {
  try {
    // Prefer JSON; fallback to CSV transform
    const data = await loadJSON(jsonUrl);
    return FBSData.parse(data);
  } catch (jsonError) {
    console.warn('JSON failed, trying CSV fallback:', jsonError.message);

    try {
      const csvData = await loadCSV(csvUrl);

      // Transform CSV to FBSData format
      const conferenceIndex = csvData.headers.findIndex((h) =>
        h.toLowerCase().includes('conference')
      );
      const teamIndex = csvData.headers.findIndex((h) => h.toLowerCase().includes('team'));

      if (conferenceIndex === -1 || teamIndex === -1) {
        throw new Error('CSV missing required conference or team columns');
      }

      const conferenceMap = new Map();

      for (const row of csvData.rows) {
        const conference = row[conferenceIndex];
        const team = row[teamIndex];

        if (!conference || !team) continue;

        if (!conferenceMap.has(conference)) {
          conferenceMap.set(conference, {
            id: conference.toLowerCase().replace(/\s+/g, '-'),
            name: conference,
            teams: [],
          });
        }

        conferenceMap.get(conference).teams.push(team);
      }

      const transformed = Array.from(conferenceMap.values());
      return FBSData.parse(transformed);
    } catch (csvError) {
      console.error('Both JSON and CSV failed:', {
        jsonError: jsonError.message,
        csvError: csvError.message,
      });
      throw new Error('FBS data unavailable from both JSON and CSV sources');
    }
  }
}

export async function getTeamsFromFiles(url) {
  try {
    const data = await loadJSON(url);
    return Teams.parse(data);
  } catch (error) {
    console.error(`Failed to load teams from ${url}:`, error);
    throw new Error(`Teams data unavailable from ${url}`);
  }
}

export async function getBlazeData() {
  try {
    const data = await loadJSON('/data/blaze-sports-data-2025.json');
    return data;
  } catch (error) {
    console.error('Failed to load Blaze sports data:', error);
    throw new Error('Blaze sports data unavailable');
  }
}

// Helper for NIL template downloads
export async function getNILTemplates() {
  try {
    const data = await loadJSON('/data/nil-templates.json');
    return data.templates || [];
  } catch (error) {
    console.error('Failed to load NIL templates:', error);
    return [];
  }
}
