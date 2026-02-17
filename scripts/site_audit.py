#!/usr/bin/env python3
import json
import hashlib
import re
import time
from collections import Counter, deque
from datetime import date
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

SITES = [
    "https://blazesportsintel.com",
    "https://austinhumphrey.com",
]
MAX_PAGES_PER_SITE = 500
TIMEOUT_S = 20
USER_AGENT = "BSI-AuditBot/1.0"
ROUTE_PROBE_PATHS = [
    "/about",
    "/contact",
    "/blog",
    "/projects",
    "/services",
    "/privacy",
    "/terms",
]


def normalize_url(url: str):
    try:
        p = urlparse(url)
    except Exception:
        return None
    if p.scheme not in {"http", "https"}:
        return None
    path = p.path.rstrip("/") or "/"
    return urlunparse((p.scheme, p.netloc, path, "", p.query, ""))


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()

    def handle_starttag(self, tag, attrs):
        if tag.lower() != "a":
            return
        href = dict(attrs).get("href")
        if href:
            self.links.add(href.strip())


def extract_first(pattern, text):
    m = re.search(pattern, text, flags=re.I | re.S)
    return unescape(m.group(1).strip()) if m else ""


def extract_meta(text, key):
    m = re.search(rf'<meta[^>]+(?:name|property)=["\']{re.escape(key)}["\'][^>]+content=["\']([^"\']+)["\']', text, flags=re.I)
    return unescape(m.group(1).strip()) if m else ""


def extract_links(html, base):
    parser = LinkParser()
    parser.feed(html)
    out = set()
    for href in parser.links:
        if href.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        absolute = normalize_url(urljoin(base, href))
        if absolute:
            out.add(absolute)
    return sorted(out)


def fetch(url):
    req = Request(url, headers={"User-Agent": USER_AGENT})
    started = time.time()
    try:
        with urlopen(req, timeout=TIMEOUT_S) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            headers = {k.lower(): v for k, v in resp.getheaders()}
            return {
                "ok": True,
                "status": resp.status,
                "url": normalize_url(resp.geturl()),
                "headers": headers,
                "body": body,
                "elapsed_ms": int((time.time() - started) * 1000),
            }
    except HTTPError as e:
        return {
            "ok": False,
            "status": e.code,
            "url": normalize_url(url),
            "headers": {k.lower(): v for k, v in (e.headers.items() if e.headers else [])},
            "body": "",
            "elapsed_ms": int((time.time() - started) * 1000),
            "error": str(e),
        }
    except (URLError, TimeoutError, Exception) as e:
        return {
            "ok": False,
            "status": 0,
            "url": normalize_url(url),
            "headers": {},
            "body": "",
            "elapsed_ms": int((time.time() - started) * 1000),
            "error": str(e),
        }


def parse_sitemap(xml):
    return [normalize_url(unescape(x)) for x in re.findall(r"<loc>(.*?)</loc>", xml, flags=re.I | re.S)]


def gather_sitemap_urls(base):
    to_check = deque([f"{base}/sitemap.xml", f"{base}/sitemap_index.xml"])
    seen = set()
    pages = set()
    while to_check:
        sm = normalize_url(to_check.popleft())
        if not sm or sm in seen:
            continue
        seen.add(sm)
        res = fetch(sm)
        if res["status"] >= 400 or "<loc>" not in res["body"]:
            continue
        for loc in parse_sitemap(res["body"]):
            if not loc:
                continue
            if loc.endswith(".xml"):
                if loc not in seen:
                    to_check.append(loc)
            else:
                pages.add(loc)
    return sorted(pages)


def page_issues(page):
    issues = []
    if page["status"] == 0 or page["status"] >= 400:
        issues.append(f"HTTP {page['status'] if page['status'] else 'ERR'}")
    if page["is_html"]:
        if not page["title"]:
            issues.append("Missing <title>")
        if not page["meta_description"]:
            issues.append("Missing meta description")
        if not page["canonical"]:
            issues.append("Missing canonical")
        if page["h1_count"] == 0:
            issues.append("Missing H1")
        if page["h1_count"] > 1:
            issues.append("Multiple H1 tags")
        if page["title"] and len(page["title"]) > 60:
            issues.append("Title too long")
        if page["meta_description"] and not (70 <= len(page["meta_description"]) <= 160):
            issues.append("Meta description length off-range")
    if page["elapsed_ms"] > 3000:
        issues.append(f"Slow response ({page['elapsed_ms']}ms)")
    headers = page["security_headers"]
    if not headers.get("strict-transport-security"):
        issues.append("Missing HSTS header")
    if not headers.get("content-security-policy"):
        issues.append("Missing CSP header")
    if not headers.get("x-content-type-options"):
        issues.append("Missing X-Content-Type-Options header")
    return issues


def crawl_site(site):
    base = normalize_url(site)
    origin = f"{urlparse(base).scheme}://{urlparse(base).netloc}"
    sitemap_urls = gather_sitemap_urls(origin)

    queue = deque([base] + sitemap_urls)
    queued = set(queue)
    visited = set()
    pages = []

    while queue and len(pages) < MAX_PAGES_PER_SITE:
        current = queue.popleft()
        if current in visited:
            continue
        visited.add(current)

        res = fetch(current)
        body = res["body"]
        content_type = res["headers"].get("content-type", "").lower()
        is_html = "text/html" in content_type or "<!doctype html" in body.lower()

        page = {
            "url": current,
            "final_url": res["url"],
            "status": res["status"],
            "elapsed_ms": res["elapsed_ms"],
            "content_type": content_type,
            "is_html": is_html,
            "title": extract_first(r"<title[^>]*>(.*?)</title>", body) if is_html else "",
            "meta_description": extract_meta(body, "description") if is_html else "",
            "og_title": extract_meta(body, "og:title") if is_html else "",
            "canonical": extract_first(r"<link[^>]+rel=[\"']canonical[\"'][^>]+href=[\"']([^\"']+)[\"']", body) if is_html else "",
            "h1_count": len(re.findall(r"<h1\b", body, flags=re.I)) if is_html else 0,
            "links": [],
            "security_headers": {
                "strict-transport-security": res["headers"].get("strict-transport-security", ""),
                "content-security-policy": res["headers"].get("content-security-policy", ""),
                "x-content-type-options": res["headers"].get("x-content-type-options", ""),
            },
        }

        if is_html and page["status"] < 400:
            links = extract_links(body, current)
            page["links"] = links
            for link in links:
                if urlparse(link).netloc == urlparse(origin).netloc and link not in queued and link not in visited:
                    queued.add(link)
                    queue.append(link)

        page["issues"] = page_issues(page)
        pages.append(page)

    status_hist = Counter([p["status"] for p in pages])
    issue_hist = Counter()
    for p in pages:
        issue_hist.update(p["issues"])

    route_probe = []
    if len(pages) <= 3:
        for route in ROUTE_PROBE_PATHS:
            probe_url = normalize_url(origin + route)
            if probe_url in visited:
                continue
            probe_res = fetch(probe_url)
            snippet = probe_res["body"][:1200]
            title = extract_first(r"<title[^>]*>(.*?)</title>", snippet)
            canonical = extract_first(r"<link[^>]+rel=[\"']canonical[\"'][^>]+href=[\"']([^\"']+)[\"']", probe_res["body"])
            route_probe.append(
                {
                    "url": probe_url,
                    "status": probe_res["status"],
                    "title": title,
                    "canonical": canonical,
                    "body_hash": hashlib.md5(probe_res["body"].encode("utf-8", errors="ignore")).hexdigest()[:12],
                }
            )

    return {
        "site": origin,
        "scanned_pages": len(pages),
        "discovered_urls": len(queued),
        "status_histogram": dict(sorted(status_hist.items())),
        "issue_histogram": dict(issue_hist.most_common()),
        "pages": pages,
        "route_probe": route_probe,
    }


def top_issues(issue_hist, n=12):
    return list(issue_hist.items())[:n]


def build_plan(result):
    critical, high, medium = [], [], []
    for issue, count in top_issues(result["issue_histogram"], 20):
        if issue.startswith("HTTP 4") or issue.startswith("HTTP 5"):
            critical.append(f"Fix {count} broken URL(s) returning {issue.split(' ')[1]}.")
        elif issue in {"Missing <title>", "Missing meta description", "Missing H1", "Missing canonical"}:
            high.append(f"Resolve \"{issue}\" on {count} page(s) via shared templates/components.")
        elif issue.startswith("Slow response"):
            high.append(f"Improve performance on {count} page(s) exceeding 3s response time.")
        elif issue.startswith("Missing ") and "header" in issue:
            high.append(f"Set {issue.replace('Missing ', '').replace(' header', '')} globally ({count} checks).")
        else:
            medium.append(f"Address \"{issue}\" on {count} page(s).")
    return {"critical": critical, "high": high, "medium": medium}


def prompt_script(results):
    lines = []
    for r in results:
        p = build_plan(r)
        lines.append(
            f"Site: {r['site']}\\n"
            f"- Pages scanned: {r['scanned_pages']}\\n"
            f"- Top issues: {', '.join([f'{i} ({c})' for i,c in top_issues(r['issue_histogram'], 8)])}\\n"
            f"- Critical actions: {' '.join(p['critical']) if p['critical'] else 'None detected in sample.'}\\n"
            f"- High-priority actions: {' '.join(p['high']) if p['high'] else 'None detected in sample.'}"
        )

    return f"""You are a senior web engineer and technical SEO specialist. Execute same-day remediation for blazesportsintel.com and austinhumphrey.com.

Execution constraints:
1) Work in small commits by issue category.
2) Capture before/after proof (route checks, headers, Lighthouse snapshots).
3) Deploy only after route smoke tests and rollback notes.
4) Prioritize broken links -> indexability -> security headers -> speed -> conversion tracking.

Required actions:
A) Crawl complete route inventory from sitemap + internal links.
B) Fix all 4xx/5xx URLs with either restore, redirect, or link update.
C) Ensure every indexable page has unique title, meta description, canonical, and exactly one H1.
D) Add/verify OG tags and structured data (Organization/WebSite/Person/Article where relevant).
E) Enforce HTTPS canonicalization and global security headers (HSTS, CSP, X-Content-Type-Options, Referrer-Policy).
F) Optimize LCP/CLS/INP on top templates; compress images and defer non-critical JS.
G) Validate analytics events, forms, CTA links, and thank-you page tracking.
H) Re-run crawl and confirm: 0 internal broken links + metadata completeness + header coverage.

Crawl-based checklist:
{chr(10).join(lines)}

Definition of done:
- 0 internal broken links.
- 100% metadata coverage (title/meta/canonical/H1) for indexable pages.
- Security headers present on all HTML responses.
- Documented CWV/Lighthouse improvement and change log.
"""


def render_markdown(results):
    sections = []
    for r in results:
        risky = sorted([p for p in r["pages"] if p["issues"]], key=lambda x: len(x["issues"]), reverse=True)[:15]
        plan = build_plan(r)
        probe_block = ""
        if r.get("route_probe"):
            probe_rows = "\n".join(
                [
                    f"- {x['url']} -> {x['status']}; canonical: {x['canonical'] or 'none'}; body-hash: {x['body_hash']}"
                    for x in r["route_probe"]
                ]
            )
            probe_block = f"\n### Route Probe (fallback-route detection)\n{probe_rows}\n"

        sections.append(
            f"## {r['site']}\n\n"
            f"- **Pages scanned:** {r['scanned_pages']}\n"
            f"- **Discovered internal URLs:** {r['discovered_urls']}\n"
            f"- **Status histogram:** {', '.join([f'{k}: {v}' for k,v in r['status_histogram'].items()])}\n\n"
            f"### Top Issue Patterns\n"
            + "\n".join([f"- {issue}: {count}" for issue, count in top_issues(r["issue_histogram"], 12)])
            + "\n\n### Highest-Risk URLs (sample)\n"
            + ("\n".join([f"- {p['url']} -> {p['status']}; issues: {'; '.join(p['issues'])}" for p in risky]) if risky else "- none")
            + "\n\n### Action Plan (Do Today)\n"
            + "**Critical**\n"
            + ("\n".join([f"- {x}" for x in plan["critical"]]) if plan["critical"] else "- none in crawl sample")
            + "\n\n**High**\n"
            + ("\n".join([f"- {x}" for x in plan["high"]]) if plan["high"] else "- none in crawl sample")
            + "\n\n**Medium**\n"
            + ("\n".join([f"- {x}" for x in plan["medium"]]) if plan["medium"] else "- none in crawl sample")
            + "\n"
            + probe_block
        )

    ps = prompt_script(results)
    return (
        f"# Website Remediation Audit ({date.today().isoformat()})\n\n"
        "This report was generated by `scripts/site_audit.py` by crawling sitemap-discovered and internally linked routes for both requested domains.\n\n"
        + "\n".join(sections)
        + "\n## Implementation Prompt Script\n\n```text\n"
        + ps
        + "\n```\n"
    )


def main():
    results = []
    for site in SITES:
        print(f"Auditing {site} ...")
        results.append(crawl_site(site))

    out = Path("docs/audits")
    out.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()

    json_path = out / f"website-audit-{today}.json"
    md_path = out / f"website-audit-{today}.md"
    prompt_path = out / f"website-remediation-prompt-{today}.txt"

    json_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown(results), encoding="utf-8")
    prompt_path.write_text(prompt_script(results), encoding="utf-8")

    print(f"Saved: {json_path}")
    print(f"Saved: {md_path}")
    print(f"Saved: {prompt_path}")


if __name__ == "__main__":
    main()
