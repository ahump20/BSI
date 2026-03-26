# Anti-Patterns & Error Handling

## Five Failure Modes

### 1. The Snippet Quilter

Stitching together search result snippets isn't research. Read the full source. Understand the argument. Then synthesize in your own framing. If the deliverable reads like a patchwork of quotes and paraphrases from different pages, it's quilting — not analysis.

**Fix:** For every source that contributes a finding, fetch the full article. Summarize the argument in one sentence before extracting data points. If you can't summarize the argument, you haven't read it.

### 2. The First-Result Accepter

The first search result is a hypothesis, not an answer. Verify it. Triangulate it. The goal is the best available answer, not the fastest.

**Fix:** Treat the first result as "candidate answer." Immediately search for confirming and disconfirming evidence. A finding becomes a finding only after at least two independent sources support it.

### 3. The Hedge Stack

"It's worth noting that potentially in some cases this might possibly apply." One qualifier, then commit. If the evidence is genuinely thin, say that — don't spray qualifiers as a substitute for honest uncertainty.

**Fix:** Before writing a hedged sentence, ask: is the uncertainty in the evidence or in my willingness to commit? If the evidence is genuinely ambiguous, state the ambiguity cleanly: "Source A says X; Source B says Y. The disagreement appears to stem from [reason]." If the evidence is clear but you're hedging out of caution, commit.

### 4. The Source Counter

20 sources that all say the same shallow thing aren't better than 5 sources that provide genuine depth and different perspectives. Depth beats breadth when both aren't achievable.

**Fix:** After gathering sources, audit for redundancy. If multiple sources are making the same point from the same underlying data, consolidate to the best one. A source earns its place by adding a perspective, data point, or argument the others don't.

### 5. The Scope Creep

Research expands to fill available time. The Phase 1 decomposition is the scope contract. Answer the sub-questions, then stop. If adjacent questions emerge, flag them as future research — don't chase them in the current pass.

**Fix:** When a promising tangent appears, write it down as "Adjacent question for future research" in the deliverable. Return to the sub-questions. The deliverable should answer what was asked, not everything that could be asked.

## Error Handling Protocols

### Search returns nothing useful

Reformulate with different terminology. Try adjacent concepts. Try different source types — a web search failure doesn't mean an MCP search will also fail. If three reformulations across two source types still produce nothing: declare the gap honestly in the deliverable.

### Paywalled sources

Note what was found behind the paywall (title, abstract, publication date, authors). Include it in the source appendix with a "paywalled — abstract only" note. Do not pretend the source doesn't exist. Suggest the user access it directly if the finding behind the paywall is critical.

### Contradictory authoritative sources

Do not pick a winner arbitrarily. Present both positions with:
- The specific claim in dispute
- The methodology behind each position
- The source quality and recency of each
- What would resolve the disagreement (more data, better methodology, time)

Let the evidence quality or the user's judgment decide.

### Topic too broad

Push back. "Research AI" isn't a research question. Ask the user to narrow: what aspect, what timeframe, what application, for what decision? If the user wants breadth, negotiate a scope — "I'll cover the top 3 most relevant aspects and flag the rest for follow-up."

### Topic too new

State that evidence is thin and preliminary. Weight any available sources with extra caution. Flag that conclusions may shift rapidly as more evidence emerges. Lean toward primary sources (company announcements, official records) over analysis when the topic is less than 6 months old.

### MCP server returns errors or empty results

Try a different query formulation. If the MCP consistently fails, fall back to web search for that domain. Note in the deliverable that the specialized source was unavailable — this affects confidence in domain-specific findings.

### Rate limits or tool failures

Document what couldn't be accessed. Proceed with available sources. Note the limitation in the evidence quality assessment. Do not pretend completeness when a source type was unavailable.
