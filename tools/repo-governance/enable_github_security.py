#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUTPUT_PATH = ROOT / "github-security-rollout.json"
OWNERS = ("ahump20", "Blaze-sports-Intel")


def gh_json(args: list[str]) -> object:
    command = ["env", "-u", "GITHUB_TOKEN", "gh", *args]
    output = subprocess.check_output(command, text=True)
    return json.loads(output)


def gh_api(args: list[str], body: dict | None = None) -> tuple[int, str, str]:
    command = ["env", "-u", "GITHUB_TOKEN", "gh", "api", *args]
    completed = subprocess.run(
        command,
        input=json.dumps(body) if body is not None else None,
        text=True,
        capture_output=True,
        check=False,
    )
    return (completed.returncode, completed.stdout, completed.stderr)


def list_repos(owner: str) -> list[dict]:
    return gh_json(
        [
            "repo",
            "list",
            owner,
            "--limit",
            "200",
            "--json",
            "name,isPrivate,isArchived,visibility,updatedAt,url",
        ]
    )


def patch_security(owner: str, name: str) -> dict:
    body = {
        "security_and_analysis": {
            "secret_scanning": {"status": "enabled"},
            "secret_scanning_push_protection": {"status": "enabled"},
            "dependabot_security_updates": {"status": "enabled"},
        }
    }
    code, stdout, stderr = gh_api(["-X", "PATCH", f"repos/{owner}/{name}", "--input", "-"], body=body)
    return {
        "code": code,
        "stdout": stdout.strip(),
        "stderr": stderr.strip(),
    }


def classify_patch_result(result: dict) -> str:
    if result["code"] == 0:
        return "updated"
    stderr = result.get("stderr", "")
    if "Secret scanning is not available for this repository" in stderr:
        return "skipped-unavailable"
    return "skipped-error"


def fetch_security(owner: str, name: str) -> dict:
    code, stdout, stderr = gh_api([f"repos/{owner}/{name}"])
    if code != 0:
        return {"error": stderr.strip() or stdout.strip()}
    data = json.loads(stdout)
    return data.get("security_and_analysis") or {}


def main() -> int:
    rollout: dict[str, list[dict]] = {}
    failures = 0

    for owner in OWNERS:
        rollout[owner] = []
        for repo in list_repos(owner):
            if repo.get("isArchived"):
                rollout[owner].append({**repo, "status": "skipped-archived"})
                continue

            result = patch_security(owner, repo["name"])
            security = fetch_security(owner, repo["name"])
            status = classify_patch_result(result)
            if status == "skipped-error":
                failures += 1
            rollout[owner].append(
                {
                    **repo,
                    "status": status,
                    "patch": result,
                    "security_and_analysis": security,
                }
            )

    OUTPUT_PATH.write_text(json.dumps(rollout, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
