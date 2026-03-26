# MCP Routing — BSI Connected Sources

Route each research sub-question to the MCP server most likely to hold the answer. Use multiple servers when a question spans domains.

## Primary Research Sources

| Domain | MCP Server | Best For |
|--------|-----------|----------|
| College baseball stats | College Baseball Sabermetrics | Live scores, standings, rankings, match detail, advanced metrics (wOBA, wRC+, FIP, ERA-), team/player sabermetrics |
| Product analytics (BSI) | PostHog | User behavior, traffic patterns, feature usage, funnels, web vitals, error tracking |
| Product analytics (general) | Amplitude | Event analytics, cohorts, experiments, session replays |
| Cloudflare infrastructure | Cloudflare Developer Platform | Worker status, D1 queries, KV data, R2 objects, deployment state, analytics |
| Organizational knowledge | Notion | Internal docs, databases, prior research, decision records |
| Academic literature | Scholar Gateway | Peer-reviewed papers, citation networks, systematic reviews |
| Biomedical research | PubMed | Clinical studies, life sciences, medical literature |
| ML models and papers | Hugging Face | Model cards, datasets, arXiv papers, research trends |
| Technical documentation | Context7 | Library docs, framework references, code examples |
| Microsoft ecosystem | Microsoft Learn | Azure, Office, .NET, Windows documentation and code samples |

## Secondary / Situational Sources

| Domain | MCP Server | Best For |
|--------|-----------|----------|
| Email correspondence | Gmail | Shared reports, relevant threads, prior communications |
| Calendar context | Google Calendar | Meeting history, scheduling context |
| Task management | ClickUp | Project status, task history, team assignments |
| Document design | Canva | Design assets, brand kits |
| Crypto/social sentiment | LunarCrush | Social engagement, token metrics, trending topics |
| Job market | Indeed | Job listings, market demand signals |

## Routing Rules

1. **Start with the most authoritative source.** College baseball question → College Baseball Sabermetrics MCP first, web search second.
2. **Cross-reference across source types.** An MCP result is a data point, not the final answer. Triangulate with web sources and academic literature.
3. **Use web search for context MCP servers can't provide.** MCPs hold structured data. Web search holds narrative, analysis, and opinion.
4. **Use Notion for internal prior art.** Before researching externally, check if BSI has already investigated the topic.
5. **Multiple query formulations.** The same question phrased three different ways surfaces different results across all source types.

## Source Quality Hierarchy

For any given claim, prefer sources in this order:

1. Government/institutional data (NCAA, Bureau of Labor Statistics, official records)
2. Peer-reviewed research (via Scholar Gateway, PubMed)
3. Established journalism (AP, Reuters, ESPN enterprise reporting, The Athletic)
4. Industry analysis (market research firms, think tanks)
5. First-party data (BSI's own PostHog/Amplitude analytics, Cloudflare metrics)
6. Community sources (forums, Reddit, social media — useful for sentiment, not for facts)
