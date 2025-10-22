import { recordRuntimeEvent } from '../observability/datadog-runtime';
import { trackRumAction, logClientEvent } from '../observability/datadog';

export async function recordConversionEvent(
  name: string,
  tags: Record<string, string | number | boolean> = {},
  metadata: Record<string, unknown> = {}
) {
  await recordRuntimeEvent(name, tags, metadata);
}

export function trackClientConversion(
  name: string,
  attributes: Record<string, unknown> = {}
) {
  logClientEvent(name, attributes);
  trackRumAction(name, attributes);
}
