# Seasonal Routing Documentation

## Overview

Blaze Sports Intel implements **intelligent seasonal routing** to automatically direct users to the most relevant sport based on the current time of year. This ensures users always land on the active sport without manual navigation.

## Season Calendar

| Sport | Active Season | Months | Route |
|-------|--------------|---------|-------|
| ⚾ **Baseball** | Spring | March 1 - June 30 | `/` (root) |
| 🏈 **Football** | Fall | August 1 - December 31 | `/football` |

### Off-Season Behavior

During months outside the active seasons, the system defaults to the most recently concluded season:

- **January - February**: Redirects to Football (fall season just ended)
- **July**: Shows Baseball (spring season just ended)

## User Preference Override

Users can manually select their preferred sport, overriding automatic seasonal routing.

### Query Parameter

Append `?sport=baseball` or `?sport=football` to any URL:

```
https://blazesportsintel.com/?sport=baseball
https://blazesportsintel.com/?sport=football
```

This sets a **30-day cookie** (`preferred_sport`) to remember the preference.

### Cookie Storage

The preference is stored as:
```
preferred_sport=baseball  (or football)
Path=/
Max-Age=2592000  (30 days)
SameSite=Lax
```

### Clearing Preference

To return to automatic seasonal routing:
1. Clear browser cookies for blazesportsintel.com, OR
2. Wait 30 days for cookie expiration

## Implementation Details

### Middleware Logic

Located at `/functions/_middleware.js`, the middleware executes in this order:

1. **Route Check**: Only applies to root path (`/`)
2. **Query Parameter**: Checks for `?sport=` override
3. **Cookie Check**: Checks for saved `preferred_sport` cookie
4. **Seasonal Logic**: Falls back to date-based routing
5. **Off-Season Default**: Uses most recent season

### Timezone

All date calculations use **America/Chicago** (Central Time) to align with user's stated location in Boerne, Texas.

### Redirect Type

Uses **302 (Temporary Redirect)** instead of 301 (Permanent) to allow seasonal changes without browser cache issues.

## Route Preservation

The middleware **only affects the root path** (`/`). All other routes pass through unchanged:

- ✅ `/football` - Direct access always works
- ✅ `/api/*` - API endpoints unaffected
- ✅ `/legal/*` - Legal pages unaffected
- ✅ `/about`, `/contact`, etc. - All static pages unaffected

## Testing Seasonal Routing

### Manual Testing

**Test current season**:
```bash
curl -I https://blazesportsintel.com/
# Should redirect to active sport based on current month
```

**Test baseball preference**:
```bash
curl -I https://blazesportsintel.com/?sport=baseball
# Should stay on root, set preferred_sport=baseball cookie
```

**Test football preference**:
```bash
curl -I https://blazesportsintel.com/?sport=football
# Should redirect to /football, set preferred_sport=football cookie
```

### Automated Testing

Create test cases with mocked dates:

```javascript
// Test March (baseball season)
const marchDate = new Date(2025, 2, 15) // March 15, 2025
// Expected: Route to /

// Test September (football season)
const septDate = new Date(2025, 8, 15) // September 15, 2025
// Expected: Redirect to /football

// Test January (off-season)
const janDate = new Date(2025, 0, 15) // January 15, 2025
// Expected: Redirect to /football (most recent season)

// Test July (off-season)
const julyDate = new Date(2025, 6, 15) // July 15, 2025
// Expected: Route to / (baseball most recent)
```

## Analytics

Track seasonal routing behavior with Cloudflare Analytics:

- Count of automatic redirects vs. manual overrides
- Most popular sport preference by geography
- Cookie retention rate (users who keep preferences)

## Future Enhancements

1. **Live season detection**: Query ESPN API for actual game schedules instead of hardcoded date ranges
2. **User location**: Customize defaults based on geographic region (e.g., SEC states default to football)
3. **Multi-sport expansion**: Add basketball (winter), track & field (spring) when implemented
4. **A/B testing**: Test different default behaviors during off-season months

## Troubleshooting

**Issue**: Stuck on wrong sport during season transition

**Solution**: Clear cookies or append `?sport=baseball` to override

**Issue**: Redirects not working in production

**Solution**: Verify `_middleware.js` is deployed and check Cloudflare Pages Functions logs

**Issue**: Timezone mismatch (wrong season detected)

**Solution**: Confirm `America/Chicago` timezone is correctly applied in `getCurrentDateInCentralTime()`

---

Last updated: October 2025
Middleware version: 1.0.0
