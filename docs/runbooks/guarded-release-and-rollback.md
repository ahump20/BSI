# Guarded Release and Rollback Runbook

This runbook defines the release and rollback flow for the main BSI Pages project (`blazesportsintel`).

## Guarded release

1. Run:

```bash
npm run release:guarded
```

2. The release command:
- Builds the site.
- Stages deploy output.
- Saves a deploy bundle at `.release-artifacts/releases/<timestamp>/deploy-bundle`.
- Deploys a preview branch.
- Runs smoke checks.
- Promotes to production only if smoke checks pass.

3. View the generated artifacts:

```bash
npm run rollback:pages:list
```

Each release folder includes:
- `guarded-release.log`
- `guarded-release-summary.json`
- `release-metadata.json`
- `deploy-bundle/`

## Rollback to last known release bundle

1. List available release bundles:

```bash
npm run rollback:pages:list
```

2. Roll back using the latest artifact bundle:

```bash
npm run rollback:pages -- --yes
```

3. Roll back to a specific artifact folder:

```bash
npm run rollback:pages -- --artifact-dir .release-artifacts/releases/<timestamp> --yes
```

The rollback script redeploys the saved `deploy-bundle` back to the `main` branch in Cloudflare Pages.

## Cross-property smoke command

Use this before and after major releases:

```bash
npm run smoke:cross-property
```

It validates:
- `https://blazesportsintel.com`
- `https://austinhumphrey.com`
- `https://blazecraft.app`
