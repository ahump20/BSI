import { NextResponse } from 'next/server';
import { runScenarioSimulation } from '@/lib/cfp';
import type { ScenarioSimulationRequest, ScenarioSimulationResponse } from '@/lib/cfp';

async function callWorker(
  workerBase: string,
  payload: ScenarioSimulationRequest
): Promise<ScenarioSimulationResponse | null> {
  try {
    const response = await fetch(`${workerBase.replace(/\/$/u, '')}/cfp/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ScenarioSimulationResponse;
  } catch (error) {
    console.error('[CFP API] Scenario worker call failed:', error);
    return null;
  }
}

export async function POST(request: Request) {
  let payload: ScenarioSimulationRequest;

  try {
    payload = (await request.json()) as ScenarioSimulationRequest;
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload', details: (error as Error).message },
      { status: 400 }
    );
  }

  const workerBase = process.env.CFP_WORKER_BASE_URL;
  if (workerBase) {
    const workerResult = await callWorker(workerBase, payload);
    if (workerResult) {
      return NextResponse.json(workerResult, { headers: { 'Cache-Control': 'no-store' } });
    }
  }

  const fallback = runScenarioSimulation(payload);
  return NextResponse.json(fallback, { headers: { 'Cache-Control': 'no-store' } });
}
