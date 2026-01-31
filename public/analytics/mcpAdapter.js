// MCP Data Adapter for Blaze Sports Intel
// This adapter follows the pattern of existing data adapters in the project.
// It fetches data from the Cloudflare MCP (Multi-Channel Provider) endpoints and returns JSON.
export async function fetchMCPData(endpoint, params = {}) {
  const baseUrl = 'https://mcp.api.blazesportsintel.com/';
  const url = new URL(endpoint, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`MCP API request failed: ${response.status}`);
  }
  return await response.json();
}
