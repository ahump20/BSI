# Postgres & Object Storage Bootstrap Guide

This runbook covers the steps required to provision Postgres with SSL, configure Alembic migrations, and connect the NIL ingestion pipeline to S3-compatible object storage (AWS S3 or Cloudflare R2) for staging and production.

## 1. Environment Variables

Populate the following variables for each environment (staging/production). Store secrets in the platform secret manager (e.g., GitHub Actions, Vercel, or Cloudflare Workers Secrets).

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy DSN for the Postgres instance (e.g., `postgresql+psycopg://user:pass@host:5432/dbname`). SSL must be enabled at the database level. |
| `RAW_STORAGE_BUCKET` | Name of the S3/R2 bucket for raw pipeline artifacts. |
| `OBJECT_STORAGE_REGION` | AWS region (for S3) or `auto`/closest region (for R2). |
| `OBJECT_STORAGE_ENDPOINT` | Custom endpoint URL for R2 (e.g., `https://<accountid>.r2.cloudflarestorage.com`) or leave blank for AWS S3. |
| `OBJECT_STORAGE_ACCESS_KEY_ID` | Access key with write privileges to the bucket. |
| `OBJECT_STORAGE_SECRET_ACCESS_KEY` | Secret key paired with the access key. |
| `OBJECT_STORAGE_SESSION_TOKEN` | Optional session token for temporary credentials. |
| `CLOUDFLARE_ACCOUNT_ID` | Required when using R2 with API bootstrap. |
| `CLOUDFLARE_R2_TOKEN` | API token with R2 `Buckets` write permissions (optional unless bucket creation should be automated). |

## 2. Provision Postgres

1. Create a managed Postgres instance (e.g., Supabase, RDS, Neon, Timescale). Ensure TLS is enabled and require SSL connections.
2. Whitelist CI/CD and application networks.
3. Create the target database/schema and grant privileges to the service user referenced in `DATABASE_URL`.
4. Optionally, upload the CA bundle and record its filesystem location if mutual TLS is required. Set `database.ssl.root_cert_path` in `config/settings.yaml` accordingly.

## 3. Run Alembic Migrations

The repository now includes an Alembic environment. Use the same commands for staging and production.

```bash
# Install dependencies
pip install -r requirements.txt

# Ensure DATABASE_URL is exported
export DATABASE_URL="postgresql+psycopg://user:pass@host:5432/dbname"

# Run migrations
alembic upgrade head
```

To generate SQL without executing it (useful for change reviews):

```bash
alembic upgrade head --sql > migrations.sql
```

> **Note:** The Alembic environment pulls configuration from `config/settings.yaml`, so custom pool sizes or SSL cert paths propagate automatically.

## 4. Configure Object Storage

### AWS S3

1. Create or designate an S3 bucket.
2. Enable default encryption (AES-256 or KMS) and block public access.
3. Create an IAM user or role with the following permissions on the bucket: `s3:PutObject`, `s3:GetObject`, `s3:ListBucket`.
4. Populate the `OBJECT_STORAGE_*` variables with the IAM credentials.

### Cloudflare R2

1. Create the R2 bucket from the dashboard or via API.
2. Generate an `Access Key ID` and `Secret Access Key` for the pipeline.
3. Set `OBJECT_STORAGE_ENDPOINT` to the R2 S3-compatible endpoint (e.g., `https://<accountid>.r2.cloudflarestorage.com`).
4. If automated bucket creation is desired, supply `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_R2_TOKEN`; the `RawStorageClient` will attempt to create the bucket if it does not exist.

## 5. Deployment Workflow

1. Export all required environment variables (or configure them in the deployment platform).
2. Run `alembic upgrade head` during the deployment pipeline prior to starting application containers.
3. Redeploy application services. The runtime will enforce SSL and connection pooling for Postgres and persist raw artifacts in the configured S3/R2 bucket.
4. Monitor CloudWatch (or Cloudflare Logs) and Postgres metrics for connection pool saturation and error rates.

## 6. Disaster Recovery Checklist

- Enable automated Postgres backups and test point-in-time recovery quarterly.
- Configure versioning (S3) or object lifecycle rules (R2) for raw artifacts.
- Keep Alembic revision history in source control; never edit migrations retroactively in production.
- Document credential rotation runbooks for both database and storage secrets.
