/**
 * GitHub API Integration
 * Handles workflow_dispatch triggers and status queries
 */

import type {
  Env,
  GitHubWorkflowDispatchInput,
  GitHubWorkflowRun,
  GitHubWorkflowRunsResponse,
  GitHubJobsResponse,
  DeploymentStatus,
} from './types';

const GITHUB_API_BASE = 'https://api.github.com';

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'BSI-MCP-Deploy/1.0',
  };
}

/**
 * Trigger a workflow_dispatch event on the deploy workflow
 */
export async function triggerDeployment(
  env: Env,
  input: GitHubWorkflowDispatchInput
): Promise<{ success: boolean; message: string; runId?: number }> {
  const url = `${GITHUB_API_BASE}/repos/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW_FILE}/dispatches`;

  const response = await fetch(url, {
    method: 'POST',
    headers: githubHeaders(env.GITHUB_TOKEN),
    body: JSON.stringify({
      ref: 'main',
      inputs: { site: input.site },
    }),
  });

  if (response.status === 204) {
    // workflow_dispatch returns 204 on success, no body
    // Fetch the most recent run to get the run ID
    const recentRun = await getLatestWorkflowRun(env);
    return {
      success: true,
      message: `Deployment triggered for ${input.site}`,
      runId: recentRun?.id,
    };
  }

  const errorText = await response.text();
  return {
    success: false,
    message: `Failed to trigger deployment: ${response.status} - ${errorText}`,
  };
}

/**
 * Get the most recent workflow run
 */
async function getLatestWorkflowRun(env: Env): Promise<GitHubWorkflowRun | null> {
  const url = `${GITHUB_API_BASE}/repos/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW_FILE}/runs?per_page=1`;

  const response = await fetch(url, {
    headers: githubHeaders(env.GITHUB_TOKEN),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GitHubWorkflowRunsResponse;
  return data.workflow_runs[0] || null;
}

/**
 * Get deployment status by run ID or latest run
 */
export async function getDeploymentStatus(
  env: Env,
  runId?: number
): Promise<DeploymentStatus | null> {
  let run: GitHubWorkflowRun | null = null;

  if (runId) {
    const url = `${GITHUB_API_BASE}/repos/${env.GITHUB_REPO}/actions/runs/${runId}`;
    const response = await fetch(url, {
      headers: githubHeaders(env.GITHUB_TOKEN),
    });
    if (response.ok) {
      run = (await response.json()) as GitHubWorkflowRun;
    }
  } else {
    run = await getLatestWorkflowRun(env);
  }

  if (!run) {
    return null;
  }

  // Fetch job details
  const jobsResponse = await fetch(run.jobs_url, {
    headers: githubHeaders(env.GITHUB_TOKEN),
  });

  const jobs: Array<{ name: string; status: string; conclusion: string | null }> = [];

  if (jobsResponse.ok) {
    const jobsData = (await jobsResponse.json()) as GitHubJobsResponse;
    for (const job of jobsData.jobs) {
      jobs.push({
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
      });
    }
  }

  return {
    runId: run.id,
    status: run.status,
    conclusion: run.conclusion || 'pending',
    url: run.html_url,
    startedAt: run.run_started_at,
    updatedAt: run.updated_at,
    jobs,
  };
}

/**
 * Get workflow run logs (summary, not full logs due to size)
 */
export async function getDeploymentLogs(
  env: Env,
  runId?: number
): Promise<{ runId: number; logs: string } | null> {
  let targetRunId = runId;

  if (!targetRunId) {
    const latestRun = await getLatestWorkflowRun(env);
    if (!latestRun) {
      return null;
    }
    targetRunId = latestRun.id;
  }

  // Get jobs for the run to build a summary
  const jobsUrl = `${GITHUB_API_BASE}/repos/${env.GITHUB_REPO}/actions/runs/${targetRunId}/jobs`;
  const response = await fetch(jobsUrl, {
    headers: githubHeaders(env.GITHUB_TOKEN),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GitHubJobsResponse;

  // Build a human-readable log summary
  const lines: string[] = [`=== Deployment Run #${targetRunId} ===`, ''];

  for (const job of data.jobs) {
    const status = job.conclusion || job.status;
    const statusIcon = status === 'success' ? '[OK]' : status === 'failure' ? '[FAIL]' : '[...]';
    lines.push(`${statusIcon} ${job.name}`);

    for (const step of job.steps) {
      const stepStatus = step.conclusion || step.status;
      const stepIcon =
        stepStatus === 'success' ? '  [OK]' : stepStatus === 'failure' ? '  [FAIL]' : '  [...]';
      lines.push(`${stepIcon} ${step.name}`);
    }
    lines.push('');
  }

  return {
    runId: targetRunId,
    logs: lines.join('\n'),
  };
}
