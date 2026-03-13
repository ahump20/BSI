#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import shutil
import stat
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "covered-repos.json"
TEMPLATE_ROOT = ROOT / "templates"
COMMON_TEMPLATE_PATHS = [
    Path(".githooks/pre-commit"),
    Path(".githooks/pre-push"),
    Path("scripts/install-git-hooks.sh"),
    Path("scripts/secret_guard.py"),
    Path(".github/workflows/repo-guardrails.yml"),
]
CLOUDFLARE_TEMPLATE_PATHS = [
    Path(".github/workflows/cloudflare-delivery.yml"),
]
EXECUTABLE_SUFFIXES = {".sh", ".py"}
EXECUTABLE_NAMES = {"pre-commit", "pre-push"}


def load_config() -> dict:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def run(command: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd,
        text=True,
        capture_output=True,
        check=False,
    )


def ensure_directory(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def copy_template(relative_path: Path, destination_root: Path) -> None:
    source = TEMPLATE_ROOT / relative_path
    destination = destination_root / relative_path
    ensure_directory(destination)
    shutil.copy2(source, destination)
    if destination.name in EXECUTABLE_NAMES or destination.suffix in EXECUTABLE_SUFFIXES:
        destination.chmod(destination.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def verify_remote(repo_root: Path, github_repo: str) -> bool:
    result = run(["git", "remote", "get-url", "origin"], cwd=repo_root)
    if result.returncode != 0:
        return False
    remote = result.stdout.strip()
    return github_repo in remote.replace(".git", "")


def install_hooks(repo_root: Path) -> None:
    run(["git", "config", "core.hooksPath", ".githooks"], cwd=repo_root)


def write_cloudflare_targets(repo_root: Path, config: dict) -> None:
    target_path = repo_root / ".github" / "cloudflare-targets.json"
    ensure_directory(target_path)
    target_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")


def sync_repo(entry: dict) -> tuple[str, str]:
    repo_root = Path(entry["path"])
    github_repo = entry["github_repo"]
    if not repo_root.exists():
        return (github_repo, "missing-local-path")
    if not (repo_root / ".git").exists():
        return (github_repo, "not-a-git-repo")
    if not verify_remote(repo_root, github_repo):
        return (github_repo, "origin-mismatch")

    for relative_path in COMMON_TEMPLATE_PATHS:
        copy_template(relative_path, repo_root)

    if entry.get("cloudflare_workflow"):
        for relative_path in CLOUDFLARE_TEMPLATE_PATHS:
            copy_template(relative_path, repo_root)
        write_cloudflare_targets(repo_root, entry["cloudflare_targets"])

    if entry.get("install_hooks", True):
        install_hooks(repo_root)

    return (github_repo, "synced")


def main() -> int:
    config = load_config()
    results = [sync_repo(entry) for entry in config["repos"]]
    for github_repo, status in results:
        print(f"{github_repo}\t{status}")
    failed = [status for _, status in results if status not in {"synced"}]
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
