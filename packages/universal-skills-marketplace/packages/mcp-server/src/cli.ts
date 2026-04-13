#!/usr/bin/env node
/**
 * CLI entry point for running the Universal Skills MCP server over stdio.
 *
 * Usage: npx @blazesportsintel/universal-skills-mcp
 *
 * This is the stdio transport — for remote HTTP, use the Cloudflare Worker.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./index.js";

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Universal Skills MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting Universal Skills MCP server:", err);
  process.exit(1);
});
