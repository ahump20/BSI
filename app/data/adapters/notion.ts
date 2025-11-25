// Notion data adapter for portfolio and content management

import { schema, type PortfolioItem } from '../schema';

// Notion API configuration
const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

interface NotionConfig {
  token?: string;
  databaseId?: string;
}

class NotionAdapter {
  private config: NotionConfig;

  constructor(config: NotionConfig = {}) {
    this.config = {
      token: config.token || process.env.NOTION_TOKEN,
      databaseId: config.databaseId || process.env.NOTION_DATABASE_ID,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.config.token) {
      throw new Error('Notion API token not configured');
    }

    const response = await fetch(`${NOTION_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getPortfolio(): Promise<PortfolioItem[]> {
    if (!this.config.databaseId) {
      throw new Error('Notion database ID not configured');
    }

    const data = await this.request<any>(`/databases/${this.config.databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          property: 'Status',
          select: {
            equals: 'Published',
          },
        },
        sorts: [
          {
            property: 'Created',
            direction: 'descending',
          },
        ],
      }),
    });

    return this.transformNotionResults(data.results);
  }

  private transformNotionResults(results: any[]): PortfolioItem[] {
    return results
      .map((page) => {
        const props = page.properties;

        return {
          id: page.id,
          title: this.getTextProperty(props.Title || props.Name),
          description: this.getTextProperty(props.Description),
          url: this.getUrlProperty(props.URL) || this.getTextProperty(props.Link),
          category: this.getSelectProperty(props.Category),
          tags: this.getMultiSelectProperty(props.Tags),
          thumbnail: this.getFilesProperty(props.Thumbnail)?.[0],
        };
      })
      .filter((item) => item.title && item.url);
  }

  private getTextProperty(prop: any): string {
    if (!prop) return '';

    if (prop.type === 'title') {
      return prop.title?.[0]?.plain_text || '';
    }

    if (prop.type === 'rich_text') {
      return prop.rich_text?.[0]?.plain_text || '';
    }

    return '';
  }

  private getUrlProperty(prop: any): string {
    if (!prop || prop.type !== 'url') return '';
    return prop.url || '';
  }

  private getSelectProperty(prop: any): string {
    if (!prop || prop.type !== 'select') return '';
    return prop.select?.name || '';
  }

  private getMultiSelectProperty(prop: any): string[] {
    if (!prop || prop.type !== 'multi_select') return [];
    return prop.multi_select?.map((item: any) => item.name) || [];
  }

  private getFilesProperty(prop: any): string | undefined {
    if (!prop || prop.type !== 'files') return undefined;
    const file = prop.files?.[0];
    if (file?.type === 'external') {
      return file.external?.url;
    }
    if (file?.type === 'file') {
      return file.file?.url;
    }
    return undefined;
  }

  async syncContent(): Promise<void> {
    // Sync Notion content to local cache
    const portfolio = await this.getPortfolio();

    // Store in localStorage or IndexedDB for offline access
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'notion-portfolio-cache',
        JSON.stringify({
          data: portfolio,
          timestamp: Date.now(),
        })
      );
    }
  }

  getCachedPortfolio(): PortfolioItem[] | null {
    if (typeof window === 'undefined') return null;

    const cached = localStorage.getItem('notion-portfolio-cache');
    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      // Return cached data if less than 1 hour old
      if (age < 3600000) {
        return data;
      }
    } catch (error) {
      console.error('Failed to parse cached portfolio:', error);
    }

    return null;
  }
}

// Create singleton instance
const notion = new NotionAdapter();

// Export methods
export async function getPortfolio(): Promise<PortfolioItem[]> {
  // Try cache first
  const cached = notion.getCachedPortfolio();
  if (cached) return cached;

  // Fallback to API
  try {
    const portfolio = await notion.getPortfolio();
    return schema.portfolio(portfolio);
  } catch (error) {
    console.error('Failed to fetch portfolio from Notion:', error);

    // Final fallback to static file
    const response = await fetch('/data/portfolio-fallback.json');
    const data = await response.json();
    return schema.portfolio(data);
  }
}

export { notion };
