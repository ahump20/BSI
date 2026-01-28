/**
 * MCP Tool Definitions and Handlers
 */

import type { Env, MCPTool, MCPToolResult, GitHubWorkflowDispatchInput } from './types';
import { triggerDeployment, getDeploymentStatus, getDeploymentLogs } from './github';
import { listWorkers, listKVNamespaces, listD1Databases, listR2Buckets, getWorkerRoutes } from './cloudflare';

export const TOOLS: MCPTool[] = [
  {
    name: 'trigger_deployment',
    description:
      'Trigger a deployment to Cloudflare via GitHub Actions. Deploys BlazeSportsIntel, BlazeCraft, or both sites.',
    inputSchema: {
      type: 'object',
      properties: {
        site: {
          type: 'string',
          enum: ['all', 'blazesportsintel', 'blazecraft'],
          description: 'Which site(s) to deploy: all, blazesportsintel, or blazecraft',
        },
      },
      required: ['site'],
    },
  },
  {
    name: 'get_deployment_status',
    description:
      'Get the current status of a deployment. Returns workflow status, job statuses, and conclusion.',
    inputSchema: {
      type: 'object',
      properties: {
        run_id: {
          type: 'number',
          description: 'Optional: specific run ID to check. If not provided, returns latest run.',
        },
      },
    },
  },
  {
    name: 'get_deployment_logs',
    description:
      'Get deployment logs and step summary for a workflow run. Shows which steps succeeded or failed.',
    inputSchema: {
      type: 'object',
      properties: {
        run_id: {
          type: 'number',
          description: 'Optional: specific run ID to fetch logs for. If not provided, returns latest run.',
        },
      },
    },
  },
  {
    name: 'list_workers',
    description: 'List all Cloudflare Workers in the BSI account. Shows worker names and last modified dates.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_kv_namespaces',
    description: 'List all Cloudflare KV namespaces in the BSI account.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_d1_databases',
    description: 'List all Cloudflare D1 databases in the BSI account.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_r2_buckets',
    description: 'List all Cloudflare R2 storage buckets in the BSI account.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_worker_routes',
    description: 'Get all Worker routes configured for a specific domain (e.g., blazesportsintel.com or blazecraft.app).',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'The domain to check routes for (e.g., blazesportsintel.com, blazecraft.app)',
        },
      },
      required: ['domain'],
    },
  },
];

export async function handleToolCall(
  env: Env,
  toolName: string,
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  switch (toolName) {
    case 'trigger_deployment': {
      const site = args.site as GitHubWorkflowDispatchInput['site'];
      if (!['all', 'blazesportsintel', 'blazecraft'].includes(site)) {
        return {
          content: [{ type: 'text', text: `Invalid site: ${site}. Must be all, blazesportsintel, or blazecraft.` }],
          isError: true,
        };
      }

      const result = await triggerDeployment(env, { site });
      if (result.success) {
        const message = result.runId
          ? `${result.message}\n\nRun ID: ${result.runId}\nUse get_deployment_status to check progress.`
          : result.message;
        return { content: [{ type: 'text', text: message }] };
      }
      return { content: [{ type: 'text', text: result.message }], isError: true };
    }

    case 'get_deployment_status': {
      const runId = args.run_id as number | undefined;
      const status = await getDeploymentStatus(env, runId);

      if (!status) {
        return { content: [{ type: 'text', text: 'No deployment runs found.' }], isError: true };
      }

      const statusEmoji =
        status.conclusion === 'success'
          ? 'SUCCESS'
          : status.conclusion === 'failure'
            ? 'FAILED'
            : status.status === 'in_progress'
              ? 'IN PROGRESS'
              : status.status === 'queued'
                ? 'QUEUED'
                : status.conclusion?.toUpperCase() || 'UNKNOWN';

      const jobSummary = status.jobs
        .map((j) => `  - ${j.name}: ${j.conclusion || j.status}`)
        .join('\n');

      const text = `
Deployment Status: ${statusEmoji}
Run ID: ${status.runId}
URL: ${status.url}
Started: ${status.startedAt || 'Not started'}
Updated: ${status.updatedAt}

Jobs:
${jobSummary || '  No jobs yet'}
`.trim();

      return { content: [{ type: 'text', text }] };
    }

    case 'get_deployment_logs': {
      const runId = args.run_id as number | undefined;
      const logs = await getDeploymentLogs(env, runId);

      if (!logs) {
        return { content: [{ type: 'text', text: 'No logs available.' }], isError: true };
      }

      return { content: [{ type: 'text', text: logs.logs }] };
    }

    case 'list_workers': {
      const result = await listWorkers(env);
      return { content: [{ type: 'text', text: result }] };
    }

    case 'list_kv_namespaces': {
      const result = await listKVNamespaces(env);
      return { content: [{ type: 'text', text: result }] };
    }

    case 'list_d1_databases': {
      const result = await listD1Databases(env);
      return { content: [{ type: 'text', text: result }] };
    }

    case 'list_r2_buckets': {
      const result = await listR2Buckets(env);
      return { content: [{ type: 'text', text: result }] };
    }

    case 'get_worker_routes': {
      const domain = args.domain as string;
      if (!domain) {
        return { content: [{ type: 'text', text: 'Missing domain parameter' }], isError: true };
      }
      const result = await getWorkerRoutes(env, domain);
      return { content: [{ type: 'text', text: result }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
  }
}
