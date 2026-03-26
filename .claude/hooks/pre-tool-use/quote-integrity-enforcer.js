#!/usr/bin/env node
// Quote Integrity Enforcer Hook
// Blocks writes that mangle Austin's canonical quotes — especially the BSI slogan.
// Reads the canonical quotes registry, detects near-matches with altered wording,
// and surfaces the correct version.

const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(
  process.env.HOME,
  ".claude/projects/-Users-AustinHumphrey/memory/canonical-quotes.md",
);

// Parse blockquotes from the registry markdown
function parseCanonicalQuotes(registryContent) {
  const quotes = [];
  const lines = registryContent.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("> ")) {
      // Extract the quote text (strip > and surrounding quotes)
      let quoteText = line.slice(2).trim();
      // Remove wrapping quotes if present
      if (
        (quoteText.startsWith('"') && quoteText.endsWith('"')) ||
        (quoteText.startsWith("\u201c") && quoteText.endsWith("\u201d"))
      ) {
        quoteText = quoteText.slice(1, -1);
      }
      quotes.push(quoteText);
    }
  }

  return quotes;
}

// Normalize text for comparison: lowercase, strip punctuation, collapse whitespace
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract significant words (4+ chars, not common stopwords)
function significantWords(text) {
  const stopwords = new Set([
    "the",
    "and",
    "for",
    "that",
    "with",
    "this",
    "from",
    "they",
    "have",
    "been",
    "were",
    "their",
    "which",
    "when",
    "would",
    "there",
    "about",
    "into",
    "than",
    "them",
    "then",
    "also",
    "just",
    "more",
    "some",
    "very",
    "what",
    "does",
    "most",
    "such",
    "like",
    "only",
    "over",
    "other",
    "even",
    "after",
    "because",
    "being",
    "could",
    "each",
    "every",
    "much",
    "many",
    "made",
    "before",
    "between",
    "both",
    "while",
    "where",
  ]);
  return normalize(text)
    .split(" ")
    .filter((w) => w.length >= 4 && !stopwords.has(w));
}

// Check if content contains a mangled version of a canonical quote
function findMangledQuotes(content, canonicalQuotes) {
  const contentNorm = normalize(content);
  const issues = [];

  for (const quote of canonicalQuotes) {
    const quoteNorm = normalize(quote);

    // Skip very short quotes (less than 5 words) — too many false positives
    if (quoteNorm.split(" ").length < 5) continue;

    // Exact match is fine
    if (contentNorm.includes(quoteNorm)) continue;

    // Check for significant word overlap with different ordering
    const quoteSigWords = significantWords(quote);
    const contentSigWords = significantWords(content);

    if (quoteSigWords.length < 3) continue;

    // Count how many significant words from the quote appear in the content
    const matchCount = quoteSigWords.filter((w) =>
      contentSigWords.includes(w),
    ).length;
    const matchRatio = matchCount / quoteSigWords.length;

    // If 70%+ of significant words match but the exact normalized quote isn't present,
    // this is likely a mangled version
    if (matchRatio >= 0.7 && !contentNorm.includes(quoteNorm)) {
      // Verify the matching words appear in a reasonable proximity (within 200 chars)
      const contentLower = content.toLowerCase();
      const matchingWords = quoteSigWords.filter((w) =>
        contentSigWords.includes(w),
      );

      // Find positions of matching words
      const positions = matchingWords
        .map((w) => contentLower.indexOf(w))
        .filter((p) => p >= 0)
        .sort((a, b) => a - b);

      if (positions.length >= 3) {
        const spread = positions[positions.length - 1] - positions[0];
        // If the matching words are clustered (within ~2x the quote length), it's likely a mangled version
        if (spread < quote.length * 2.5) {
          issues.push({
            canonical: quote,
            matchRatio: Math.round(matchRatio * 100),
          });
        }
      }
    }
  }

  return issues;
}

// Special enforcement for the BSI slogan
function checkSloganIntegrity(content) {
  const sloganWords = ["born", "blaze", "path", "beaten", "less"];
  const contentLower = content.toLowerCase();

  // Check if all 5 slogan words appear
  const allPresent = sloganWords.every((w) => contentLower.includes(w));
  if (!allPresent) return null;

  // Check if they appear in proximity (within 80 chars)
  const positions = sloganWords
    .map((w) => contentLower.indexOf(w))
    .sort((a, b) => a - b);
  const spread = positions[positions.length - 1] - positions[0];

  if (spread > 80) return null; // Words are too spread out, probably not the slogan

  // The canonical slogan word order in the relevant portion is: "Path Beaten Less"
  // The wrong version is: "Path Less Beaten"
  const canonicalPattern = /path\s+beaten\s+less/i;
  const wrongPattern = /path\s+less\s+beaten/i;

  if (wrongPattern.test(content) && !canonicalPattern.test(content)) {
    return {
      found: content.match(wrongPattern)[0],
      correct: "the Path Beaten Less",
    };
  }

  return null;
}

// Main
try {
  const input = JSON.parse(fs.readFileSync(0, "utf8"));
  const toolInput = input.tool_input || {};

  // Get the content being written
  const content = toolInput.content || toolInput.new_string || "";

  if (!content || typeof content !== "string" || content.length < 10) {
    // Nothing meaningful to check
    console.log(JSON.stringify({ decision: "approve" }));
    process.exit(0);
  }

  // Check slogan first (fast, specific)
  const sloganIssue = checkSloganIntegrity(content);
  if (sloganIssue) {
    console.log(
      JSON.stringify({
        decision: "block",
        reason: `SLOGAN DRIFT DETECTED: Found "${sloganIssue.found}" — the canonical slogan is "Born to Blaze ${sloganIssue.correct}". The word order is intentional and must not be changed.`,
      }),
    );
    process.exit(0);
  }

  // Load and check against the full registry
  let registryContent;
  try {
    registryContent = fs.readFileSync(REGISTRY_PATH, "utf8");
  } catch {
    // Registry not found — can't enforce, just approve
    console.log(JSON.stringify({ decision: "approve" }));
    process.exit(0);
  }

  const canonicalQuotes = parseCanonicalQuotes(registryContent);
  const issues = findMangledQuotes(content, canonicalQuotes);

  if (issues.length > 0) {
    const firstIssue = issues[0];
    console.log(
      JSON.stringify({
        decision: "block",
        reason: `QUOTE INTEGRITY: Content appears to contain a mangled version of a canonical quote (${firstIssue.matchRatio}% word match). The canonical version is: "${firstIssue.canonical}". Please use the exact wording from the canonical quotes registry.`,
      }),
    );
    process.exit(0);
  }

  // All clear
  console.log(JSON.stringify({ decision: "approve" }));
} catch (err) {
  // On any error, approve to avoid blocking legitimate writes
  console.log(JSON.stringify({ decision: "approve" }));
}
