# Eval-Driven Development

## Contents
- The Evaluation-First Principle
- Creating Evaluation Scenarios
- Running Evaluations (Claude.ai and Claude Code)
- Review and Feedback
- Improving the Skill
- The Iteration Loop
- Description Optimization
- Model-Specific Testing

The core loop: **draft → test → review → improve → repeat**. This is the single most impactful practice for skill quality.

## The Evaluation-First Principle

From Anthropic's official guidance: **Create evaluations BEFORE writing extensive documentation.** This ensures your skill solves real problems rather than documenting imagined ones.

1. **Identify gaps:** Run Claude on representative tasks without the skill. Document specific failures.
2. **Create evaluations:** Build 3-5 scenarios that test these gaps.
3. **Establish baseline:** Measure Claude's performance without the skill.
4. **Write minimal instructions:** Just enough to address the gaps.
5. **Iterate:** Run evals, compare against baseline, refine.

## Creating Evaluation Scenarios

### Eval Structure

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "Realistic user prompt with specific details",
      "expected_behavior": [
        "Verifiable outcome 1",
        "Verifiable outcome 2"
      ],
      "files": [],
      "negative": false
    }
  ]
}
```

### Writing Good Eval Prompts

**Realistic prompts** include: file paths, personal context, casual speech, abbreviations, typos, varying lengths, backstory.

Bad: `"Extract text from PDF"`, `"Format this data"`, `"Create a chart"`

Good: `"ok so my boss sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column showing profit margin. Revenue is column C, costs column D i think"`

### Coverage Strategy

For **should-trigger** prompts (60%):
- Different phrasings of the same intent (formal, casual)
- Cases where user doesn't explicitly name the skill but clearly needs it
- Uncommon use cases
- Cases where this skill competes with another but should win

For **should-not-trigger** prompts (40%):
- Near-misses — queries sharing keywords but needing different tools
- Adjacent domains with ambiguous phrasing
- Cases where a naive keyword match would trigger but shouldn't

The negative cases should be **genuinely tricky**, not obviously irrelevant.

## Running Evaluations

### In Claude.ai (No Subagents)

Since Claude.ai doesn't have subagents, run tests sequentially:

1. For each eval prompt, read the skill's SKILL.md
2. Follow its instructions to complete the task
3. Present results directly in conversation
4. If output is a file, save it and share the path
5. Ask for feedback inline: "How does this look?"

Skip baseline runs — focus on qualitative feedback from the user.

### In Claude Code (With Subagents)

For each eval, spawn two subagents in the same turn:
- **With-skill run:** Task + skill path → save to `iteration-N/eval-ID/with_skill/`
- **Baseline run:** Same task, no skill → save to `iteration-N/eval-ID/without_skill/`

### Organizing Results

```
skill-workspace/
├── evals/
│   └── evals.json
├── iteration-1/
│   ├── eval-descriptive-name/
│   │   ├── with_skill/outputs/
│   │   ├── without_skill/outputs/    # baseline (Claude Code only)
│   │   └── eval_metadata.json
│   └── benchmark.json                # aggregated (Claude Code only)
└── iteration-2/
    └── ...
```

## Review and Feedback

### In Claude.ai

Present results inline for each test case. Show:
- The prompt that was given
- The output produced
- Any files created (with download paths)

Ask: "How does this look? Anything you'd change?"

Empty feedback = user thinks it's fine. Focus improvements on cases with specific complaints.

### In Claude Code

Use the eval viewer from the skill-creator scripts if available, or present results inline.

## Improving the Skill

After collecting feedback:

### Generalization Over Overfitting

The skill will be used across many different prompts. Don't add fiddly changes that only fix test cases. Instead:
- Understand **why** the failure happened
- Fix the **class of problem**, not the instance
- If a stubborn issue persists, try different metaphors or patterns rather than adding more constraints

### Keep the Skill Lean

Read test transcripts (not just outputs). If the skill makes Claude waste time on unproductive steps, remove those instructions.

### Explain the Why

Prefer explaining **reasoning** over rigid rules. "ALWAYS" and "NEVER" in caps are yellow flags — if possible, explain why the behavior matters so Claude can adapt to edge cases.

### Look for Repeated Work

If multiple test runs independently write the same helper script or take the same multi-step approach, that code should be a bundled script in `scripts/`.

## The Iteration Loop

1. Apply improvements to the skill
2. Rerun all evals into new `iteration-N+1/` directory
3. Present results for review
4. Read feedback, improve again
5. Repeat until:
   - User is satisfied
   - All feedback is empty
   - No meaningful progress being made

## Description Optimization

After the skill content is finalized, optimize the description:

1. **Score current description:**
   ```bash
   python scripts/score_description.py <path/to/skill>
   ```

2. **Generate trigger eval queries** (20 total: ~10 should-trigger, ~10 should-not-trigger)

3. **Test triggering** by starting fresh conversations with each query and observing whether the skill activates

4. **Revise description** based on failures:
   - False negatives → add trigger phrases
   - False positives → add negative triggers
   - Score again after changes

## Model-Specific Testing

From official docs: test with all models you plan to use.

| Model | Consideration |
|-------|--------------|
| Claude Haiku | Does the skill provide enough guidance? |
| Claude Sonnet | Is the skill clear and efficient? |
| Claude Opus | Does the skill avoid over-explaining? |

What works for Opus may need more detail for Haiku. Aim for instructions that work across models.
