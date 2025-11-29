# BSI Secrets Inventory

> **Last Updated:** November 29, 2025
> **Maintainer:** Austin Humphrey (ahump20@outlook.com)

This document catalogs all secrets required for BSI deployment.

**NEVER commit actual secret values to this or any repository file.**

---

## Quick Reference

| Category | Required | Set Via | Verification |
|----------|----------|---------|--------------|
| Sports Data APIs | 2 | Cloudflare Secrets | `/api/admin/secrets-status` |
| Authentication | 3 | Cloudflare Secrets | `/api/admin/secrets-status` |
| Payments (Stripe) | 4 | Cloudflare Secrets | `/api/admin/secrets-status` |
| AI Services | 0-3 | Cloudflare Secrets | Optional fallbacks |
| Cloudflare Bindings | 2+ | wrangler.toml | Auto-configured |

---

## 1. Sports Data APIs

### SPORTSDATAIO_API_KEY (Required)

- **Purpose:** Access to SportsDataIO for MLB, NFL, NBA data
- **Get Key:** [sportsdata.io/developers](https://sportsdata.io/developers)
- **Format:** 32-character hexadecimal string
- **Example:** `6ca2adb39404482da5406f0a6cd7xxxx`
- **Set Command:**
  ```bash
  wrangler secret put SPORTSDATAIO_API_KEY
  ```

### CFBDATA_API_KEY (Required)

- **Purpose:** Access to College Football Data API
- **Get Key:** [collegefootballdata.com/key](https://collegefootballdata.com/key)
- **Format:** Base64 bearer token
- **Set Command:**
  ```bash
  wrangler secret put CFBDATA_API_KEY
  ```

### THEODDS_API_KEY (Optional)

- **Purpose:** Access to The Odds API for betting data
- **Get Key:** [the-odds-api.com](https://the-odds-api.com/)
- **Format:** 32-character hexadecimal string
- **Set Command:**
  ```bash
  wrangler secret put THEODDS_API_KEY
  ```

---

## 2. Authentication

### JWT_SECRET (Required)

- **Purpose:** Signing JWT session tokens
- **Requirements:** Minimum 32 characters, cryptographically random
- **Generate:**
  ```bash
  openssl rand -hex 32
  ```
- **Set Command:**
  ```bash
  wrangler secret put JWT_SECRET
  ```

### GOOGLE_CLIENT_ID (Required)

- **Purpose:** Google OAuth authentication
- **Get Credentials:** [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
- **Format:** `xxxx.apps.googleusercontent.com`
- **Set Command:**
  ```bash
  wrangler secret put GOOGLE_CLIENT_ID
  ```

### GOOGLE_CLIENT_SECRET (Required)

- **Purpose:** Google OAuth authentication
- **Get Credentials:** Same as GOOGLE_CLIENT_ID
- **Set Command:**
  ```bash
  wrangler secret put GOOGLE_CLIENT_SECRET
  ```

### SESSION_SECRET (Optional)

- **Purpose:** Session encryption
- **Generate:**
  ```bash
  openssl rand -hex 32
  ```
- **Set Command:**
  ```bash
  wrangler secret put SESSION_SECRET
  ```

### CSRF_SECRET (Optional)

- **Purpose:** CSRF token generation
- **Generate:**
  ```bash
  openssl rand -hex 32
  ```
- **Set Command:**
  ```bash
  wrangler secret put CSRF_SECRET
  ```

---

## 3. Payments (Stripe)

### STRIPE_SECRET_KEY (Required)

- **Purpose:** Stripe API authentication
- **Get Key:** [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- **Format:** `sk_live_...` (production) or `sk_test_...` (test)
- **Set Command:**
  ```bash
  wrangler secret put STRIPE_SECRET_KEY
  ```

### STRIPE_WEBHOOK_SECRET (Required)

- **Purpose:** Verify Stripe webhook signatures
- **Get Key:** [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
- **Format:** `whsec_...`
- **Set Command:**
  ```bash
  wrangler secret put STRIPE_WEBHOOK_SECRET
  ```

### STRIPE_PRO_PRICE_ID (Required)

- **Purpose:** Pro subscription tier price lookup
- **Current Value:** `price_1SX9voLvpRBk20R2pW0AjUIv`
- **Set Command:**
  ```bash
  wrangler secret put STRIPE_PRO_PRICE_ID
  # Enter: price_1SX9voLvpRBk20R2pW0AjUIv
  ```

### STRIPE_ENTERPRISE_PRICE_ID (Required)

- **Purpose:** Enterprise subscription tier price lookup
- **Current Value:** `price_1SX9w7LvpRBk20R2DJkKAH3y`
- **Set Command:**
  ```bash
  wrangler secret put STRIPE_ENTERPRISE_PRICE_ID
  # Enter: price_1SX9w7LvpRBk20R2DJkKAH3y
  ```

---

## 4. AI Services (All Optional)

### GOOGLE_GEMINI_API_KEY

- **Purpose:** Google Gemini for AI features
- **Get Key:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Set Command:**
  ```bash
  wrangler secret put GOOGLE_GEMINI_API_KEY
  ```

### OPENAI_API_KEY

- **Purpose:** Fallback LLM for content generation
- **Get Key:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Set Command:**
  ```bash
  wrangler secret put OPENAI_API_KEY
  ```

### ANTHROPIC_API_KEY

- **Purpose:** Fallback LLM for content generation
- **Get Key:** [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- **Set Command:**
  ```bash
  wrangler secret put ANTHROPIC_API_KEY
  ```

---

## 5. Security (Optional)

### ENCRYPTION_KEY

- **Purpose:** Data encryption at rest
- **Generate:**
  ```bash
  openssl rand -hex 32
  ```
- **Set Command:**
  ```bash
  wrangler secret put ENCRYPTION_KEY
  ```

### API_KEY_SALT

- **Purpose:** Salting user API key hashes
- **Generate:**
  ```bash
  openssl rand -hex 32
  ```
- **Set Command:**
  ```bash
  wrangler secret put API_KEY_SALT
  ```

---

## 6. Cloudflare Bindings

These are configured in `wrangler.toml`, not as secrets:

| Binding | Type | Resource Name |
|---------|------|---------------|
| `KV` | KV Namespace | `a53c3726fc3044be82e79d2d1e371d26` |
| `NIL_CACHE` | KV Namespace | Same as KV |
| `DB` | D1 Database | `bsi-historical-db` |
| `NIL_DB` | D1 Database | Same as DB |
| `SPORTS_DATA` | R2 Bucket | `blaze-sports-data-lake` |
| `NIL_ARCHIVE` | R2 Bucket | `blaze-nil-archive` |
| `AI` | Workers AI | Auto-configured |
| `VECTORIZE` | Vectorize | `sports-scouting-index` |
| `ANALYTICS` | Analytics Engine | `bsi_sports_metrics` |

---

## 7. GitHub Actions Secrets

Set these in [github.com/ahump20/BSI/settings/secrets/actions](https://github.com/ahump20/BSI/settings/secrets/actions):

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Wrangler deployment |
| `CLOUDFLARE_ACCOUNT_ID` | Account identification |
| `CLOUDFLARE_PAGES_PROJECT` | Pages project name (`blazesportsintel`) |
| `SPORTSDATAIO_API_KEY` | API tests in CI |

---

## Verification

### Check Cloudflare Secrets

```bash
# List configured secrets (shows names only, not values)
wrangler secret list

# Check via API endpoint
curl https://blazesportsintel.com/api/admin/secrets-status | jq '.summary'
```

### Check GitHub Secrets

```bash
# Via GitHub CLI
gh secret list --repo ahump20/BSI
```

---

## Setting All Required Secrets

Run this sequence to configure a fresh deployment:

```bash
# Sports Data
wrangler secret put SPORTSDATAIO_API_KEY
wrangler secret put CFBDATA_API_KEY

# Authentication
wrangler secret put JWT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# Payments
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRO_PRICE_ID
wrangler secret put STRIPE_ENTERPRISE_PRICE_ID

# Verify
curl https://blazesportsintel.com/api/admin/secrets-status | jq
```

---

## Troubleshooting

### "Secret not found" errors

1. Verify secret is set: `wrangler secret list`
2. Check binding name matches code (e.g., `SPORTSDATAIO_API_KEY` vs `SPORTSDATAIO_KEY`)
3. Redeploy after setting: `wrangler pages deploy`

### API returning 401/403

1. Verify key is valid with provider
2. Check key hasn't expired
3. Rotate key if compromised

### Missing bindings

1. Check `wrangler.toml` has correct resource IDs
2. Verify resources exist in Cloudflare Dashboard
3. Run `wrangler whoami` to confirm correct account

---

**Note:** This inventory does not contain actual secret values. All values shown are examples or public identifiers only.
