# MCP Servers Quick Reference

## 🎯 One-Line Command Examples

### Cloudflare ☁️
```
"Show all Workers in my Cloudflare account"
"Deploy to blazesportsintel.com"
"Query D1 database for game scores"
"List all KV namespaces"
"Show R2 bucket contents"
```

### GitHub 🐙
```
"Create PR for basketball feature"
"Search BSI repo for 'Monte Carlo'"
"Show recent commits to main"
"List open issues in BSI"
"Create issue: Add MLB player stats"
```

### Brave Search 🔍
*Requires API key - see MCP-SERVERS-SETUP.md*
```
"Search for MLB playoff schedule 2025"
"Find college baseball rankings"
"Look up Cloudflare Workers documentation"
```

### Filesystem 📁
```
"List all files in src/"
"Search for 'SportSwitcher' in BSI"
"Read package.json"
"Show markdown files in docs/"
"Create new component in src/components/"
```

### SQLite 🗄️
```
"Show tables in dev.db"
"Query all records from mcp_test"
"Create games table with score columns"
"Insert test game data"
"Calculate average scores by sport"
```

### PostgreSQL 🐘
*Requires local PostgreSQL installation*
```
"Connect to blazesports database"
"Show all tables"
"Query player statistics"
"Create index on games table"
```

---

## 🚦 Status Check

After restarting Claude Code, test each server:

1. **Cloudflare**: `"List my Cloudflare Workers"`
2. **GitHub**: `"Search BSI for 'seasonal routing'"`
3. **Filesystem**: `"List files in BSI/src"`
4. **SQLite**: `"Query mcp_test table"`
5. **Brave**: Get API key first!

---

## 🔧 Quick Config

**Location**: `~/.config/claude/mcp.json`

**Edit**: `nano ~/.config/claude/mcp.json`

**Validate**: `python3 -m json.tool ~/.config/claude/mcp.json`

**Restart**: Close and reopen Claude Code terminal

---

## ⚡ Sports-Specific Examples

### Deployment
```
"Deploy latest build to Cloudflare"
"Check deployment status for blazesportsintel"
"Show KV cache hit rates for /api/football/scores"
```

### Development
```
"Create basketball component based on football pattern"
"Search for all API endpoint definitions"
"Show files modified in last commit"
```

### Data Analysis
```
"Query games from October 2025"
"Calculate average football scores"
"Show team win-loss records"
```

### Research
```
"Search for React Three Fiber best practices"
"Find ESPN API documentation"
"Look up college football playoff format"
```

---

**Tip**: MCP servers understand natural language. Be specific about what you want!
