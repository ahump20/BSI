# Repo Governance

This directory is the source of truth for cross-repo secret guard rails and Cloudflare delivery standards.

## What lives here

- `covered-repos.json`
  - The local rollout inventory for repo-managed files and Cloudflare delivery configs.
- `sync_repo_governance.py`
  - Copies managed guardrail files into each covered local repo and configures `core.hooksPath` to `.githooks`.
- `enable_github_security.py`
  - Enables GitHub secret scanning, push protection, and Dependabot security updates across `ahump20` and `Blaze-sports-Intel` where GitHub supports those features.
- `templates/`
  - Managed hook scripts, secret scanner, and workflow templates that get stamped into target repos.

## Standard rollout

1. Update `covered-repos.json`.
2. Run `python3 tools/repo-governance/sync_repo_governance.py`.
3. Run `python3 tools/repo-governance/enable_github_security.py`.
4. Review `tools/repo-governance/github-security-rollout.json` for unsupported private repos and API skips.

## Guard rail contract

- Local commits are blocked by `.githooks/pre-commit` and `.githooks/pre-push`.
- CI runs `.github/workflows/repo-guardrails.yml`.
- Cloudflare deploy repos also get `.github/workflows/cloudflare-delivery.yml` plus `.github/cloudflare-targets.json`.
- BSI keeps its existing deploy workflow, but now emits deployment record artifacts with the same schema used by the standardized Cloudflare delivery workflow.
