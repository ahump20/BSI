# BSI Prompt Templates

Reusable prompt scripts for Blaze Sports Intel development. Built on Anthropic's prompt engineering best practices—XML structure, template variables, multishot examples, chain of thought where it earns its latency.

**Usage:** Copy template, replace `{{variables}}`, paste into Claude.

---

## 1. Feature Development

For brainstorming and implementing new features. Combines role prompting with structured thinking.

### 1A. Feature Brainstorm

```
<context>
Platform: Blaze Sports Intel (blazesportsintel.com)
Stack: Cloudflare Workers, D1, KV, R2 exclusively
Sports covered: College baseball (primary), MLB, NFL, NCAA football, NBA
Brand position: Analytics infrastructure for underserved sports; mobile-first; anti-ESPN
</context>

<current_state>
{{description_of_what_exists_now}}
</current_state>

<goal>
{{what_you_want_to_achieve}}
</goal>

<constraints>
- Cloudflare-only infrastructure (no AWS, Vercel, external DBs)
- Mobile-first design
- Must include citation metadata (source, timestamp, America/Chicago timezone)
- Anti-sprawl: prefer replacing existing patterns over adding new ones
</constraints>

Think through 3-5 approaches to achieve this goal. For each approach:
1. Core concept (one sentence)
2. Implementation complexity (low/medium/high)
3. Data sources required
4. Why it might fail

Then recommend the best path forward with rationale.
```

### 1B. Feature Implementation

```
<system>
You're implementing a feature for Blaze Sports Intel. Output production-ready Cloudflare Worker code—no pseudocode, no placeholders. Include proper TypeScript types, KV caching patterns, and citation metadata.
</system>

<feature>
{{feature_name}}: {{one_sentence_description}}
</feature>

<requirements>
{{bulleted_list_of_requirements}}
</requirements>

<existing_patterns>
{{relevant_code_snippets_or_schema_from_repo}}
</existing_patterns>

<output_format>
1. Complete Worker code with exports
2. Any D1 schema changes needed (as migrations)
3. KV key patterns used
4. Brief deployment notes
</output_format>
```

---

## 2. Code Review & Maintenance

For refactoring, bug fixes, and enforcing anti-sprawl principles.

### 2A. Code Audit

```
<context>
Auditing BSI codebase for: {{audit_focus}}
Anti-sprawl rules:
- Replace over add
- Search before create
- Delete obsolete in same commit
</context>

<code>
{{paste_code_or_file_contents}}
</code>

<thinking>
Analyze this code for:
1. Anti-sprawl violations (duplicated patterns, dead code, unnecessary additions)
2. Cloudflare-specific improvements (better KV usage, D1 query optimization, R2 patterns)
3. Citation compliance (source attribution, timestamps, timezone)
4. Mobile-first concerns (response size, essential data only)
</thinking>

<answer>
Provide specific, actionable changes with code diffs. No vague suggestions—show exactly what to change and why.
</answer>
```

### 2B. Bug Investigation

```
<bug>
{{description_of_unexpected_behavior}}
</bug>

<expected>
{{what_should_happen}}
</expected>

<actual>
{{what_actually_happens}}
</actual>

<relevant_code>
{{paste_relevant_code}}
</relevant_code>

<environment>
- Worker: {{worker_name}}
- Bindings: {{D1/KV/R2_bindings_involved}}
- API source: {{ESPN/StatsAPI/etc}}
</environment>

Work through the most likely causes systematically. Then provide the fix with complete code—not a description of what to change.
```

### 2C. Refactor Request

```
<current>
{{paste_current_implementation}}
</current>

<problem>
{{why_this_needs_refactoring}}
</problem>

<constraints>
- Maintain existing API contract (same inputs/outputs)
- Cloudflare Workers runtime constraints
- Keep citation metadata intact
</constraints>

Refactor this code. Show the complete new implementation, not fragments. Explain the key changes at the end, not before the code.
```

---

## 3. Content & Copy

For writing that matches BSI brand voice.

### 3A. Feature Announcement

```
<brand_voice>
Direct, warm, zero corporate slop. Lead with the answer. Rhetorical questions should land, not linger. Root for underdogs. Authenticity over polish. No buzzwords, no "we're excited to announce."
</brand_voice>

<feature>
{{feature_name}}
</feature>

<details>
{{what_it_does_technically}}
</details>

<target_audience>
{{who_cares_about_this}}
</target_audience>

<format>
{{tweet/blog_post/changelog_entry/email}}
</format>

Write this announcement. One draft, tight and done.
```

### 3B. Technical Documentation

```
<context>
Documenting {{component_name}} for BSI.
Audience: Future me, contributors, or anyone reading the code.
</context>

<component>
{{paste_code_or_describe_system}}
</component>

<existing_docs>
{{paste_any_existing_documentation}}
</existing_docs>

Write documentation that:
1. Explains what this does in one paragraph
2. Shows a real usage example
3. Lists the data flow (inputs → processing → outputs)
4. Notes any gotchas or non-obvious behavior

No fluff. If something is obvious from the code, don't document it.
```

---

## 4. Data Pipeline

For sports data ingestion, transformation, and serving.

### 4A. New Data Source Integration

```
<source>
Name: {{source_name}}
Base URL: {{api_base_url}}
Auth: {{auth_method_or_none}}
Rate limits: {{known_limits}}
</source>

<data_needed>
{{what_data_points_you_need}}
</data_needed>

<destination>
Storage: {{D1_table/KV_namespace/R2_bucket}}
Cache TTL: {{seconds}}
</destination>

<examples>
Sample API response:
{{paste_sample_response}}
</examples>

Build the complete ingestion Worker:
1. Fetch with retry logic
2. Transform to BSI schema with citations
3. Store with appropriate caching
4. Error handling for rate limits and downtime
```

### 4B. Data Transformation

```
<input>
Format: {{JSON/CSV/etc}}
Source: {{where_it_comes_from}}
Sample:
{{paste_sample_input}}
</input>

<output>
Target schema:
{{paste_target_schema_or_describe}}
</output>

<requirements>
- Preserve source attribution
- Add fetch timestamp (America/Chicago)
- {{any_specific_transformation_rules}}
</requirements>

Write the transformation function. Include TypeScript types for input and output.
```

---

## 5. Architecture Decisions

For making infrastructure choices within Cloudflare constraints.

### 5A. Storage Decision

```
<problem>
Need to store: {{what_data}}
Access pattern: {{how_it_will_be_read/written}}
Volume: {{approximate_size_and_frequency}}
</problem>

<options>
Evaluate for BSI context:
- D1: SQL queries, relational data, complex filtering
- KV: Key-value lookups, caching, high-read/low-write
- R2: Large files, exports, historical archives
</options>

<constraints>
- Cloudflare only
- Must support citation metadata
- Consider mobile-first response sizes
</constraints>

Recommend the right storage solution with:
1. The decision (one sentence)
2. Schema or key pattern
3. Why not the alternatives
```

### 5B. Worker Architecture

```
<current_workers>
{{list_existing_workers_and_their_purposes}}
</current_workers>

<new_requirement>
{{what_new_functionality_is_needed}}
</new_requirement>

<question>
Should this be:
A) New endpoint on existing Worker
B) New Worker entirely
C) Refactor/consolidate existing Workers
</question>

<anti_sprawl>
BSI naming conventions:
- Workers: bsi-{domain}-{function}
- KV: BSI_{DOMAIN}_{PURPOSE}
- D1: bsi-{domain}-db
</anti_sprawl>

Recommend the architecture with rationale. If consolidating, show what gets merged.
```

---

## 6. Quick Templates

Short-form prompts for common tasks.

### Debug Query

```
This D1 query isn't returning expected results:
{{query}}

Table schema:
{{schema}}

Sample data that should match:
{{sample}}

Fix the query.
```

### API Response Shape

```
Design the JSON response shape for:
Endpoint: {{endpoint_path}}
Purpose: {{what_it_serves}}
Consumer: {{mobile_app/dashboard/etc}}

Requirements:
- Include citation metadata
- Mobile-first (minimal payload)
- {{specific_fields_needed}}
```

### Error Message

```
Write a user-facing error message for:
Situation: {{what_went_wrong}}
Audience: {{who_sees_this}}
Tone: Direct but not alarming

One sentence, maybe two.
```

---

## Usage Notes

**When to use Chain of Thought (`<thinking>`/`<answer>` tags):**
- Complex debugging where you need to see reasoning
- Architecture decisions with multiple tradeoffs
- Audits where you want systematic analysis

**When to skip it:**
- Simple code generation
- Content writing
- Quick fixes where you just need the answer

**Variable conventions:**
- `{{snake_case}}` for code/technical values
- `{{natural_description}}` for prose descriptions
- Always provide real examples when possible—Claude performs better with concrete data

**Anti-patterns to avoid:**
- Don't paste entire repo contents—be selective
- Don't ask for "improvements" without specifying what's wrong
- Don't use these templates for soccer content (excluded per BSI scope)
