# The Show API Sources & Data Model

## Verified Public Endpoints (MLB 25 — Compatibility Mode)

Base: `https://mlb25.theshow.com`

| Endpoint | Returns | Rate Notes |
|----------|---------|------------|
| `/apis/items.json` | Paginated card catalog (name, ovr, series, position, team) | Paginated, `?page=N` |
| `/apis/item.json?uuid={uuid}` | Single card detail + daily price trend + completed orders | Per-card |
| `/apis/listings.json` | Current buy/sell prices for all listed cards | Paginated |
| `/apis/listing.json?uuid={uuid}` | Single listing: best buy, best sell, completed orders | Per-card |
| `/apis/captains.json` | Captain definitions: requirements, boost conditions, thresholds | Single response |
| `/apis/meta_data.json` | Game metadata: series names, positions, teams, rarities | Single response |

### Pagination Structure

```
{
  "page": 1,
  "per_page": 25,
  "total_pages": N,
  "results": [ ... ]
}
```

### Item Object (Key Fields)

```
{
  "uuid": "string",
  "name": "string",
  "ovr": number,
  "series": "string",        // e.g., "Live", "Finest", "Awards"
  "team": "string",          // Full team name
  "team_short_name": "string",
  "display_position": "string",
  "rarity": "string",        // "Diamond", "Gold", "Silver", "Bronze", "Common"
  "img": "url",
  "has_augment": boolean,
  "augment_text": "string",
  "augment_end_date": "string",
  "sc_baked_img": "url"      // Splash card image
}
```

### Listing Object (Key Fields)

```
{
  "listing_name": "string",
  "best_sell_price": number,
  "best_buy_price": number,
  "item": { ... },           // Embedded item object
  "price_history": [         // Daily price data
    { "date": "YYYY-MM-DD", "best_sell_price": N, "best_buy_price": N }
  ]
}
```

### Captain Object (Key Fields)

```
{
  "name": "string",
  "img": "url",
  "description": "string",
  "boosts": [ ... ],         // Stat boosts granted
  "requirements": [ ... ]    // Cards/conditions needed to activate
}
```

**Compatibility mode rule:** All data from these endpoints is MLB 25 production data. Never present it as official MLB 26 data. Label source clearly in all UI and API responses.

## MLB 26 Endpoint Status

`mlb26.theshow.com` — NOT verified public. Do not hit in production. When SDS opens 26 endpoints:
1. Verify same pagination + object structure
2. Update `mlb-the-show-source.ts` base URL
3. Add feature flag to toggle compat mode off
4. Keep compat-mode labeling logic until verified stable

## D1 Schema (BSI Storage)

Cards, listings, and captain data sync from The Show API into D1 via `bsi-show-dd-sync` worker on a scheduled cron. D1 is the read source for all BSI frontend queries — never hit The Show API from the client.

Key tables: `show_dd_cards`, `show_dd_listings`, `show_dd_price_history`, `show_dd_captains`, `show_dd_collections`, `show_dd_watchlist`.

See `workers/migrations/056_show_dd.sql` for full schema.
