export interface Env {
  ENVIRONMENT?: string;
}

interface StatusResponse {
  ok: boolean;
  status: 'ok';
  environment: string;
  timestamp: string;
  timezone: 'America/Chicago';
  colo: string;
  region: string;
}

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Chicago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function formatChicagoTimestamp(date: Date): string {
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const datePart = `${lookup.year}-${lookup.month}-${lookup.day}`;
  const timePart = `${lookup.hour}:${lookup.minute}:${lookup.second}`;
  const zoneName = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    timeZoneName: 'short',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;
  return `${datePart}T${timePart}${zoneName ? ` ${zoneName}` : ''}`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  const cf = (request as Request & { cf?: { colo?: string; region?: string } }).cf;
  const response: StatusResponse = {
    ok: true,
    status: 'ok',
    environment: env.ENVIRONMENT ?? 'production',
    timestamp: formatChicagoTimestamp(new Date()),
    timezone: 'America/Chicago',
    colo: cf?.colo ?? 'unknown',
    region: cf?.region ?? 'unknown',
  };

  return new Response(JSON.stringify(response), { status: 200, headers });
};
