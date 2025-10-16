# Cloudflare Email Routing Configuration for blazesportsintel.com

## Overview
Configure email forwarding for legal and compliance addresses to route all messages to `austin@blazesportsintel.com`.

## Required Email Addresses

| Email Address | Purpose | Forward To |
|---------------|---------|------------|
| privacy@blazesportsintel.com | GDPR/CCPA data requests, privacy inquiries | austin@blazesportsintel.com |
| legal@blazesportsintel.com | Legal notices, terms violations, compliance | austin@blazesportsintel.com |
| dmca@blazesportsintel.com | Copyright takedown notices (DMCA) | austin@blazesportsintel.com |
| accessibility@blazesportsintel.com | WCAG compliance, accessibility feedback | austin@blazesportsintel.com |

## Setup Instructions

### Step 1: Access Cloudflare Email Routing

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select the **blazesportsintel.com** domain
3. Navigate to **Email** → **Email Routing** in the left sidebar

### Step 2: Enable Email Routing

If not already enabled:

1. Click **Enable Email Routing**
2. Cloudflare will automatically add the required DNS records:
   - MX records for email delivery
   - TXT records for SPF authentication

### Step 3: Configure Destination Address

1. In the **Destination addresses** section, click **Add destination address**
2. Enter email: `austin@blazesportsintel.com`
3. Click **Send verification email**
4. Check inbox for austin@blazesportsintel.com and click verification link
5. Once verified, this address will be available as a forwarding destination

### Step 4: Create Routing Rules

For each email address, create a catch-all or specific routing rule:

#### Option A: Catch-All Rule (Recommended)
Forward ALL emails to austin@blazesportsintel.com:

1. Go to **Routing rules** section
2. Click **Create address**
3. Select **Catch-all address**
4. Action: **Send to an email** → Select `austin@blazesportsintel.com`
5. Click **Save**

This single rule forwards all mail addressed to *@blazesportsintel.com to austin@blazesportsintel.com.

#### Option B: Specific Address Rules
Create individual rules for each address:

1. Go to **Routing rules** section
2. Click **Create address**
3. Select **Custom address**

For each address:

**Privacy Address:**
- Custom address: `privacy`
- Action: Send to → `austin@blazesportsintel.com`
- Save

**Legal Address:**
- Custom address: `legal`
- Action: Send to → `austin@blazesportsintel.com`
- Save

**DMCA Address:**
- Custom address: `dmca`
- Action: Send to → `austin@blazesportsintel.com`
- Save

**Accessibility Address:**
- Custom address: `accessibility`
- Action: Send to → `austin@blazesportsintel.com`
- Save

### Step 5: Verify Configuration

After setup, test each address:

```bash
# Send test emails
echo "Privacy inquiry test" | mail -s "Test Privacy Email" privacy@blazesportsintel.com
echo "Legal notice test" | mail -s "Test Legal Email" legal@blazesportsintel.com
echo "DMCA takedown test" | mail -s "Test DMCA Email" dmca@blazesportsintel.com
echo "Accessibility feedback test" | mail -s "Test Accessibility Email" accessibility@blazesportsintel.com
```

Check austin@blazesportsintel.com inbox to verify all messages arrive.

## DNS Records (Auto-Configured)

Cloudflare will automatically add these DNS records when Email Routing is enabled:

```
MX    @    mx1.cloudflare.net    Priority: 89
MX    @    mx2.cloudflare.net    Priority: 93
TXT   @    v=spf1 include:_spf.mx.cloudflare.net ~all
```

No manual DNS configuration required.

## Expected Behavior

✅ **All emails** to privacy@, legal@, dmca@, accessibility@ → **austin@blazesportsintel.com**

✅ **Automatic spam filtering** by Cloudflare

✅ **No storage** - emails are forwarded immediately (not stored on Cloudflare servers)

✅ **Email headers preserved** - original sender/recipient information maintained

## Compliance Notes

### GDPR/CCPA Compliance
- privacy@blazesportsintel.com provides clear contact point for data subject requests
- Response required within 30 days (GDPR) or 45 days (CCPA)

### DMCA Safe Harbor
- dmca@blazesportsintel.com satisfies DMCA designated agent requirement
- Must also register with U.S. Copyright Office at https://www.copyright.gov/dmca-directory/

### Accessibility Compliance
- accessibility@blazesportsintel.com provides contact for WCAG AA compliance feedback
- Response recommended within 5 business days

## Monitoring

Monitor email forwarding health in Cloudflare dashboard:

1. **Email** → **Email Routing** → **Overview**
2. View delivery statistics, bounce rates, and rejected emails
3. Check **Activity log** for detailed delivery records

## Alternative Setup (API Method)

If you prefer API configuration, use the Cloudflare Email Routing API:

```bash
# Get zone ID
ZONE_ID=$(wrangler whoami | grep "Zone ID" | awk '{print $3}')

# Enable Email Routing (if not already enabled)
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/email/routing/enable" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"

# Add destination address
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/email/routing/addresses" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"austin@blazesportsintel.com"}'

# Create catch-all routing rule
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/email/routing/rules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [{"type": "forward", "value": ["austin@blazesportsintel.com"]}],
    "matchers": [{"type": "all"}],
    "enabled": true,
    "name": "Legal Compliance Catch-All"
  }'
```

## Status Checklist

- [ ] Email Routing enabled on blazesportsintel.com
- [ ] Destination address austin@blazesportsintel.com verified
- [ ] Catch-all rule created OR individual rules created
- [ ] Test emails sent to all 4 addresses
- [ ] Test emails received in austin@blazesportsintel.com inbox
- [ ] DMCA agent registered with U.S. Copyright Office (if applicable)
- [ ] Legal pages updated with correct email addresses (Privacy Policy, Terms of Service)

---

**Last Updated:** October 16, 2025
**Maintained By:** Blaze Intelligence Engineering
**Domain:** blazesportsintel.com
