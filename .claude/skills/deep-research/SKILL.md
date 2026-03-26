---
name: deep-research
description: |
  Multi-source investigative research that produces source-verified deliverables.
  Triggers: "research", "deep dive", "find everything", "build a brief",
  "compare", "due diligence", "fact check", "what do we know about",
  "competitive intel", "literature review", "landscape analysis",
  "what are people saying", "investigate", "evidence for".
  Not for: single-fact lookups, code debugging, editorial writing, voice work.
---

# Deep Research

Research is investigation, not search. Search finds pages. Research finds answers. The difference is methodology — scope before searching, triangulate across source types, resolve contradictions instead of hiding them, declare gaps instead of filling them with hedges.

## Core Test

Every research output must pass one test: could a skeptical reader trace every claim back to a specific source and verify it independently? If not, it's summarization with extra steps.

## The Pipeline

Execute five phases in order. Do not skip phases.

### Phase 1: Scope & Decompose

Before touching any tool:

1. **Restate the question precisely.** The user's phrasing is a starting point. "Tell me about X" becomes "What is X, how does it work, who are the key players, what's the current trajectory?"

2. **Classify the question type:**
   - Factual — requires authoritative primary sources
   - Comparative — requires parallel evidence on each entity
   - Causal — requires studies with controlled methodology
   - Evaluative — requires criteria definition before evidence gathering
   - Predictive — requires trend data + expert forecasts
   - Exploratory — breadth-first search, then depth on promising threads

3. **Decompose into 3-7 sub-questions.** Each independently answerable. Together they fully resolve the parent question. If decomposition fails, the question isn't understood yet — ask for clarification.

4. **Define "done."** What would a complete answer contain? What format serves the user best? State this before searching.

5. **Declare source strategy.** Map sub-questions to source types and MCP servers. See `references/mcp-routing.md` for BSI's connected sources and which domains they serve.

6. **State known unknowns.** What might be unanswerable? Why?

### Phase 2: Parallel Source Execution

Run research across all mapped source types. Minimum 5 tool calls for any substantive question. Scale to 10-20+ for complex topics.

**Web intelligence:**
- Start with 1-3 word queries, broaden or narrow based on results
- Fetch full articles from top results — snippets lie by omission
- Source hierarchy: government/institutional > peer-reviewed > established journalism > industry analysis > forums
- For evolving topics: weight recent sources. For established fields: find the seminal source first, then trace forward

**Academic sources (Scholar Gateway, PubMed):**
- Prioritize: systematic reviews > meta-analyses > RCTs > observational > case studies
- Extract: sample size, effect size, confidence interval, key limitation
- Find the paper everyone cites — that's the anchor

**Internal sources (Notion, past conversations):**
- Search for existing docs, reports, prior research on the topic
- Cross-reference internal assumptions against external evidence

**Specialized MCP servers:**
- Route each sub-question to the MCP server most likely to hold the answer
- Use multiple query formulations — same question phrased three ways surfaces different sources
- Full routing table: `references/mcp-routing.md`

### Phase 3: Triangulation & Contradiction Resolution

Cross-reference findings across source types:

- **Sources agree** → high confidence. State the finding declaratively.
- **Sources partially agree** → medium confidence. Note scope of agreement and where it diverges.
- **Sources contradict** → requires resolution. Do not pick a side arbitrarily.

**Contradiction resolution:**
1. Identify the specific claim in dispute
2. Check for definitional disagreement (different terms for the same thing)
3. Check for methodological disagreement (different studies, different designs)
4. Check for temporal disagreement (one source is outdated)
5. Check for scope disagreement (true in one context, false in another)
6. If genuine disagreement remains: present both positions with evidence quality ratings

**Evidence weighting:**
- Methodology > authority > recency (a well-designed 2020 study beats a 2025 blog post)
- Primary > secondary > tertiary sources
- Multiple independent sources > one comprehensive source

### Phase 4: Gap Analysis

Map findings against Phase 1 sub-questions:

- **Answered fully:** High confidence, multiple corroborating sources
- **Answered partially:** Some evidence exists, key aspects unclear. State what's known and what's missing.
- **Unanswerable with available tools:** Explain why — paywalled, requires primary research, data doesn't exist, topic too new
- **Requires human input:** Flag what context or decision only the user can provide

Never paper over gaps with hedge language. "This area requires further research" is honest. Spraying qualifiers is cowardice dressed as caution.

### Phase 5: Synthesis & Deliverable

Produce a file. Research that lives only in chat gets lost.

Match the deliverable format to the request. See `references/deliverable-templates.md` for full templates:

| Request Pattern | Format |
|----------------|--------|
| Open-ended research | Research Brief (default) |
| "Compare A vs B" | Comparative Matrix |
| "Should we do X?" | Decision Brief |
| "Literature review" | Academic Synthesis |
| "Competitive intel" | Market/Company Profile |
| "Prep for article" | Editorial Research Package |

**Communication rule:** All deliverables report findings in plain English. No jargon unless it's the subject of the research itself. When unavoidable terms appear, define them on first use. Lead with what matters — the answer — then support with evidence.

## Quality Gates

Before delivering, verify:

- Every factual claim traces to a specific source
- No single source dominates the synthesis (triangulation achieved)
- Contradictions surfaced, not hidden
- Confidence levels explicit: HIGH / MEDIUM / LOW / UNKNOWN
- Gaps declared, not papered over
- The deliverable answers the original question, not an adjacent one
- Source quality assessed (not all sources are equal)
- Executive summary is self-contained (readable without the full brief)
- File saved (not just printed in chat)

## Anti-Patterns

Five failure modes to avoid. See `references/anti-patterns.md` for full descriptions and error handling protocols.

1. **Snippet Quilter** — stitching search snippets without reading full sources
2. **First-Result Accepter** — treating the first result as the answer instead of a hypothesis
3. **Hedge Stack** — spraying qualifiers instead of stating honest uncertainty
4. **Source Counter** — 20 shallow sources aren't better than 5 deep ones
5. **Scope Creep** — chasing adjacent questions instead of answering the decomposed sub-questions

## Agent Coordination

For complex research requiring sustained autonomous work, launch the `deep-research` agent via the Agent tool. The agent carries this methodology as its operating personality and has persistent memory for tracking reliable sources across sessions.

Skill = methodology + invocation structure.
Agent = execution personality + persistent memory.
