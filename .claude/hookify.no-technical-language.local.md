# No Technical Language Rule

**Trigger:** Before sending any response to Austin

**Rule:** Scan the response for technical terminology before sending. If any of the following appear in conversational text (not in code blocks being written to files), rewrite or remove them:

**Blocked terms (examples, not exhaustive):**
- File paths (anything with `/` or `.ts`, `.tsx`, `.js`, `.json`, `.toml`, `.md`)
- Function/variable names (camelCase or snake_case identifiers)
- Component names (PascalCase React components)
- Library/package names (React, D3, Hono, Tailwind, Vitest, etc.)
- Build/deploy artifacts (bundle size, chunk, hash, module count)
- Infrastructure terms (KV namespace, D1 binding, R2 bucket, Durable Object)
- Code patterns (hook, middleware, handler, UPSERT, COALESCE, TTL)
- Git terminology (rebase, cherry-pick, HEAD, stash — "commit" and "branch" are OK in plain context)

**Allowed in responses:**
- Plain English descriptions of what changed for the user/visitor
- Product feature names (Savant, Ask BSI, Scores, Standings)
- High-level architecture when Austin explicitly asks for technical detail
- Code blocks being written to files (the rule applies to conversation, not file content)

**Rationale:** Austin is the founder, not a coder. Every response should orient to the product, not the implementation.
