/**
 * Notion Master Index Adapter
 * Reads portfolio items, resources, and asset links
 */

import { PortfolioList } from '../schema.js';

const NOTION_INDEX_URL = '/data/notion_index.json';

async function loadNotionIndex() {
  try {
    console.log('Loading Notion Master Index...');
    const response = await fetch(NOTION_INDEX_URL, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Notion index loaded successfully');
    return data;
  } catch (error) {
    console.error('Failed to load Notion index:', error);
    throw new Error('Notion Master Index unavailable');
  }
}

export async function getPortfolio() {
  try {
    const index = await loadNotionIndex();

    if (!index.portfolio || !Array.isArray(index.portfolio)) {
      throw new Error('Portfolio data not found in Notion index');
    }

    return PortfolioList.parse(index.portfolio);
  } catch (error) {
    console.error('Portfolio fetch failed:', error);
    throw new Error('Portfolio data unavailable');
  }
}

export async function getResources() {
  try {
    const index = await loadNotionIndex();

    if (!index.resources || !Array.isArray(index.resources)) {
      throw new Error('Resources data not found in Notion index');
    }

    // Resources don't need strict validation - they're just links/files
    return index.resources;
  } catch (error) {
    console.error('Resources fetch failed:', error);
    throw new Error('Resources data unavailable');
  }
}

export async function getAssetLinks() {
  try {
    const index = await loadNotionIndex();

    return {
      fbsJson: index.assets?.fbs_power_conferences_json,
      fbsCsv: index.assets?.fbs_power_conferences_csv,
      mlbTeams: index.assets?.mlb_teams_json,
      nflTeams: index.assets?.nfl_teams_json,
      fcsTeams: index.assets?.fcs_teams_json,
      blazeData: index.assets?.blaze_sports_data_json,
      nilTemplates: index.assets?.nil_templates_json,
    };
  } catch (error) {
    console.error('Asset links fetch failed:', error);
    // Return default paths if Notion unavailable
    return {
      fbsJson: '/data/fbs_power_conferences_2025.json',
      fbsCsv: '/data/fbs_power_conferences_2025.csv',
      mlbTeams: '/data/mlb_teams.json',
      nflTeams: '/data/nfl_teams.json',
      fcsTeams: '/data/fcs_teams.json',
      blazeData: '/data/blaze-sports-data-2025.json',
      nilTemplates: '/data/nil-templates.json',
    };
  }
}

export async function getAdminLinks() {
  try {
    const index = await loadNotionIndex();

    return {
      cms: index.admin?.cms_url,
      dashboard: index.admin?.dashboard_url,
      analytics: index.admin?.analytics_url,
    };
  } catch (error) {
    console.error('Admin links fetch failed:', error);
    return {};
  }
}
