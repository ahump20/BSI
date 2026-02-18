# BSI Live Game Widget - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         External Website / BSI Page                 │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  <script src="https://blazesportsintel.com/widget.js"        │ │
│  │          data-game-id="tex-lam-20260217"></script>            │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  <bsi-live-game data-game-id="tex-lam-20260217">             │ │
│  │    #shadow-root (open)                                        │ │
│  │      ┌─────────────────────────────────────────────────────┐ │ │
│  │      │  AWAY  3    ↓ BOT 4    2  HOME                       │ │ │
│  │      ├─────────────────────────────────────────────────────┤ │ │
│  │      │  ⬤ _ ⬤   •  •     [HIGH]                           │ │ │
│  │      │  Runner in scoring position, tying run at bat      │ │ │
│  │      ├─────────────────────────────────────────────────────┤ │ │
│  │      │  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │ │
│  │      │  TEX 48%                            LAM 52%        │ │ │
│  │      ├─────────────────────────────────────────────────────┤ │ │
│  │      │  Doe · 67 pitches · 3.12 ERA  |  RBI single        │ │ │
│  │      └─────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │    Polls every 15 seconds ↺                                  │ │
│  │  </bsi-live-game>                                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ fetch('/api/live/tex-lam-20260217')
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker (Hono)                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  GET /api/live/:gameId                                        │ │
│  │    ├─ Check BSI_PROD_CACHE (KV)                              │ │
│  │    │   ├─ Cache hit: return JSON (Cache-Control: max-age=15)│ │
│  │    │   └─ Cache miss: return stub data (Cache-Control: no-  │ │
│  │    │                                     store)               │ │
│  │    └─ CORS headers: Access-Control-Allow-Origin: *           │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
                                 │ writes live game data
┌─────────────────────────────────────────────────────────────────────┐
│             bsi-intelligence-stream Worker (Background)             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  await BSI_PROD_CACHE.put(                                    │ │
│  │    `live:${gameId}`,                                          │ │
│  │    JSON.stringify({                                           │ │
│  │      game_id, home, away, inning, half, situation,           │ │
│  │      win_probability, current_pitcher, last_play,            │ │
│  │      recent_pitches                                           │ │
│  │    }),                                                        │ │
│  │    { expirationTtl: 60 }                                      │ │
│  │  )                                                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
                                 │ fetches from external APIs
┌─────────────────────────────────────────────────────────────────────┐
│           External Data Sources (Highlightly, SportsDataIO)         │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **External Website** includes widget script tag with `data-game-id`
2. **Widget Script** auto-initializes, creates `<bsi-live-game>` custom element
3. **Web Component** polls `/api/live/:gameId` every 15 seconds
4. **Cloudflare Worker** checks `BSI_PROD_CACHE` KV namespace
   - Cache hit: returns live data (15s cache)
   - Cache miss: returns stub data (no cache)
5. **Background Worker** (`bsi-intelligence-stream`) fetches from external APIs
6. **Background Worker** writes transformed data to KV cache
7. **Widget** receives data, updates UI with flash animation

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│  Widget (Browser)                                                   │
│  ├─ HTML Escaping (_escapeHtml)                                    │
│  ├─ Shadow DOM Isolation                                           │
│  └─ No eval() or dangerous operations                              │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Worker (Edge)                                                      │
│  ├─ Rate Limiting (120 req/min per IP)                             │
│  ├─ CORS Validation                                                │
│  ├─ Input Sanitization (c.req.param)                               │
│  └─ No sensitive data exposed                                      │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  KV Cache (Storage)                                                 │
│  ├─ TTL: 60 seconds                                                │
│  ├─ Public data only (game stats)                                  │
│  └─ Namespaced keys (live:${gameId})                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Distribution Model

```
┌─────────────────────────────────────────────────────────────────────┐
│  Fan Site A                                                         │
│  ├─ Embeds widget for Game 1                                       │
│  └─ "// BSI" link → blazesportsintel.com                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Team Page B                                                        │
│  ├─ Embeds widget for Game 2                                       │
│  └─ Upsell drawer → BSI Pro $12/mo                                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  BSI Game Page                                                      │
│  ├─ Embeds widget (product demo)                                   │
│  └─ Shows capability to visitors                                   │
└─────────────────────────────────────────────────────────────────────┘

                        ↓ All drive traffic to ↓

┌─────────────────────────────────────────────────────────────────────┐
│  blazesportsintel.com                                               │
│  ├─ Free tier users see product                                    │
│  ├─ Pro tier users get pitch data                                  │
│  └─ Conversion funnel: Embed → View → Subscribe                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Lifecycle

```
1. LOAD
   ├─ Script tag discovered by browser
   ├─ Widget script loads and executes
   ├─ Custom element defined (customElements.define)
   └─ Auto-initialization finds script tags

2. CONNECTED
   ├─ connectedCallback() triggered
   ├─ Shadow DOM created
   ├─ Styles injected
   ├─ Initial fetch
   └─ Polling starts (15s interval)

3. POLLING
   ├─ fetch('/api/live/:gameId')
   ├─ Data received and parsed
   ├─ Compare with previous data
   ├─ Update UI (flash animation if changed)
   └─ Schedule next poll

4. USER INTERACTION
   ├─ Click anywhere on card → toggle drawer
   ├─ Free tier: show upsell
   ├─ Pro tier: show pitch data
   └─ Click copy button → clipboard API

5. DISCONNECTED
   ├─ disconnectedCallback() triggered
   ├─ Polling stopped (clearInterval)
   └─ Cleanup (if reconnected, restart polling)
```

## Browser Support Matrix

```
Browser          | Version | Status | Notes
-----------------|---------|--------|------------------
Chrome           | 53+     | ✅     | Full support
Firefox          | 63+     | ✅     | Full support
Safari           | 10.1+   | ✅     | Full support
Edge             | 79+     | ✅     | Chromium-based
Chrome (mobile)  | 53+     | ✅     | Full support
Safari (mobile)  | 10.3+   | ✅     | Full support
IE 11            | N/A     | ❌     | No Web Components
```

## Performance Characteristics

```
Metric                  | Value          | Notes
------------------------|----------------|---------------------------
Initial Load            | ~8 KB gzipped  | Single script file
First Render            | <100ms         | With cached data
Skeleton Loader         | <50ms          | Instant feedback
Polling Interval        | 15 seconds     | Configurable
API Response (cached)   | ~10-20ms       | KV read
API Response (miss)     | ~50-100ms      | Stub data generation
Memory Usage            | ~2-3 MB        | Per widget instance
DOM Nodes               | ~40-60         | Shadow DOM tree
Event Listeners         | 2-3            | Click handlers
```

## Deployment Sequence

```
1. Build & Deploy Pages
   ├─ npm run build
   ├─ npm run deploy:production
   └─ widget.js available at https://blazesportsintel.com/widget.js

2. Deploy Worker
   ├─ wrangler deploy --config workers/wrangler.toml
   └─ /api/live/:gameId endpoint active

3. Verify Integration
   ├─ Check KV binding (BSI_PROD_CACHE)
   ├─ Test API endpoint (curl)
   └─ Test CORS headers

4. Test Widget
   ├─ Navigate to live game page
   ├─ Verify rendering
   ├─ Check browser console
   └─ Monitor Network tab

5. Go Live
   ├─ Monitor error logs
   ├─ Track usage metrics
   └─ Begin distribution outreach
```
