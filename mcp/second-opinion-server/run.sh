#!/bin/bash
# Load environment variables from BSI .env file
set -a
source "/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/BSI/.env" 2>/dev/null
set +a

# Run the MCP server
exec npx tsx "/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/BSI/mcp/second-opinion-server/index.ts"
