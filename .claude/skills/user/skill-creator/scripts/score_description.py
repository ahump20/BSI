#!/usr/bin/env python3
"""
Description Scorer v3 - Evaluates trigger effectiveness of a skill description

Usage:
    score_description.py <path/to/skill>

Scores against heuristics from official Anthropic best practices:
- Third-person voice
- Action verbs present
- File types mentioned
- Trigger phrases included
- Negative triggers present
- Appropriate length
- No vague/abstract language
- No reserved words
"""

import sys
import re
import yaml
from pathlib import Path


def extract_frontmatter(content: str):
    if not content.startswith('---'):
        return None
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None
    try:
        return yaml.safe_load(match.group(1))
    except yaml.YAMLError:
        return None


def score_description(skill_path: Path) -> dict:
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return {"error": "SKILL.md not found"}

    fm = extract_frontmatter(skill_md.read_text())
    if not fm:
        return {"error": "No valid frontmatter"}

    desc = fm.get('description', '')
    if not desc:
        return {"error": "Empty description"}

    desc_lower = desc.lower()
    words = desc.split()
    word_count = len(words)

    scores = {}
    max_score = 0
    total_score = 0

    # 1. Third person (15 pts)
    max_score += 15
    first_person = bool(re.search(r'\b(i can|i help|i will|my |we can|we help)\b', desc_lower))
    second_person = bool(re.search(r'\b(you can|your |you will)\b', desc_lower))
    if not first_person and not second_person:
        scores['third_person'] = (15, "Third-person voice")
        total_score += 15
    elif second_person:
        scores['third_person'] = (5, "Second-person detected (should be third)")
        total_score += 5
    else:
        scores['third_person'] = (0, "First-person detected (must be third)")

    # 2. Action verbs (10 pts)
    max_score += 10
    verbs = ['create', 'edit', 'modify', 'extract', 'convert', 'merge', 'split',
             'analyze', 'generate', 'process', 'fill', 'query', 'search', 'find',
             'build', 'write', 'read', 'parse', 'deploy', 'test', 'monitor',
             'manage', 'track', 'validate', 'optimize']
    found_verbs = [v for v in verbs if v in desc_lower]
    if len(found_verbs) >= 3:
        scores['action_verbs'] = (10, f"Strong verb coverage: {', '.join(found_verbs[:5])}")
        total_score += 10
    elif len(found_verbs) >= 1:
        scores['action_verbs'] = (6, f"Some verbs: {', '.join(found_verbs)}")
        total_score += 6
    else:
        scores['action_verbs'] = (0, "No action verbs found")

    # 3. File types (10 pts)
    max_score += 10
    file_types = re.findall(r'\.\w{2,4}\b', desc)
    file_words = re.findall(r'\b(pdf|docx?|xlsx?|pptx?|csv|json|xml|html?|txt|md|yaml|yml)\b', desc_lower)
    all_files = list(set(file_types + file_words))
    if all_files:
        scores['file_types'] = (10, f"File types: {', '.join(all_files[:5])}")
        total_score += 10
    else:
        scores['file_types'] = (0, "No file types mentioned (OK for non-file skills)")

    # 4. Trigger phrases (15 pts)
    max_score += 15
    trigger_patterns = ['use when', 'triggers:', 'trigger', 'when user', 'use for']
    has_triggers = any(p in desc_lower for p in trigger_patterns)
    quoted_phrases = re.findall(r'"[^"]+?"', desc)
    if has_triggers and quoted_phrases:
        scores['triggers'] = (15, f"Trigger conditions + {len(quoted_phrases)} example phrases")
        total_score += 15
    elif has_triggers:
        scores['triggers'] = (10, "Trigger conditions present, but no quoted example phrases")
        total_score += 10
    elif quoted_phrases:
        scores['triggers'] = (8, f"{len(quoted_phrases)} example phrases, but no 'Use when:' section")
        total_score += 8
    else:
        scores['triggers'] = (0, "No trigger conditions or example phrases")

    # 5. Negative triggers (10 pts)
    max_score += 10
    neg_patterns = ['not for', 'don\'t use', 'not when', 'instead use', 'skip when',
                    'not for:', 'doesn\'t handle', 'does not handle']
    if any(p in desc_lower for p in neg_patterns):
        scores['negative_triggers'] = (10, "Negative triggers prevent false activation")
        total_score += 10
    else:
        scores['negative_triggers'] = (0, "No negative triggers (risk of false activation)")

    # 6. Length (15 pts)
    max_score += 15
    if 80 <= word_count <= 200:
        scores['length'] = (15, f"{word_count} words (ideal range)")
        total_score += 15
    elif 50 <= word_count < 80:
        scores['length'] = (10, f"{word_count} words (slightly brief)")
        total_score += 10
    elif 200 < word_count <= 250:
        scores['length'] = (10, f"{word_count} words (slightly long)")
        total_score += 10
    elif word_count < 50:
        scores['length'] = (3, f"{word_count} words (too brief, likely missing triggers)")
        total_score += 3
    else:
        scores['length'] = (5, f"{word_count} words (too long, trying to do too much?)")
        total_score += 5

    # 7. No vague language (10 pts)
    max_score += 10
    vague = [r'\b(comprehensive|solution|management|platform|system)\b',
             r'\b(various|multiple|different|any)\s+(types?|kinds?|formats?)\b',
             r'\b(helps? with|assists? with)\b']
    vague_found = [re.search(p, desc_lower) for p in vague]
    if not any(vague_found):
        scores['specificity'] = (10, "No vague/abstract language")
        total_score += 10
    else:
        scores['specificity'] = (3, "Contains vague language that reduces trigger precision")
        total_score += 3

    # 8. Character limit (15 pts)
    max_score += 15
    char_count = len(desc)
    if char_count <= 1024:
        scores['char_limit'] = (15, f"{char_count}/1024 chars")
        total_score += 15
    else:
        scores['char_limit'] = (0, f"{char_count}/1024 chars — OVER LIMIT")

    return {
        "total": total_score,
        "max": max_score,
        "percentage": round(total_score / max_score * 100),
        "scores": scores,
        "word_count": word_count,
        "char_count": len(desc)
    }


def main():
    if len(sys.argv) != 2:
        print("Usage: score_description.py <path/to/skill>")
        sys.exit(1)

    skill_path = Path(sys.argv[1]).resolve()
    if not skill_path.exists():
        print(f"Error: Path not found: {skill_path}")
        sys.exit(1)

    result = score_description(skill_path)
    if "error" in result:
        print(f"Error: {result['error']}")
        sys.exit(1)

    pct = result['percentage']
    print(f"\nDescription Score: {result['total']}/{result['max']} ({pct}%)")
    print(f"  Words: {result['word_count']} | Chars: {result['char_count']}/1024")
    print()

    for key, (pts, note) in result['scores'].items():
        marker = "+" if pts > 0 else "-"
        print(f"  {marker} {key}: {pts}pts — {note}")

    print()
    if pct >= 85:
        print("Excellent — description is well-optimized for triggering")
    elif pct >= 65:
        print("Good — minor improvements possible")
    elif pct >= 45:
        print("Fair — several improvements recommended")
    else:
        print("Needs work — significant trigger effectiveness gaps")

    sys.exit(0)


if __name__ == "__main__":
    main()
