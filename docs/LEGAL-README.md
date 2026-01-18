# Legal Compliance Framework

## Blaze Sports Intel - blazesportsintel.com

**Version:** 1.0
**Date:** November 9, 2025
**Status:** Production Ready ✅

---

## Quick Start (5 Minutes)

### 1. Add to All HTML Pages

**In `<head>` section:**

```html
<script src="/components/cookie-banner.js" defer></script>
```

**Before `</body>` tag:**

```html
<script src="/components/legal-footer.js"></script>
<legal-footer></legal-footer>
```

### 2. Deploy to Cloudflare Pages

```bash
# Quick deploy
./scripts/deploy-legal-compliance.sh

# Or manually
npm run build
wrangler pages deploy dist --project-name blazesportsintel --branch main
```

### 3. Verify Deployment

Visit these URLs to confirm:

- https://blazesportsintel.com/privacy
- https://blazesportsintel.com/terms
- https://blazesportsintel.com/cookies
- https://blazesportsintel.com/accessibility

---

## What's Included

### Legal Documentation

- **Privacy Policy** - GDPR, CCPA, COPPA compliant (4,500 words)
- **Terms of Service** - Game-specific, Texas jurisdiction (6,000 words)
- **Cookie Policy** - EU Cookie Law compliant (2,800 words)
- **Accessibility Statement** - WCAG 2.1 AA (2,200 words)

### Interactive Components

- **Cookie Consent Banner** - Auto-shows, GDPR/CCPA compliant
- **Legal Footer** - Web component for consistent footer

### Backend Functions

- **Consent API** - Stores cookie preferences in Cloudflare KV
- **GDPR Export** - Exports all user data (JSON format)
- **GDPR Delete** - Deletes all user data (right to be forgotten)

---

## File Locations

```
BSI/
├── public/
│   ├── privacy.html                      ← Privacy Policy page
│   ├── terms.html                        ← Terms of Service page
│   ├── cookies.html                      ← Cookie Policy page
│   ├── accessibility.html                ← Accessibility Statement
│   └── components/
│       ├── cookie-banner.js              ← Cookie consent banner
│       └── legal-footer.js               ← Legal footer component
├── functions/api/
│   ├── consent.js                        ← Cookie consent API
│   └── privacy/
│       └── export.js                     ← GDPR export/delete
├── scripts/
│   └── deploy-legal-compliance.sh        ← Deployment script
├── LEGAL-COMPLIANCE-IMPLEMENTATION.md    ← Full implementation guide
├── LEGAL-COMPLIANCE-SUMMARY.md           ← Executive summary
└── LEGAL-README.md                       ← This file
```

---

## Integration Examples

### Example 1: Main Page

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Blaze Sports Intel</title>

    <!-- Cookie Consent (GDPR/CCPA) -->
    <script src="/components/cookie-banner.js" defer></script>

    <!-- Your other scripts -->
  </head>
  <body>
    <!-- Your content here -->

    <h1>Welcome to Blaze Sports Intel</h1>
    <p>Professional sports analytics and predictions</p>

    <!-- Legal Footer -->
    <script src="/components/legal-footer.js"></script>
    <legal-footer></legal-footer>
  </body>
</html>
```

### Example 2: Game Page

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Baseball Game | Blaze Sports Intel</title>

    <!-- Cookie Consent -->
    <script src="/components/cookie-banner.js" defer></script>
  </head>
  <body>
    <!-- Game canvas -->
    <canvas id="gameCanvas"></canvas>

    <!-- Legal Footer -->
    <script src="/components/legal-footer.js"></script>
    <legal-footer></legal-footer>

    <!-- Game script -->
    <script src="/js/game.js"></script>
  </body>
</html>
```

---

## API Usage

### Cookie Consent API

**Get user's consent preferences:**

```javascript
const response = await fetch('/api/consent?userId=user123');
const data = await response.json();

if (data.preferences.analytics) {
  // Enable analytics
}
```

**Save consent preferences:**

```javascript
const response = await fetch('/api/consent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    preferences: {
      essential: true,
      analytics: true,
    },
  }),
});
```

### GDPR Data Export

**Export all user data:**

```javascript
const response = await fetch('/api/privacy/export?userId=user123');
const blob = await response.blob();

// Download as JSON file
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'my-data.json';
a.click();
```

**Delete all user data:**

```javascript
const response = await fetch('/api/privacy/export?userId=user123&confirm=DELETE_MY_DATA', {
  method: 'DELETE',
});

const result = await response.json();
console.log(result.message); // "All your personal data has been permanently deleted"
```

---

## Compliance Checklist

### GDPR (European Union) ✅

- [x] Transparent data collection disclosure
- [x] Lawful basis for processing (consent + legitimate interest)
- [x] Right to access (export function)
- [x] Right to erasure (delete function)
- [x] Right to portability (JSON format)
- [x] Right to object (cookie opt-out)
- [x] Data minimization
- [x] Privacy by design
- [x] Data breach notification procedure
- [x] DPO contact information

### CCPA (California) ✅

- [x] Notice at collection
- [x] Right to know
- [x] Right to delete
- [x] Right to opt-out
- [x] No sale of personal information
- [x] Non-discrimination

### COPPA (Children) ✅

- [x] Privacy policy for children
- [x] Parental consent mechanism
- [x] Limited data collection for <13
- [x] Parental access and deletion rights
- [x] Data security measures

### WCAG 2.1 AA (Accessibility) ✅

- [x] Keyboard navigation
- [x] Screen reader compatible
- [x] Color contrast 4.5:1
- [x] Focus indicators
- [x] Mobile responsive
- [x] Semantic HTML

---

## Testing Commands

```bash
# Validate HTML
for file in public/*.html; do
    echo "Validating $file..."
    # Add your HTML validator here
done

# Test JavaScript syntax
node -c public/components/cookie-banner.js
node -c public/components/legal-footer.js
node -c functions/api/consent.js
node -c functions/api/privacy/export.js

# Test API endpoints (after deployment)
curl https://blazesportsintel.com/api/consent?userId=test
curl https://blazesportsintel.com/api/privacy/export?userId=test

# Test legal pages
curl -I https://blazesportsintel.com/privacy
curl -I https://blazesportsintel.com/terms
curl -I https://blazesportsintel.com/cookies
curl -I https://blazesportsintel.com/accessibility
```

---

## Customization Guide

### Update Contact Email

Search and replace `ahump20@outlook.com` with your email in:

- `public/privacy.html`
- `public/terms.html`
- `public/cookies.html`
- `public/accessibility.html`
- `public/components/legal-footer.js`

### Change Company Name

Search and replace "Blaze Sports Intel" in all files.

### Update Privacy Policy

Edit `/public/privacy.html` and update:

- Section 1.2: Add new data collection points
- Section 3: Add new data usage purposes
- Update "Last Updated" date

### Add New Cookie Category

Edit `/public/components/cookie-banner.js`:

1. Add new checkbox in `showCustomizeModal()`
2. Update `setConsent()` to include new category
3. Update Cookie Policy to document new cookies

---

## Troubleshooting

### Cookie Banner Not Showing

1. **Check browser console for errors**

   ```javascript
   // Open DevTools (F12) and look for errors
   ```

2. **Verify script loads**

   ```html
   <!-- Make sure this is in <head> -->
   <script src="/components/cookie-banner.js" defer></script>
   ```

3. **Clear localStorage**

   ```javascript
   localStorage.removeItem('cookie_consent');
   location.reload();
   ```

4. **Check Do Not Track**
   - Browser may have DNT enabled (banner auto-hides)
   - Disable in browser settings and reload

### Legal Footer Not Displaying

1. **Verify web component registration**

   ```javascript
   console.log(customElements.get('legal-footer')); // Should not be undefined
   ```

2. **Check Shadow DOM support**

   ```javascript
   console.log('attachShadow' in Element.prototype); // Should be true
   ```

3. **Ensure script loads**
   ```html
   <!-- Before </body> -->
   <script src="/components/legal-footer.js"></script>
   <legal-footer></legal-footer>
   ```

### API Endpoints Failing

1. **Check Cloudflare KV binding**
   - Ensure `CACHE` binding exists in `wrangler.toml`
   - Create KV namespace: `wrangler kv:namespace create CACHE`

2. **Verify function deployment**

   ```bash
   wrangler pages deployment list --project-name blazesportsintel
   ```

3. **Check CORS errors**
   - Functions include CORS headers by default
   - If issues persist, check browser console

### GDPR Export Returns Empty Data

- User may not have any stored data
- Check KV storage: `wrangler kv:key list --namespace-id=YOUR_ID`
- Verify userId is correct

---

## Maintenance Schedule

### Weekly

- [ ] Monitor consent banner analytics
- [ ] Review error logs (Sentry)

### Monthly

- [ ] Check for broken links in legal pages
- [ ] Review analytics for privacy compliance
- [ ] Test GDPR export function

### Quarterly

- [ ] Run accessibility audit (Lighthouse)
- [ ] Review and update legal pages if needed
- [ ] Check third-party provider terms

### Annually

- [ ] Full legal review (consider hiring attorney)
- [ ] Update copyright year (auto-updated in footer)
- [ ] Review GDPR/CCPA/COPPA for changes
- [ ] Renew data processing agreements

---

## Support

### Documentation

- **Full Implementation Guide:** `LEGAL-COMPLIANCE-IMPLEMENTATION.md`
- **Executive Summary:** `LEGAL-COMPLIANCE-SUMMARY.md`
- **This README:** Quick reference and troubleshooting

### Contact

- **Email:** ahump20@outlook.com
- **Subject Line:** "Legal Compliance - [Your Question]"
- **Response Time:** 24-72 hours

### External Resources

- [GDPR Official Text](https://gdpr-info.eu/)
- [CCPA Official Text](https://oag.ca.gov/privacy/ccpa)
- [COPPA Guide](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Version History

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0     | 2025-11-09 | Initial release |

---

## License

Copyright © 2025 Blaze Sports Intel. All rights reserved.

This legal compliance framework is proprietary software. Unauthorized copying, distribution, or modification is prohibited.

**Contact:** ahump20@outlook.com

---

**Last Updated:** November 9, 2025
**Maintained By:** Austin Humphrey (ahump20@outlook.com)
**Website:** blazesportsintel.com
