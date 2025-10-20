import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

type JsonSchema = Record<string, unknown>;

interface ManifestTool {
  name: string;
  title: string;
  description: string;
  input_schema: JsonSchema;
}

interface Manifest {
  name: string;
  version: string;
  tools: ManifestTool[];
}

const SOCCER_PATTERN = /\bsoccer\b/i;

const teamSnapshotSchema = z.object({
  season: z
    .string()
    .regex(/^\d{4}$/, 'Season must be a four-digit year (e.g., 2025).'),
  focus: z
    .enum(['overview', 'lineup', 'rotation', 'bullpen', 'defense', 'player-development'])
    .optional(),
  context: z.string().trim().min(1).max(280).optional(),
});

type TeamSnapshotArgs = z.infer<typeof teamSnapshotSchema>;

const recruitingSchema = z.object({
  classYear: z
    .string()
    .regex(/^\d{4}$/, 'Class year must be a four-digit year (e.g., 2026).'),
  includePortal: z.boolean().default(true),
  priorityNeeds: z.array(z.string().trim().min(1)).max(5).optional(),
});

type RecruitingArgs = z.infer<typeof recruitingSchema>;

const gameNotesSchema = z.object({
  opponent: z.string().trim().min(2, 'Opponent name is required.'),
  gameDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, 'Use ISO date format YYYY-MM-DD.')
    .optional(),
  seriesType: z.enum(['regular', 'postseason']).default('regular'),
});

type GameNotesArgs = z.infer<typeof gameNotesSchema>;

const manifest: Manifest = {
  name: 'bsi-longhorns-mcp',
  version: '0.1.0',
  tools: [
    {
      name: 'longhorns_fetch_team_snapshot',
      title: 'Texas Longhorns Team Snapshot',
      description:
        'Returns a placeholder overview of the Texas Longhorns baseball program for a given season focus area.',
      input_schema: zodToJsonSchema(teamSnapshotSchema, {
        target: 'jsonSchema7',
        name: 'LonghornsTeamSnapshot',
      }) as JsonSchema,
    },
    {
      name: 'longhorns_fetch_recruiting_board',
      title: 'Texas Longhorns Recruiting Board',
      description:
        'Summarises recruiting priorities and placeholder intel for the requested class year.',
      input_schema: zodToJsonSchema(recruitingSchema, {
        target: 'jsonSchema7',
        name: 'LonghornsRecruitingBoard',
      }) as JsonSchema,
    },
    {
      name: 'longhorns_fetch_game_notes',
      title: 'Texas Longhorns Game Notes',
      description:
        'Provides placeholder game notes for the Texas Longhorns baseball matchup against a specific opponent.',
      input_schema: zodToJsonSchema(gameNotesSchema, {
        target: 'jsonSchema7',
        name: 'LonghornsGameNotes',
      }) as JsonSchema,
    },
  ],
};

const server = new McpServer({
  name: manifest.name,
  version: manifest.version,
});

function assertNoSoccer(value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === 'string') {
    if (SOCCER_PATTERN.test(value)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Soccer is out of scope. Stay locked on college baseball intel.'
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      assertNoSoccer(item);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      assertNoSoccer(nested);
    }
  }
}

function formatChicagoTimestamp(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const year = lookup('year');
  const month = lookup('month');
  const day = lookup('day');
  const hour = lookup('hour');
  const minute = lookup('minute');

  return `${year}-${month}-${day} ${hour}:${minute} CDT`;
}

function buildCitation(source: string, timestamp = new Date()): string {
  return `[Source: ${source}, ${formatChicagoTimestamp(timestamp)}]`;
}

server.registerTool(
  'longhorns_fetch_team_snapshot',
  {
    title: 'Texas Longhorns Team Snapshot',
    description:
      'Returns a placeholder overview of the Texas Longhorns baseball program for a given season focus area.',
    inputSchema: teamSnapshotSchema,
  },
  async (args: TeamSnapshotArgs) => {
    assertNoSoccer(args);

    const lines = [
      `Texas Longhorns baseball ${args.season} snapshot (${args.focus ?? 'overview'}) — placeholder data only.`,
      '- Lineup outlook: Awaiting data integration.',
      '- Pitching plan: Pending analytics sync.',
      '- Development focus: Tracking player development metrics.',
    ];

    if (args.context) {
      lines.push(`Context: ${args.context}`);
    }

    lines.push(buildCitation('texaslonghorns.com'));

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  }
);

server.registerTool(
  'longhorns_fetch_recruiting_board',
  {
    title: 'Texas Longhorns Recruiting Board',
    description:
      'Summarises recruiting priorities and placeholder intel for the requested class year.',
    inputSchema: recruitingSchema,
  },
  async (args: RecruitingArgs) => {
    assertNoSoccer(args);

    const needs = args.priorityNeeds?.length
      ? args.priorityNeeds.map((need) => `• Priority need: ${need}`).join('\n')
      : '• Priority needs pending staff review.';

    const portalFlag = args.includePortal ? 'transfer portal actions included' : 'transfer portal excluded';

    const lines = [
      `Texas Longhorns baseball recruiting board for class ${args.classYear} — placeholder data only.`,
      `• Portal coverage: ${portalFlag}.`,
      needs,
      buildCitation('d1baseball.com'),
    ];

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  }
);

server.registerTool(
  'longhorns_fetch_game_notes',
  {
    title: 'Texas Longhorns Game Notes',
    description:
      'Provides placeholder game notes for the Texas Longhorns baseball matchup against a specific opponent.',
    inputSchema: gameNotesSchema,
  },
  async (args: GameNotesArgs) => {
    assertNoSoccer(args);

    const lines = [
      `Texas vs. ${args.opponent} (${args.seriesType}) game notes — placeholder content.`,
      args.gameDate ? `• Game date: ${args.gameDate} (America/Chicago).` : '• Game date pending scheduling feed.',
      '• Key matchups: To be pulled from advanced scouting database.',
      '• Trends: Waiting on latest Statcast ingest.',
      buildCitation('big12sports.com'),
    ];

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  }
);

export { manifest, server };

export async function startLonghornsServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startLonghornsServer().catch((error) => {
    console.error('Failed to start Longhorns MCP server:', error);
    process.exit(1);
  });
}
