#!/usr/bin/env python3
"""
Skill Auditor v3 - Comprehensive quality audit with official best practices

Usage:
    audit_skill.py <path/to/skill>

Checks: token budgets, description quality (third-person, negative triggers,
trigger coverage), progressive disclosure, dead references, anti-patterns,
official Anthropic best practices compliance.
"""

import sys
import os
import re
import yaml
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass


@dataclass
class AuditResult:
    level: str  # "error", "warning", "info"
    category: str
    message: str
    suggestion: Optional[str] = None


def count_words(text: str) -> int:
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'`[^`]+`', '', text)
    return len(text.split())


def count_lines(text: str) -> int:
    return len([l for l in text.split('\n') if l.strip()])


def extract_frontmatter(content: str) -> Tuple[Optional[dict], str]:
    if not content.startswith('---'):
        return None, content
    match = re.match(r'^---\n(.*?)\n---\n?(.*)', content, re.DOTALL)
    if not match:
        return None, content
    try:
        fm = yaml.safe_load(match.group(1))
        return fm, match.group(2)
    except yaml.YAMLError:
        return None, content


def audit_token_budget(skill_path: Path, content: str, fm: dict) -> List[AuditResult]:
    results = []
    desc = fm.get('description', '')
    desc_words = count_words(desc)
    desc_chars = len(desc)

    if desc_chars > 1024:
        results.append(AuditResult("error", "token-budget",
            f"Description exceeds 1024 char limit ({desc_chars} chars)",
            "Trim to focus on key triggers"))
    elif desc_words > 200:
        results.append(AuditResult("warning", "token-budget",
            f"Description is lengthy ({desc_words} words, target <200)",
            "Consider condensing"))

    _, body = extract_frontmatter(content)
    body_words = count_words(body)
    body_lines = count_lines(body)

    if body_lines > 500:
        results.append(AuditResult("error", "token-budget",
            f"SKILL.md body exceeds 500 lines ({body_lines} lines)",
            "Move detailed content to references/"))
    elif body_words > 2000:
        results.append(AuditResult("warning", "token-budget",
            f"SKILL.md body is lengthy ({body_words} words, target <2000)",
            "Consider moving detail to references/"))

    refs_dir = skill_path / 'references'
    if refs_dir.exists():
        for rf in refs_dir.glob('*.md'):
            rw = count_words(rf.read_text())
            if rw > 5000:
                results.append(AuditResult("warning", "token-budget",
                    f"Reference {rf.name} is very long ({rw} words)",
                    "Consider splitting into focused files"))
            rl = count_lines(rf.read_text())
            if rl > 100:
                toc_patterns = ['## contents', '## table of contents', '## toc']
                has_toc = any(p in rf.read_text().lower() for p in toc_patterns)
                if not has_toc:
                    results.append(AuditResult("info", "structure",
                        f"Reference {rf.name} is >100 lines without table of contents",
                        "Add a ToC at the top for better navigation"))

    total = desc_words + body_words
    for rf in (skill_path / 'references').glob('*.md') if (skill_path / 'references').exists() else []:
        total += count_words(rf.read_text())
    if total > 10000:
        results.append(AuditResult("warning", "token-budget",
            f"Total skill content is very large ({total} words)",
            "Review for removable content"))

    return results


def audit_description(fm: dict) -> List[AuditResult]:
    results = []
    desc = fm.get('description', '')
    if not desc:
        results.append(AuditResult("error", "trigger", "Missing description", None))
        return results

    desc_lower = desc.lower()
    word_count = count_words(desc)

    # Third-person check (official requirement)
    first_person = re.search(r'\b(i can|i help|i will|my |we can|we help)\b', desc_lower)
    second_person = re.search(r'\b(you can|your |you will)\b', desc_lower)
    if first_person:
        results.append(AuditResult("error", "trigger",
            "Description uses first person (official requirement: third person only)",
            "Rewrite: 'Processes files...' not 'I help process files...'"))
    if second_person:
        results.append(AuditResult("warning", "trigger",
            "Description uses second person (official recommendation: third person)",
            "Rewrite: 'Processes files...' not 'You can use this to process files...'"))

    # File type mentions
    has_files = re.search(r'\.\w{2,4}\b', desc) or re.search(
        r'\b(pdf|docx?|xlsx?|pptx?|csv|json|xml|html?|txt|md)\b', desc_lower)
    if not has_files:
        results.append(AuditResult("info", "trigger",
            "Description doesn't mention specific file types",
            "Add file extensions for file-based skills"))

    # Action verbs
    verbs = ['create', 'edit', 'modify', 'extract', 'convert', 'merge', 'split',
             'analyze', 'generate', 'process', 'fill', 'query', 'search', 'find',
             'build', 'write', 'read', 'parse', 'deploy', 'test', 'monitor']
    if not any(v in desc_lower for v in verbs):
        results.append(AuditResult("warning", "trigger",
            "Description lacks action verbs",
            "Add verbs: 'creates', 'extracts', 'processes', etc."))

    # Trigger phrases
    triggers = ['use when', 'use for', 'triggers', 'handles', 'example',
                'such as', 'like', 'including', 'when user']
    if not any(p in desc_lower for p in triggers):
        results.append(AuditResult("warning", "trigger",
            "No explicit trigger conditions found",
            "Add 'Use when:' or 'Triggers:' section"))

    # Negative triggers (official recommendation)
    negatives = ['not for', 'don\'t use', 'not when', 'instead use', 'skip when']
    if not any(n in desc_lower for n in negatives):
        results.append(AuditResult("info", "trigger",
            "No negative triggers found",
            "Add 'Not for:' to prevent false activation on adjacent tasks"))

    # Length
    if word_count < 30:
        results.append(AuditResult("warning", "trigger",
            f"Description may be too brief ({word_count} words)",
            "Expand to include more trigger cases (target: 100-200 words)"))

    # Vague language
    vague = [r'\b(comprehensive|solution|management|platform|system|tool)\b',
             r'\b(various|multiple|different|any)\s+(types?|kinds?|formats?)\b']
    if any(re.search(p, desc_lower) for p in vague):
        results.append(AuditResult("info", "trigger",
            "Abstract language may reduce trigger effectiveness",
            "Replace with specific file types, actions, or examples"))

    # Reserved words in name
    name = fm.get('name', '')
    for reserved in ['anthropic', 'claude']:
        if reserved in name.lower():
            results.append(AuditResult("error", "naming",
                f"Name contains reserved word '{reserved}'",
                "Remove reserved word from skill name"))

    return results


def audit_structure(skill_path: Path, body: str) -> List[AuditResult]:
    results = []
    refs_dir = skill_path / 'references'
    scripts_dir = skill_path / 'scripts'

    ref_mentions = re.findall(r'references?/[\w.-]+\.md', body, re.IGNORECASE)
    script_mentions = re.findall(r'scripts?/[\w.-]+\.py', body, re.IGNORECASE)

    # Orphaned references
    if refs_dir.exists():
        for rf in refs_dir.glob('*.md'):
            name = f"references/{rf.name}"
            if not any(name.lower() in m.lower() for m in ref_mentions) and rf.name not in body:
                results.append(AuditResult("warning", "structure",
                    f"Reference '{rf.name}' not mentioned in SKILL.md",
                    "Add pointer explaining when to use this reference"))

    # Orphaned scripts
    if scripts_dir.exists():
        for sf in scripts_dir.glob('*.py'):
            name = f"scripts/{sf.name}"
            if not any(name.lower() in m.lower() for m in script_mentions) and sf.name not in body:
                if sf.name != '__init__.py' and sf.name != '.gitkeep':
                    results.append(AuditResult("warning", "structure",
                        f"Script '{sf.name}' not mentioned in SKILL.md",
                        "Add usage instructions or remove"))

    # Nested references check
    if refs_dir.exists():
        for rf in refs_dir.glob('*.md'):
            rc = rf.read_text()
            nested = re.findall(r'references?/[\w.-]+\.md', rc, re.IGNORECASE)
            if nested:
                results.append(AuditResult("warning", "structure",
                    f"Reference '{rf.name}' links to other references: {nested}",
                    "Keep references one level deep from SKILL.md (official recommendation)"))

    # Backslash paths
    if '\\' in body:
        results.append(AuditResult("warning", "structure",
            "Backslash paths detected (Windows-style)",
            "Use forward slashes for cross-platform compatibility"))

    # Auxiliary docs
    for bad_file in ['README.md', 'CHANGELOG.md', 'LICENSE.md']:
        if (skill_path / bad_file).exists() and bad_file != 'LICENSE.txt':
            results.append(AuditResult("info", "structure",
                f"{bad_file} found — skills should not include auxiliary docs", None))

    return results


def audit_anti_patterns(content: str, body: str) -> List[AuditResult]:
    results = []

    # TODOs
    todos = re.findall(r'\[?TODO\]?:?\s*[^\n]+', content, re.IGNORECASE)
    if todos:
        results.append(AuditResult("error", "anti-pattern",
            f"Found {len(todos)} TODO comment(s)",
            "Complete or remove before packaging"))

    # Meta-content
    meta = [r'this skill was created', r'we designed this', r'the following sections',
            r'this document describes', r'about this skill']
    for p in meta:
        if re.search(p, body, re.IGNORECASE):
            results.append(AuditResult("warning", "anti-pattern",
                f"Meta-content detected: '{p}'",
                "Remove narrative; focus on instructions"))
            break

    # Hedging
    hedges = [r'\b(might|could|may)\s+want\s+to\s+consider',
              r'\b(perhaps|possibly|potentially)\b',
              r'\bdepending on your (needs|circumstances|situation)\b']
    for p in hedges:
        if re.search(p, body, re.IGNORECASE):
            results.append(AuditResult("info", "anti-pattern",
                "Hedging language detected", "Be more direct"))
            break

    # Over-explanation
    overexplain = [r'what is json\b', r'what is (a )?pdf\b',
                   r'what is python\b', r'what is (a )?database\b']
    for p in overexplain:
        if re.search(p, body, re.IGNORECASE):
            results.append(AuditResult("warning", "anti-pattern",
                "Explaining common concepts Claude already knows",
                "Remove basic explanations"))
            break

    # Duplicate headers
    headers = re.findall(r'^#+\s+(.+)$', body, re.MULTILINE)
    header_lower = [h.lower().strip() for h in headers]
    dupes = [h for h in set(header_lower) if header_lower.count(h) > 1]
    if dupes:
        results.append(AuditResult("warning", "anti-pattern",
            f"Duplicate headers: {dupes}",
            "Consolidate or differentiate"))

    # MCP tool names without server prefix
    mcp_tools = re.findall(r'`(\w+_\w+)`', body)
    for tool in mcp_tools:
        if ':' not in tool and any(kw in tool.lower() for kw in ['_tool', '_query', '_search', '_create']):
            results.append(AuditResult("info", "best-practice",
                f"Tool '{tool}' may need server prefix (ServerName:tool_name)",
                "Use fully qualified MCP tool names"))
            break

    return results


def audit_skill(skill_path: Path) -> Tuple[List[AuditResult], Dict]:
    results = []
    stats = {}

    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        results.append(AuditResult("error", "structure", "SKILL.md not found", None))
        return results, stats

    content = skill_md.read_text()
    fm, body = extract_frontmatter(content)

    if not fm:
        results.append(AuditResult("error", "structure",
            "No valid YAML frontmatter found",
            "Add frontmatter with name and description"))
        return results, stats

    stats['description_words'] = count_words(fm.get('description', ''))
    stats['description_chars'] = len(fm.get('description', ''))
    stats['body_words'] = count_words(body)
    stats['body_lines'] = count_lines(body)

    refs_dir = skill_path / 'references'
    stats['reference_files'] = len(list(refs_dir.glob('*.md'))) if refs_dir.exists() else 0
    scripts_dir = skill_path / 'scripts'
    stats['script_files'] = len([f for f in scripts_dir.glob('*.py')
                                  if f.name != '__init__.py']) if scripts_dir.exists() else 0

    results.extend(audit_token_budget(skill_path, content, fm))
    results.extend(audit_description(fm))
    results.extend(audit_structure(skill_path, body))
    results.extend(audit_anti_patterns(content, body))

    return results, stats


def print_results(results: List[AuditResult], stats: Dict) -> bool:
    errors = [r for r in results if r.level == "error"]
    warnings = [r for r in results if r.level == "warning"]
    infos = [r for r in results if r.level == "info"]

    print(f"\nSkill Statistics:")
    print(f"  Description: {stats.get('description_words', 0)} words, {stats.get('description_chars', 0)} chars")
    print(f"  SKILL.md body: {stats.get('body_words', 0)} words, {stats.get('body_lines', 0)} lines")
    print(f"  Reference files: {stats.get('reference_files', 0)}")
    print(f"  Script files: {stats.get('script_files', 0)}")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for r in errors:
            print(f"  [{r.category}] {r.message}")
            if r.suggestion: print(f"    > {r.suggestion}")

    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for r in warnings:
            print(f"  [{r.category}] {r.message}")
            if r.suggestion: print(f"    > {r.suggestion}")

    if infos:
        print(f"\nSuggestions ({len(infos)}):")
        for r in infos:
            print(f"  [{r.category}] {r.message}")
            if r.suggestion: print(f"    > {r.suggestion}")

    if not results:
        print("\nNo issues found!")

    print(f"\n{'='*50}")
    if errors:
        print("AUDIT FAILED — Fix errors before packaging")
        return False
    elif warnings:
        print("AUDIT PASSED with warnings — Review before packaging")
        return True
    else:
        print("AUDIT PASSED — Ready for packaging")
        return True


def main():
    if len(sys.argv) != 2:
        print("Usage: audit_skill.py <path/to/skill>")
        sys.exit(1)

    skill_path = Path(sys.argv[1]).resolve()
    if not skill_path.exists() or not skill_path.is_dir():
        print(f"Error: Invalid skill path: {skill_path}")
        sys.exit(1)

    print(f"Auditing skill: {skill_path.name}")
    results, stats = audit_skill(skill_path)
    passed = print_results(results, stats)
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
