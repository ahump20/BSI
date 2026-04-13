/**
 * Universal Skills MCP Server
 *
 * Context7-pattern: trivial entry point that creates the server and
 * registers 3 tools. All real logic lives in tools/ and lib/.
 *
 * Unofficial. Not affiliated with Anthropic or OpenAI.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools/register.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "universal-skills",
    version: "0.1.0",
    description:
      "Search and install skills from both Claude Code and OpenAI Codex ecosystems. Unofficial bridge — not affiliated with Anthropic or OpenAI.",
  });

  registerTools(server);

  return server;
}

export { McpServer };
