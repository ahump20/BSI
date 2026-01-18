# Legal Compliance Implementation Guide

## Blaze Sports Intel - blazesportsintel.com

**Last Updated:** November 9, 2025
**Version:** 1.0
**Platform:** Cloudflare Pages

---

## Table of Contents

1. [Overview](#overview)
2. [Files Created](#files-created)
3. [Integration Steps](#integration-steps)
4. [Cloudflare Configuration](#cloudflare-configuration)
5. [Testing Checklist](#testing-checklist)
6. [Compliance Validation](#compliance-validation)
7. [Ongoing Maintenance](#ongoing-maintenance)
8. [Support & Resources](#support--resources)

---

## Overview

This implementation provides complete legal compliance infrastructure for blazesportsintel.com, including:

- **GDPR Compliance** (European Union visitors)
- **CCPA Compliance** (California residents)
- **COPPA Compliance** (children under 13)
- **Cookie Consent** (EU Cookie Law)
- **Accessibility** (WCAG 2.1 AA standards)
- **Data Privacy Rights** (access, export, deletion)

---

## Files Created

### Legal Pages (Public HTML)

```
/public/
├── privacy.html          # Privacy Policy (GDPR/CCPA/COPPA)
├── terms.html            # Terms of Service (game-specific)
├── cookies.html          # Cookie Policy (detailed)
└── components/
    ├── cookie-banner.js  # Cookie consent banner (auto-loads)
    └── legal-footer.js   # Legal footer web component
```

### API Functions (Cloudflare Pages Functions)

```
/functions/api/
├── consent.js            # Cookie consent management (KV storage)
└── privacy/
    └── export.js         # GDPR data export & deletion
```

### Configuration Files

All configuration is handled through existing `wrangler.toml` and Cloudflare KV bindings.

---

## Integration Steps

### Step 1: Add Legal Footer to All Pages

Add this script tag before `</body>` on every page:

```html
<!-- Legal Footer Component -->
<script src="/components/legal-footer.js"></script>
<legal-footer></legal-footer>
```

**Example Integration:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Blaze Sports Intel</title>
  </head>
  <body>
    <!-- Your page content -->

    <!-- Legal Footer (add before closing body tag) -->
    <script src="/components/legal-footer.js"></script>
    <legal-footer></legal-footer>
  </body>
</html>
```

---

### Step 2: Add Cookie Consent Banner

Add this script tag in the `<head>` section of all pages:

```html
<!-- Cookie Consent Banner (GDPR/CCPA Compliance) -->
<script src="/components/cookie-banner.js" defer></script>
```

**Full Head Example:**

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blaze Sports Intel</title>

  <!-- Cookie Consent (must load early) -->
  <script src="/components/cookie-banner.js" defer></script>

  <!-- Other scripts -->
</head>
```

**Behavior:**

- Auto-displays on first visit
- Respects Do Not Track (DNT) signals
- Stores preferences in localStorage + Cloudflare KV
- Shows banner again after 1 year (consent renewal)

---

### Step 3: Update Existing Pages

#### Main Index Page

Edit `/public/index.html` or your main template:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Blaze Sports Intel - Sports Analytics & Predictions</title>

    <!-- Cookie Consent -->
    <script src="/components/cookie-banner.js" defer></script>

    <!-- Existing scripts -->
  </head>
  <body>
    <!-- Existing content -->

    <!-- Legal Footer -->
    <script src="/components/legal-footer.js"></script>
    <legal-footer></legal-footer>
  </body>
</html>
```

#### Game Page

For the mobile baseball game, add age gate if collecting data from children:

```html
<!-- Example: Game page with age verification -->
<script>
  function checkAge() {
    const age = prompt('To play, please enter your age:');
    if (age < 13) {
      alert(
        'Players under 13 need parental consent. Please have a parent email ahump20@outlook.com'
      );
      return false;
    }
    return true;
  }

  if (!checkAge()) {
    window.location.href = '/';
  }
</script>
```

---

### Step 4: Update Redirects

Edit `/public/_redirects`:

```
# Legal pages (ensure they load correctly)
/privacy              /privacy.html           200
/terms                /terms.html             200
/cookies              /cookies.html           200

# Legacy URLs (if any)
/privacy-policy       /privacy.html           301
/tos                  /terms.html             301
```

---

### Step 5: Update Sitemap

Edit `/public/sitemap.xml` to include legal pages:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Existing URLs -->

  <!-- Legal Pages -->
  <url>
    <loc>https://blazesportsintel.com/privacy</loc>
    <lastmod>2025-11-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://blazesportsintel.com/terms</loc>
    <lastmod>2025-11-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://blazesportsintel.com/cookies</loc>
    <lastmod>2025-11-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

---

## Cloudflare Configuration

### Step 1: Verify KV Namespace

Ensure your `wrangler.toml` has KV binding:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"  # Replace with your actual KV namespace ID
```

If you don't have a KV namespace yet:

```bash
# Create KV namespace
wrangler kv:namespace create "CACHE"

# Note the ID and add to wrangler.toml
```

---

### Step 2: Verify Analytics Binding

Add Analytics Engine binding if not present:

```toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "blazesports_analytics"
```

---

### Step 3: Set Security Headers

Edit `/public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.cloudflare.com;

# Legal pages can be embedded (for iframe previews)
/privacy.html
  X-Frame-Options: SAMEORIGIN

/terms.html
  X-Frame-Options: SAMEORIGIN

/cookies.html
  X-Frame-Options: SAMEORIGIN
```

---

### Step 4: Deploy to Cloudflare Pages

```bash
# Build and deploy
npm run build
wrangler pages deploy dist --project-name blazesportsintel --branch main

# Or use npm script
npm run deploy:production
```

---

## Testing Checklist

### Functional Testing

- [ ] Privacy Policy page loads at `/privacy`
- [ ] Terms of Service page loads at `/terms`
- [ ] Cookie Policy page loads at `/cookies`
- [ ] Cookie banner displays on first visit
- [ ] Cookie banner respects "Do Not Track" signal
- [ ] "Accept All" button sets analytics cookies
- [ ] "Essential Only" button disables analytics
- [ ] "Customize" button opens settings modal
- [ ] Cookie preferences persist across sessions
- [ ] Legal footer displays on all pages
- [ ] All footer links work correctly
- [ ] GDPR export function works (`/api/privacy/export?userId=test`)
- [ ] GDPR deletion works (`/api/privacy/export?userId=test&confirm=DELETE_MY_DATA` with DELETE method)

---

### Mobile Testing

- [ ] Pages are readable on mobile devices (iOS Safari, Android Chrome)
- [ ] Cookie banner is accessible on mobile
- [ ] Footer is responsive on small screens
- [ ] Legal pages scroll smoothly on mobile
- [ ] Text is legible without zooming
- [ ] Buttons are touch-friendly (minimum 44x44px)

---

### Accessibility Testing

- [ ] All pages have proper heading hierarchy (h1 → h2 → h3)
- [ ] Links have descriptive text (not "click here")
- [ ] Color contrast meets WCAG AA standards (4.5:1 for text)
- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter, Escape)
- [ ] Focus indicators are visible
- [ ] Screen reader announces content correctly
- [ ] Cookie banner traps focus (accessibility best practice)
- [ ] ARIA labels are present on interactive elements

**Testing Tools:**

- Chrome Lighthouse (Accessibility score)
- WAVE Browser Extension
- axe DevTools
- Screen reader (NVDA on Windows, VoiceOver on Mac/iOS)

---

### Compliance Validation

#### GDPR Compliance

- [ ] Cookie consent obtained before setting non-essential cookies
- [ ] Privacy policy explains data collection clearly
- [ ] Users can access their data (`/api/privacy/export`)
- [ ] Users can delete their data (DELETE endpoint)
- [ ] International data transfers disclosed (Cloudflare SCCs)
- [ ] Data retention periods specified
- [ ] Contact information provided (ahump20@outlook.com)

#### CCPA Compliance

- [ ] Privacy policy includes California-specific rights
- [ ] "Do not sell my data" notice (we don't sell data - disclosed)
- [ ] Users can request data export
- [ ] Users can request data deletion
- [ ] No discrimination for exercising rights

#### COPPA Compliance

- [ ] Age verification for children under 13 (if applicable)
- [ ] Parental consent mechanism in place
- [ ] No collection of children's personal data without consent
- [ ] Privacy policy addresses children's privacy

---

### Browser Testing

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest - macOS and iOS)
- [ ] Edge (latest)
- [ ] Samsung Internet (Android)

---

### Performance Testing

- [ ] Legal pages load in under 2 seconds (3G network)
- [ ] Cookie banner doesn't block page rendering
- [ ] Footer doesn't cause layout shift (CLS)
- [ ] JavaScript is minified in production
- [ ] Images are optimized (if any)

**Tools:**

- Chrome DevTools (Network tab)
- Lighthouse Performance score
- WebPageTest.org

---

## Compliance Validation

### GDPR Checklist

| Requirement                 | Status | Evidence                                                   |
| --------------------------- | ------ | ---------------------------------------------------------- |
| Lawful basis for processing | ✅     | Consent + Legitimate Interest documented in Privacy Policy |
| Transparent data collection | ✅     | Privacy Policy lists all data collected                    |
| Right to access             | ✅     | `/api/privacy/export` endpoint                             |
| Right to erasure            | ✅     | DELETE endpoint                                            |
| Right to portability        | ✅     | JSON export format                                         |
| Right to object             | ✅     | Cookie opt-out mechanism                                   |
| Data protection by design   | ✅     | Privacy-preserving analytics, IP anonymization             |
| Data breach notification    | ✅     | Procedure documented in Privacy Policy                     |
| DPO contact                 | ✅     | ahump20@outlook.com                                        |

---

### CCPA Checklist

| Requirement          | Status | Evidence                                     |
| -------------------- | ------ | -------------------------------------------- |
| Notice at collection | ✅     | Privacy Policy disclosed at signup           |
| Right to know        | ✅     | Privacy Policy + data export                 |
| Right to delete      | ✅     | DELETE endpoint                              |
| Right to opt-out     | ✅     | Cookie banner                                |
| No sale of data      | ✅     | Explicitly stated in Privacy Policy          |
| Non-discrimination   | ✅     | Service functions same regardless of choices |

---

### COPPA Checklist

| Requirement                 | Status | Evidence                      |
| --------------------------- | ------ | ----------------------------- |
| Privacy policy for children | ✅     | Section 2 of Privacy Policy   |
| Parental consent for <13    | ✅     | Email-based consent mechanism |
| Limited data collection     | ✅     | No personal data for children |
| Parental access/deletion    | ✅     | Contact email provided        |
| Data security               | ✅     | HTTPS, Cloudflare security    |

---

## Ongoing Maintenance

### Annual Review (Every 12 Months)

- [ ] Review Privacy Policy for accuracy
- [ ] Update Terms of Service if features change
- [ ] Check for new legal requirements (GDPR updates, state laws)
- [ ] Verify third-party data provider terms compliance
- [ ] Update copyright year in footer (automated in legal-footer.js)

---

### When Adding New Features

Before launching new features, ask:

1. **Does it collect personal data?**
   - If yes, update Privacy Policy
   - Add to GDPR export function

2. **Does it use cookies?**
   - If yes, update Cookie Policy
   - Add to cookie consent banner options

3. **Does it involve children?**
   - If yes, review COPPA compliance
   - Consider age gate

4. **Does it share data with third parties?**
   - If yes, update Privacy Policy
   - Ensure data processing agreements in place

---

### Data Breach Response Plan

If a data breach occurs:

1. **Immediate (Within 24 hours)**
   - Contain the breach
   - Assess scope of data affected
   - Notify Austin (ahump20@outlook.com)

2. **Within 72 hours (GDPR requirement)**
   - Notify supervisory authority if EU data affected
   - Document the breach (what, when, how many affected)

3. **User Notification**
   - If high risk to users, notify affected individuals
   - Provide steps to protect themselves
   - Offer free credit monitoring if financial data exposed

4. **Post-Incident**
   - Update security measures
   - Document lessons learned
   - Update Privacy Policy if needed

---

### Legal Updates

**Monitor these sources for changes:**

- GDPR Updates: [https://gdpr.eu](https://gdpr.eu)
- CCPA Updates: [https://oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)
- FTC COPPA: [https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)

**Subscribe to:**

- Cloudflare Blog (compliance updates)
- IAPP (International Association of Privacy Professionals)

---

## Support & Resources

### Internal Contacts

- **Privacy Officer:** Austin Humphrey (ahump20@outlook.com)
- **Technical Lead:** Austin Humphrey (ahump20@outlook.com)
- **Legal Questions:** ahump20@outlook.com

---

### External Resources

**GDPR:**

- Official Text: [https://gdpr-info.eu/](https://gdpr-info.eu/)
- ICO Guide: [https://ico.org.uk/for-organisations/guide-to-data-protection/](https://ico.org.uk/for-organisations/guide-to-data-protection/)

**CCPA:**

- Official Text: [https://oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)
- CCPA vs GDPR: [https://www.osano.com/articles/ccpa-vs-gdpr](https://www.osano.com/articles/ccpa-vs-gdpr)

**COPPA:**

- FTC Compliance Guide: [https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)

**Cookies:**

- EU Cookie Law: [https://gdpr.eu/cookies/](https://gdpr.eu/cookies/)
- IAB Europe: [https://iabeurope.eu/transparency-consent-framework/](https://iabeurope.eu/transparency-consent-framework/)

**Accessibility:**

- WCAG 2.1: [https://www.w3.org/WAI/WCAG21/quickref/](https://www.w3.org/WAI/WCAG21/quickref/)
- WebAIM: [https://webaim.org/](https://webaim.org/)

**Cloudflare:**

- Privacy Documentation: [https://www.cloudflare.com/trust-hub/gdpr/](https://www.cloudflare.com/trust-hub/gdpr/)
- KV Documentation: [https://developers.cloudflare.com/kv/](https://developers.cloudflare.com/kv/)

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Build project
npm run build

# Deploy to Cloudflare Pages
npm run deploy:production

# Test locally
npm run preview

# Verify legal pages
open http://localhost:4173/privacy
open http://localhost:4173/terms
open http://localhost:4173/cookies
```

---

## File Structure Summary

```
BSI/
├── public/
│   ├── privacy.html                 # Privacy Policy (GDPR/CCPA/COPPA)
│   ├── terms.html                   # Terms of Service
│   ├── cookies.html                 # Cookie Policy
│   ├── _redirects                   # URL redirects
│   ├── _headers                     # Security headers
│   ├── sitemap.xml                  # SEO sitemap
│   └── components/
│       ├── cookie-banner.js         # Cookie consent UI
│       └── legal-footer.js          # Legal footer component
├── functions/
│   └── api/
│       ├── consent.js               # Cookie consent API
│       └── privacy/
│           └── export.js            # GDPR export/delete
├── wrangler.toml                    # Cloudflare config
└── LEGAL-COMPLIANCE-IMPLEMENTATION.md  # This file
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All legal pages reviewed for accuracy
- [ ] Contact email verified (ahump20@outlook.com)
- [ ] KV namespace created and bound
- [ ] Analytics Engine configured
- [ ] Security headers applied
- [ ] Cookie banner tested on multiple browsers
- [ ] GDPR export function tested
- [ ] Mobile responsiveness verified
- [ ] Accessibility tested (Lighthouse score >90)
- [ ] Legal footer appears on all pages
- [ ] Sitemap updated
- [ ] Redirects configured
- [ ] Performance optimized (page load <2s)

---

## Post-Deployment Verification

After deploying:

```bash
# Test legal pages
curl -I https://blazesportsintel.com/privacy
curl -I https://blazesportsintel.com/terms
curl -I https://blazesportsintel.com/cookies

# Test API endpoints
curl https://blazesportsintel.com/api/consent?userId=test
curl https://blazesportsintel.com/api/privacy/export?userId=test

# Check security headers
curl -I https://blazesportsintel.com | grep -E "X-Frame-Options|X-Content-Type-Options|X-XSS-Protection"

# Verify HTTPS
openssl s_client -connect blazesportsintel.com:443 -servername blazesportsintel.com
```

---

## Troubleshooting

### Cookie Banner Not Showing

1. Check browser console for errors
2. Verify `/components/cookie-banner.js` loads
3. Clear localStorage and reload
4. Disable Do Not Track in browser settings

### GDPR Export Failing

1. Check KV namespace is bound correctly
2. Verify userId exists in storage
3. Check Cloudflare Workers logs
4. Ensure CORS headers are set

### Footer Not Displaying

1. Verify `/components/legal-footer.js` loads
2. Check custom element registration
3. Ensure Shadow DOM is supported (all modern browsers)
4. Check for JavaScript errors

---

## Version History

| Version | Date       | Changes                |
| ------- | ---------- | ---------------------- |
| 1.0     | 2025-11-09 | Initial implementation |

---

## License & Copyright

All legal compliance code is proprietary to Blaze Sports Intel.

- Privacy Policy: © 2025 Blaze Sports Intel
- Terms of Service: © 2025 Blaze Sports Intel
- Cookie Policy: © 2025 Blaze Sports Intel

**Contact:** ahump20@outlook.com
**Website:** blazesportsintel.com

---

**End of Implementation Guide**
