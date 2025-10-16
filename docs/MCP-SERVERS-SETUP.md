# MCP Servers Setup for Blaze Sports Intel

## 📦 Installed MCP Servers

This document describes the **6 MCP servers** now configured for Claude Code, enabling powerful integrations with Cloudflare, GitHub, web search, filesystem operations, and databases.

---

## ✅ Configured Servers

### 1. **Cloudflare MCP Server** ⭐

**Package**: `@cloudflare/mcp-server-cloudflare` (v0.2.0)

**Capabilities**:
- Manage Cloudflare Workers deployments
- Query D1 databases
- Monitor KV storage
- Configure DNS settings
- Access edge analytics
- Control R2 bucket operations

**Configuration**:
- ✅ API Token: Configured from environment
- ✅ Account ID: a12cb329d84130460eed99b816e4d0d3

**Example Commands**:
```
"Deploy the latest build to blazesportsintel.com"
"Show me KV cache hit rates for the football API"
"List all Workers in my Cloudflare account"
"Query D1 database for recent game scores"
```

---

### 2. **GitHub MCP Server** ⭐

**Package**: `@modelcontextprotocol/server-github` (v2025.4.8)

**Capabilities**:
- Create and manage issues
- Create pull requests
- Search code across repositories
- Manage branches and commits
- Review PR diffs
- Automate CI/CD workflows

**Configuration**:
- ✅ Personal Access Token: Configured (repo: ahump20/BSI)
- ✅ Full repository access

**Example Commands**:
```
"Create a PR for Phase 3 basketball implementation"
"Search the BSI repo for all Monte Carlo simulation code"
"Show me recent commits related to seasonal routing"
"Create an issue for adding MLB player stats API"
"List all open PRs in the BSI repository"
```

---

### 3. **Brave Search MCP Server** 🔍

**Package**: `@modelcontextprotocol/server-brave-search` (v0.6.2)

**Capabilities**:
- Privacy-focused web search
- Real-time sports data lookup
- API documentation research
- News and scores retrieval

**Configuration**:
- ⚠️ **API Key Required**: You need to get a Brave Search API key
- **Status**: Configured but needs activation

**How to Get API Key**:
1. Visit: https://brave.com/search/api/
2. Sign up for Brave Search API
3. Get your API key
4. Update the configuration:
   ```bash
   # Edit ~/.config/claude/mcp.json and replace:
   "BRAVE_API_KEY": "BRAVE_API_KEY_NEEDED"
   # with:
   "BRAVE_API_KEY": "your-actual-api-key-here"
   ```

**Example Commands** (after API key setup):
```
"Search for current MLB playoff standings"
"Find the latest college baseball CWS schedule"
"Look up Texas Longhorns football roster 2025"
"Search for ESPN API documentation"
```

---

### 4. **Filesystem MCP Server** 📁

**Package**: `@modelcontextprotocol/server-filesystem` (v2025.8.21)

**Capabilities**:
- Secure read/write operations
- Directory traversal
- File search
- Batch file operations
- Access control

**Configuration**:
- ✅ Allowed directories:
  - `/Users/AustinHumphrey/BSI` (project root)
  - `/Users/AustinHumphrey/Documents`
  - `/Users/AustinHumphrey/Desktop`

**Example Commands**:
```
"List all JavaScript files in the src/ directory"
"Search for files containing 'Monte Carlo' in BSI"
"Read the contents of package.json"
"Create a new component file at src/components/NewComponent.jsx"
```

---

### 5. **SQLite MCP Server** 🗄️

**Package**: `mcp-sqlite` (v1.0.7)

**Capabilities**:
- Query SQLite databases
- Natural language SQL generation
- Schema inspection
- Data analysis
- Migration assistance

**Configuration**:
- ✅ Database path: `/Users/AustinHumphrey/BSI/dev.db`
- ℹ️ Database will be created if it doesn't exist

**Example Commands**:
```
"Create a table for storing game scores"
"Query all baseball games from March 2025"
"Show me the schema for the teams table"
"Calculate average scores by sport"
"Insert sample data for testing"
```

---

### 6. **PostgreSQL MCP Server** 🐘 (BONUS)

**Package**: `@modelcontextprotocol/server-postgres` (latest)

**Capabilities**:
- Query PostgreSQL databases
- Natural language to SQL
- Schema management
- Data analysis
- Performance optimization

**Configuration**:
- ✅ Connection: `postgresql://localhost/blazesports`
- ℹ️ Requires PostgreSQL running locally

**Example Commands**:
```
"Connect to blazesports database"
"Show all tables in the database"
"Query player statistics for Texas Longhorns"
"Create an index on the games table"
```

---

## 🚀 How to Use MCP Servers

### After Restarting Claude Code

MCP servers are loaded when Claude Code starts. To activate them:

1. **Restart Claude Code** (close and reopen terminal session)
2. You should see MCP server connection messages on startup
3. Test with a simple command like: "List all files in BSI directory"

### Testing Each Server

**Cloudflare**:
```
"Show me all Cloudflare Workers in my account"
```

**GitHub**:
```
"Search for 'seasonal routing' in the BSI repository"
```

**Brave Search** (after API key):
```
"Search for college baseball rankings 2025"
```

**Filesystem**:
```
"List all markdown files in the docs/ folder"
```

**SQLite**:
```
"Create a sample games table in dev.db"
```

---

## 🔧 Troubleshooting

### Server Not Connecting

1. Check that `~/.config/claude/mcp.json` exists and is valid JSON
2. Restart Claude Code
3. Verify npm packages are accessible: `npm view @cloudflare/mcp-server-cloudflare`

### Brave Search Not Working

- You need to add your API key to `~/.config/claude/mcp.json`
- Replace `"BRAVE_API_KEY": "BRAVE_API_KEY_NEEDED"` with your actual key

### Permission Errors (Filesystem)

- The filesystem server only has access to specified directories
- Add more directories by editing the `args` array in mcp.json

### Database Connection Errors

- **SQLite**: Database will auto-create at specified path
- **PostgreSQL**: Ensure PostgreSQL is installed and running:
  ```bash
  brew services start postgresql
  createdb blazesports
  ```

---

## 📊 Usage Examples for Blaze Sports Intel

### Deployment Workflow

```
"Deploy the latest changes to Cloudflare Pages"
"Check the deployment status for blazesportsintel"
"Show me KV storage usage for the cache"
```

### Development Workflow

```
"Create a new component for basketball scores"
"Search the codebase for all API endpoint definitions"
"Show me recent commits to the main branch"
```

### Data Analysis

```
"Query the database for all football games in October"
"Calculate average scores by sport"
"Show me team win-loss records"
```

### Research & Planning

```
"Search for best practices for React Three Fiber"
"Find documentation for Cloudflare D1 migrations"
"Look up college football playoff format 2025"
```

---

## 🔐 Security Notes

- **API tokens** are stored in `~/.config/claude/mcp.json`
- This file should be readable only by your user account
- Never commit `mcp.json` to version control
- Rotate tokens regularly for security

**Current file permissions**:
```bash
chmod 600 ~/.config/claude/mcp.json
```

---

## 📚 Resources

- **Cloudflare MCP**: https://developers.cloudflare.com/agents/model-context-protocol/
- **GitHub MCP**: https://github.com/modelcontextprotocol/servers
- **Brave Search API**: https://brave.com/search/api/
- **MCP Documentation**: https://modelcontextprotocol.io/
- **Claude Code MCP Guide**: https://docs.claude.com/en/docs/claude-code/mcp

---

## 🎯 Next Steps

1. ✅ Configuration file created at `~/.config/claude/mcp.json`
2. ⚠️ **Get Brave Search API key** from https://brave.com/search/api/
3. 🔄 **Restart Claude Code** to load MCP servers
4. ✅ Test each server with example commands
5. 📊 Start using MCP commands in your workflow

---

Last updated: October 16, 2025
Configuration version: 1.0.0
