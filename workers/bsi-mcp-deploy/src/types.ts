/**
 * BSI MCP Deploy - Type Definitions
 */

export interface Env {
  MCP_STATE: KVNamespace;
  GITHUB_TOKEN: string;
  CLOUDFLARE_API_TOKEN?: string;
  OAUTH_CLIENT_ID?: string;
  OAUTH_CLIENT_SECRET?: string;
  GITHUB_REPO: string;
  GITHUB_WORKFLOW_FILE: string;
}

// MCP Protocol Types
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

// GitHub API Types
export interface GitHubWorkflowDispatchInput {
  site: 'all' | 'blazesportsintel' | 'blazecraft';
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_started_at: string | null;
  jobs_url: string;
}

export interface GitHubWorkflowRunsResponse {
  total_count: number;
  workflow_runs: GitHubWorkflowRun[];
}

export interface GitHubWorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  steps: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    number: number;
  }>;
}

export interface GitHubJobsResponse {
  total_count: number;
  jobs: GitHubWorkflowJob[];
}

// OAuth Types
export interface OAuthState {
  state: string;
  createdAt: number;
  redirectUri: string;
}

export interface OAuthToken {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  scope: string;
}

// Deployment Status
export interface DeploymentStatus {
  runId: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'pending';
  url: string;
  startedAt: string | null;
  updatedAt: string;
  jobs: Array<{
    name: string;
    status: string;
    conclusion: string | null;
  }>;
}
