# BSI iOS App — Architecture & Implementation Plan

**Date:** 2026-03-24
**Status:** Planning
**Owner:** Austin Humphrey

---

## Why

BSI's web platform is mobile-first by design — 375px baseline breakpoint, 44px touch targets, standalone PWA manifest — but a native iOS app unlocks capabilities the browser cannot provide: push notifications for live score alerts, background refresh, Spotlight search integration, Live Activities on the Lock Screen during games, and the distribution mechanics of the App Store itself. The existing Cloudflare Workers API surface (100+ endpoints) is client-agnostic and ready for native consumption today. The iOS app does not require new backend infrastructure — it requires a native shell that consumes what already exists and extends it with platform-specific features.

---

## Strategy Decision: Native SwiftUI

Three paths were evaluated:

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Capacitor / PWA wrapper** | Minimal new code, reuses entire React codebase | No real push notifications, no Live Activities, App Store reviewers reject thin wrappers, no background refresh | ❌ Rejected |
| **React Native / Expo** | Shares TypeScript skill, large ecosystem | Two runtimes to debug, bridge overhead for real-time scores, limited SwiftUI interop for Lock Screen widgets, extra dependency chain | ❌ Rejected |
| **Native SwiftUI** | Full platform access (Live Activities, WidgetKit, Spotlight, APNs), best performance for real-time score updates, App Store review confidence, smallest runtime footprint | New language (Swift), no code sharing with web | ✅ Selected |

**Rationale:** BSI's differentiator is live scores and deep analytics for underserved sports markets. The features that make a native app worth building — Lock Screen Live Activities showing a game in progress, push alerts when a ranked team loses, background score polling, Siri Shortcuts for "show me college baseball scores" — are all SwiftUI/platform-native capabilities. A wrapper app adds the App Store icon but none of the value. The API layer is already built; the investment is in the native shell, not the data pipeline.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    iOS App (SwiftUI)                      │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Scores  │  │  Teams   │  │ Players  │  │  Intel   │ │
│  │  Tab    │  │   Tab    │  │   Tab    │  │   Tab    │ │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │            │             │              │        │
│  ┌────▼────────────▼─────────────▼──────────────▼────┐  │
│  │              BSINetworkClient                      │  │
│  │  (async/await, Codable, URLSession)               │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │              BSICacheLayer                         │  │
│  │  (SwiftData local persistence + in-memory cache)  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Live Activities │  │  WidgetKit  │  │   APNs     │ │
│  │  (Lock Screen)   │  │  (Widgets)  │  │  (Push)    │ │
│  └──────────────────┘  └─────────────┘  └────────────┘ │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  blazesportsintel.com    │
              │  Cloudflare Workers API  │
              │  (existing, unchanged)   │
              └──────────────────────────┘
```

The iOS app is a pure consumer of the existing Workers API. No new backend endpoints are required for the MVP. Push notifications will require a small notification-dispatch Worker added later (Phase 2).

---

## Project Structure

```
BSI-iOS/                          # Separate repo: ahump20/BSI-iOS
├── BSI.xcodeproj
├── BSI/
│   ├── App/
│   │   ├── BSIApp.swift          # @main entry, tab navigation
│   │   ├── AppDelegate.swift     # APNs registration, background tasks
│   │   └── Environment.swift     # API base URL, feature flags
│   │
│   ├── Models/                   # Codable structs mirroring API responses
│   │   ├── Game.swift
│   │   ├── Team.swift
│   │   ├── Player.swift
│   │   ├── Standing.swift
│   │   ├── Ranking.swift
│   │   ├── NewsArticle.swift
│   │   ├── SabermetricsData.swift
│   │   └── APIMeta.swift         # { source, fetched_at, timezone }
│   │
│   ├── Network/
│   │   ├── BSIClient.swift       # URLSession wrapper, auth header injection
│   │   ├── Endpoints.swift       # Type-safe endpoint definitions
│   │   ├── APIError.swift        # Error types matching Worker responses
│   │   └── WebSocketManager.swift # wss://blazesportsintel.com/ws
│   │
│   ├── Cache/
│   │   ├── CachePolicy.swift     # TTL rules matching Worker cache strategy
│   │   └── SwiftDataStore.swift  # Local persistence for offline access
│   │
│   ├── Features/
│   │   ├── Scores/               # Live scores tab
│   │   │   ├── ScoresView.swift
│   │   │   ├── ScoreCard.swift
│   │   │   ├── GameDetailView.swift
│   │   │   └── ScoresViewModel.swift
│   │   │
│   │   ├── CollegeBaseball/      # Flagship section
│   │   │   ├── StandingsView.swift
│   │   │   ├── RankingsView.swift
│   │   │   ├── TeamDetailView.swift
│   │   │   ├── PlayerProfileView.swift
│   │   │   ├── SabermetricsView.swift
│   │   │   └── TransferPortalView.swift
│   │   │
│   │   ├── MLB/
│   │   ├── NFL/
│   │   ├── NBA/
│   │   ├── CFB/
│   │   │
│   │   ├── Intel/                # AI-powered insights
│   │   │   ├── DailyDigestView.swift
│   │   │   └── GameAnalysisView.swift
│   │   │
│   │   └── Settings/
│   │       ├── SettingsView.swift
│   │       ├── SubscriptionView.swift  # Stripe → StoreKit bridge
│   │       └── NotificationPrefs.swift
│   │
│   ├── DesignSystem/             # Heritage v2.1 in SwiftUI
│   │   ├── HeritageColors.swift
│   │   ├── HeritageTypography.swift
│   │   ├── HeritageCard.swift
│   │   ├── HeritageButton.swift
│   │   ├── HeritageStamp.swift
│   │   └── CornerMarks.swift
│   │
│   ├── Widgets/                  # WidgetKit extension target
│   │   ├── ScoreWidget.swift     # Home screen score widget
│   │   └── StandingsWidget.swift
│   │
│   ├── LiveActivity/             # ActivityKit for Lock Screen
│   │   ├── GameLiveActivity.swift
│   │   └── GameActivityAttributes.swift
│   │
│   └── Resources/
│       ├── Assets.xcassets        # App icon, colors, images
│       ├── Localizable.strings
│       └── Info.plist
│
├── BSITests/                     # XCTest unit tests
├── BSIUITests/                   # XCUITest UI tests
└── fastlane/                     # Automated builds and App Store submission
    ├── Fastfile
    ├── Appfile
    └── Matchfile
```

**Repo strategy:** Separate repository (`ahump20/BSI-iOS`), not a subdirectory of the main BSI repo. The web and iOS codebases share no source files — they share the API contract. Keeping them separate avoids polluting the Next.js project with Xcode build artifacts and vice versa.

---

## Heritage v2.1 → SwiftUI Design Token Mapping

The Heritage design system translates directly to SwiftUI. Dark-only, no light mode variant needed.

### Colors

```swift
// HeritageColors.swift
import SwiftUI

extension Color {
    // Surfaces
    static let surfaceDugout    = Color(hex: "#161616")  // Cards
    static let surfaceScoreboard = Color(hex: "#0A0A0A") // Primary background
    static let surfacePressBox  = Color(hex: "#111111")  // Table headers

    // Brand
    static let bsiPrimary       = Color(hex: "#BF5700")  // Burnt orange
    static let bsiBone          = Color(hex: "#F5F2EB")  // Primary text
    static let bsiDust          = Color(hex: "#C4B8A5")  // Secondary text

    // Heritage accents
    static let columbiaBlue     = Color(hex: "#4B9CD3")  // Data links
    static let borderVintage    = Color(hex: "#8C6239").opacity(0.3) // Borders

    // Semantic
    static let success          = Color(hex: "#22C55E")
    static let warning          = Color(hex: "#F59E0B")
    static let error            = Color(hex: "#EF4444")
}
```

### Typography

```swift
// HeritageTypography.swift
import SwiftUI

extension Font {
    // Hero headings — Bebas Neue equivalent
    // Register custom fonts via Info.plist, fall back to system condensed
    static let heroHeadline     = Font.custom("BebasNeue-Regular", size: 40)
    static let sectionHeadline  = Font.custom("Oswald-Medium", size: 20)
    // Apply .textCase(.uppercase) as a view modifier, not on the Font
    static let bodySerif        = Font.custom("CormorantGaramond-Regular", size: 16)
    static let dataMono         = Font.custom("IBMPlexMono-Regular", size: 13)
    static let codeMono         = Font.custom("JetBrainsMono-Regular", size: 13)

    // Fallback to system fonts when custom fonts unavailable
    static let heroFallback     = Font.system(size: 40, weight: .bold, design: .default)
    static let sectionFallback  = Font.system(size: 20, weight: .semibold, design: .default)
    static let bodyFallback     = Font.system(size: 16, weight: .regular, design: .serif)
    static let dataFallback     = Font.system(size: 13, weight: .regular, design: .monospaced)
}
```

### Component Mapping

| Web (Tailwind/CSS) | iOS (SwiftUI) |
|---------------------|----------------|
| `.heritage-card` | `HeritageCard` view modifier (surfaceDugout bg, 2px radius, vintage border) |
| `.heritage-stamp` | `HeritageStamp` label (Oswald, burnt-orange, uppercase) |
| `.btn-heritage` | `HeritageButton` style (burnt-orange border, 44px min height) |
| `.btn-heritage-fill` | `HeritageButtonFill` style (burnt-orange background) |
| `.corner-marks` | `CornerMarks` overlay (20px inset decorative lines) |
| `.grain-overlay` | Not ported — grain texture adds visual noise on small screens |
| Score ticker (CSS marquee) | `ScrollView(.horizontal)` with timer-driven offset |

### Spacing & Layout

```swift
// Heritage spacing scale (matches Tailwind config)
enum HeritageSpacing {
    static let xs:  CGFloat = 4
    static let sm:  CGFloat = 8
    static let md:  CGFloat = 16
    static let lg:  CGFloat = 24
    static let xl:  CGFloat = 32
    static let xxl: CGFloat = 48
}

// Border radius — 2px max (Heritage requirement)
// Usage: .clipShape(RoundedRectangle(cornerRadius: HeritageSpacing.cornerRadius))
extension HeritageSpacing {
    static let cornerRadius: CGFloat = 2
}
```

---

## API Integration Plan

### Network Client

```swift
// BSIClient.swift — sketch
actor BSIClient {
    static let shared = BSIClient()
    private let baseURL = URL(string: "https://blazesportsintel.com")!
    private let session: URLSession
    private let decoder: JSONDecoder

    // Auth header injection (API key stored in iOS Keychain via Security framework)
    // KeychainHelper wraps SecItemCopyMatching / SecItemAdd / SecItemDelete
    // for reading and writing the BSI API key securely.
    private var apiKey: String? {
        KeychainHelper.read(key: "bsi-api-key")
    }

    func fetch<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T> {
        var request = URLRequest(url: baseURL.appending(path: endpoint.path))
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let key = apiKey {
            request.setValue(key, forHTTPHeaderField: "X-BSI-Key")
        }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard http.statusCode == 200 else {
            throw APIError.httpError(http.statusCode)
        }
        return try decoder.decode(APIResponse<T>.self, from: data)
    }
}
```

### Endpoint Definitions (MVP)

These map directly to the existing Workers API. No new backend routes needed.

```swift
enum Endpoint {
    // Scores (all sports)
    case scores(Sport)                          // GET /api/{sport}/scores
    case gameDetail(Sport, gameId: String)       // GET /api/{sport}/game/{gameId}

    // College Baseball (flagship)
    case cbbStandings                            // GET /api/college-baseball/standings
    case cbbRankings                             // GET /api/college-baseball/rankings
    case cbbTeam(teamId: String)                 // GET /api/college-baseball/teams/{teamId}
    case cbbPlayer(playerId: String)             // GET /api/college-baseball/players/{playerId}
    case cbbLeaders                              // GET /api/college-baseball/leaders
    case cbbTransferPortal                       // GET /api/college-baseball/transfer-portal
    case cbbNews                                 // GET /api/college-baseball/news
    case cbbDaily                                // GET /api/college-baseball/daily

    // MLB
    case mlbStandings                            // GET /api/mlb/standings
    case mlbTeam(teamId: String)                 // GET /api/mlb/teams/{teamId}
    case mlbNews                                 // GET /api/mlb/news

    // NFL
    case nflStandings                            // GET /api/nfl/standings
    case nflScores                               // GET /api/nfl/scores
    case nflNews                                 // GET /api/nfl/news

    // NBA
    case nbaStandings                            // GET /api/nba/standings
    case nbaScores                               // GET /api/nba/scores
    case nbaNews                                 // GET /api/nba/news

    // Analytics
    case savantBatting                           // GET /api/savant/batting/leaderboard
    case savantPitching                          // GET /api/savant/pitching/leaderboard
    case savantPlayer(id: String)                // GET /api/savant/player/{id}

    // Search
    case search(query: String)                   // GET /api/search?q={query}

    // Auth
    case validateKey                             // GET /api/auth/validate

    var path: String { /* maps each case to URL path */ }
}
```

### WebSocket (Real-Time Scores)

```swift
// WebSocketManager.swift — sketch
class WebSocketManager: ObservableObject {
    @Published var isConnected = false
    private var task: URLSessionWebSocketTask?

    func connect() {
        let url = URL(string: "wss://blazesportsintel.com/ws")!
        task = URLSession.shared.webSocketTask(with: url)
        task?.resume()
        isConnected = true
        receiveMessages()
    }

    private func receiveMessages() {
        task?.receive { [weak self] result in
            switch result {
            case .success(.string(let text)):
                // Parse score update JSON, post to @Published properties
                self?.handleMessage(text)
            case .failure(let error):
                self?.isConnected = false
                // Reconnect with backoff
            default: break
            }
            self?.receiveMessages() // Continue listening
        }
    }
}
```

### Cache TTL Policy (Mirrors Worker KV TTL)

```swift
enum CacheTTL {
    static let liveScores: TimeInterval    = 30    // 30 seconds
    static let standings: TimeInterval     = 60    // 1 minute
    static let finalGames: TimeInterval    = 300   // 5 minutes
    static let teams: TimeInterval         = 600   // 10 minutes
    static let rosters: TimeInterval       = 3600  // 1 hour
    static let schedule: TimeInterval      = 3600  // 1 hour
}
```

---

## Feature Phases

### Phase 1 — MVP (App Store Submission Target)

The minimum viable app that provides genuine value beyond the mobile web experience.

| Feature | Screens | API Endpoints |
|---------|---------|---------------|
| **Live Scores** (all sports) | Score list → game detail | `/api/{sport}/scores`, `/api/{sport}/game/:id` |
| **College Baseball Hub** | Standings, rankings, team detail, player profile | `/api/college-baseball/standings`, `/rankings`, `/teams/:id`, `/players/:id` |
| **MLB Hub** | Standings, scores, team detail | `/api/mlb/standings`, `/scores`, `/teams/:id` |
| **NFL Hub** | Standings, scores | `/api/nfl/standings`, `/scores` |
| **NBA Hub** | Standings, scores | `/api/nba/standings`, `/scores` |
| **News Feed** | Sport-filtered news list | `/api/{sport}/news` |
| **Search** | Universal search | `/api/search` |
| **Settings** | Theme, notifications, account | Local |

**Tab bar:** Scores · Baseball · Sports · Intel · More

**Deployment target:** iOS 17.0+ (ensures SwiftData, Live Activity, WidgetKit availability)

**Estimated scope:** ~40 screens, ~25 API endpoint integrations

### Phase 2 — Platform Features

Features that differentiate the native app from the mobile web.

| Feature | Platform API | Backend Addition |
|---------|-------------|------------------|
| **Push Notifications** | APNs + Notification Service Extension | New Worker: `bsi-push-dispatch` (sends APNs via Cloudflare Worker) |
| **Live Activities** | ActivityKit | Update via push token (requires APNs integration) |
| **Home Screen Widgets** | WidgetKit | Timeline provider polling `/api/{sport}/scores` |
| **Spotlight Search** | CoreSpotlight | Index teams and players locally |
| **Siri Shortcuts** | App Intents | "Show me college baseball scores" |
| **Background Refresh** | BGTaskScheduler | Periodic score polling for widget + notification freshness |
| **Offline Mode** | SwiftData | Persist last-fetched standings, rosters, schedules |

### Phase 3 — Premium & Advanced

| Feature | Description |
|---------|-------------|
| **Sabermetrics Dashboard** | Full savant-style player pages with interactive charts (Swift Charts) |
| **Transfer Portal Tracker** | Real-time portal movement alerts |
| **AI Game Analysis** | Display Intel game briefs and scouting reports |
| **Diamond Dynasty (MLB The Show)** | Card market and team builder |
| **Pitch Analysis (Vision)** | Camera integration with MediaPipe → on-device pitch tracking |
| **StoreKit Subscriptions** | Native in-app purchase for BSI Pro (parallel to Stripe web) |

---

## Push Notification Architecture (Phase 2)

The existing backend has no APNs integration. A new lightweight Worker handles dispatch.

```
┌─────────────┐    score change    ┌───────────────────┐
│ bsi-live-    │ ──────────────▶  │ bsi-push-dispatch  │
│ scores       │   (KV trigger     │ (new Worker)       │
│ (existing)   │    or webhook)    │                    │
└─────────────┘                    │ 1. Read subscriber │
                                   │    prefs from KV   │
                                   │ 2. Build payload   │
                                   │ 3. Send via APNs   │
                                   │    HTTP/2 API      │
                                   └─────────┬─────────┘
                                             │
                                             ▼
                                   ┌───────────────────┐
                                   │ Apple Push         │
                                   │ Notification       │
                                   │ Service (APNs)     │
                                   └─────────┬─────────┘
                                             │
                                             ▼
                                   ┌───────────────────┐
                                   │ iOS Device         │
                                   │ Notification +     │
                                   │ Live Activity      │
                                   └───────────────────┘
```

**Notification types:**
- Score alert: "{Away} {score} - {Home} {score} (Final)" for followed teams
- Upset alert: "Ranked #{rank} {team} trails unranked {opponent} in the 7th"
- Transfer portal: "{player} has entered the transfer portal from {school}"
- Daily digest: "Your morning college baseball briefing is ready"

**APNs from Cloudflare Worker:** Use the HTTP/2 APNs API directly from a Worker (no Firebase dependency). Authentication via APNs auth key (.p8 file stored as Worker secret).

---

## CORS Configuration Update

The existing CORS allowlist in `workers/shared/cors.ts` needs one addition for iOS development:

```typescript
// No CORS change needed for production iOS app — native URLSession
// does not send Origin headers, so CORS does not apply.
//
// For development with Xcode previews / simulators, the existing
// localhost:3000 allowance covers local proxy setups.
```

Native iOS apps making direct `URLSession` requests do not trigger CORS. The existing API works as-is for native clients. The `X-BSI-Key` header is already in the CORS allowed headers list, which matters only for web clients.

---

## Authentication: Stripe ↔ StoreKit Bridge

BSI currently uses Stripe-keyed auth: pay via Stripe → receive API key via email → store in localStorage → send as `X-BSI-Key` header.

For iOS, two auth paths:

### Path A: Preserve Stripe Flow (MVP)
1. User taps "Subscribe" in iOS app
2. App opens `SFSafariViewController` to `blazesportsintel.com/pricing/`
3. User completes Stripe checkout on web
4. Webhook provisions key, sends via email
5. User pastes or deep-links API key back into the app
6. App stores key in iOS Keychain
7. All API requests include `X-BSI-Key`

### Path B: Native StoreKit (Phase 3)
1. User subscribes via StoreKit 2 in-app purchase
2. App sends App Store receipt to new Worker endpoint: `POST /api/auth/apple-verify`
3. Worker validates receipt with App Store Server API
4. Worker provisions BSI key in KV (same as Stripe flow)
5. Worker returns key to app
6. App stores in Keychain, uses `X-BSI-Key` going forward

Path A ships faster. Path B is the long-term solution but requires Apple Developer Program enrollment, StoreKit configuration, and a new Worker endpoint.

---

## App Store Submission Checklist

### Apple Developer Program
- [ ] Enroll in Apple Developer Program ($99/year) at developer.apple.com
- [ ] Create App ID with capabilities: Push Notifications, App Groups (for widgets), Associated Domains

### App Store Connect
- [ ] Create app listing: "Blaze Sports Intel" (short: "BSI")
- [ ] Category: Sports
- [ ] Subcategory: —
- [ ] Age rating: 4+ (no objectionable content)
- [ ] Price: Free (with in-app purchases planned for Phase 3)

### Required Assets
- [ ] App icon: 1024×1024 (use BSI brand burnt-orange shield)
- [ ] Screenshots: 6.7" (iPhone 16 Pro Max), 6.1" (iPhone 16), 5.5" (iPhone 8 Plus if supporting)
- [ ] Preview video (optional but recommended): 15–30s showing live scores, team drill-down
- [ ] Privacy policy URL: `https://blazesportsintel.com/privacy/`
- [ ] Terms of use URL: `https://blazesportsintel.com/terms/`
- [ ] Support URL: `https://blazesportsintel.com/contact/`

### Privacy & Data Collection (App Privacy Labels)
- [ ] Data collected: Email (if subscribing), usage analytics (PostHog)
- [ ] Data not linked to identity: Crash logs, performance data
- [ ] Data used for tracking: None (no third-party ad tracking)
- [ ] Privacy Nutrition Label must be accurate before submission

### Review Guidelines Compliance
- [ ] App provides genuine native value beyond the website (Live Activities, widgets, push)
- [ ] No thin wrapper — custom SwiftUI views, not just a WKWebView
- [ ] In-app purchase for premium features uses StoreKit (Phase 3) OR clearly offers value at free tier
- [ ] All external links open in SFSafariViewController or ASWebAuthenticationSession
- [ ] Network error handling with offline fallback messaging

### Code Signing & Distribution
- [ ] Fastlane Match for certificate management (shared via private repo or cloud storage)
- [ ] Automatic signing in Xcode for development
- [ ] Manual/Match signing for distribution
- [ ] TestFlight beta distribution before App Store release

---

## CI/CD Pipeline

```
┌──────────┐    push     ┌────────────────┐    merge    ┌───────────────┐
│ Feature   │ ─────────▶ │ GitHub Actions  │ ─────────▶ │ TestFlight    │
│ Branch    │            │                │             │ (auto deploy) │
└──────────┘            │ 1. swift build  │             └───────┬───────┘
                         │ 2. swift test   │                     │
                         │ 3. swiftlint    │                   manual
                         │ 4. fastlane     │                  promote
                         │    build        │                     │
                         └────────────────┘                     ▼
                                                        ┌───────────────┐
                                                        │ App Store     │
                                                        │ (production)  │
                                                        └───────────────┘
```

**GitHub Actions workflow:**
1. On push to any branch: `swift build`, `swift test`, `swiftlint`
2. On merge to `main`: Fastlane builds, signs, and uploads to TestFlight
3. Manual promotion from TestFlight to App Store via App Store Connect

---

## Development Environment Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| Xcode | 16.0+ | IDE, simulator, Interface Builder |
| Swift | 6.0+ | Language |
| iOS SDK | 17.0+ | Deployment target |
| Fastlane | Latest | Build automation, TestFlight uploads |
| SwiftLint | Latest | Code style enforcement |
| macOS | Sequoia 15+ | Required for Xcode 16 |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| App Store rejection for "thin wrapper" | Medium | High | Build genuine native features (Live Activities, widgets, push) from day one |
| Swift learning curve | Medium | Medium | Start with standard SwiftUI patterns; BSI API is simple REST |
| API rate limiting from mobile clients | Low | Medium | Existing 120 req/min limit is generous; cache aggressively on device |
| Stripe ↔ StoreKit payment complexity | High | Medium | Ship MVP with Stripe web flow; StoreKit comes in Phase 3 |
| Maintaining two codebases (web + iOS) | Medium | Medium | iOS app consumes API, doesn't duplicate logic; design tokens shared via spec doc |
| APNs certificate management | Low | Low | Fastlane Match + token-based auth (.p8 key, no expiring certificates) |

---

## Timeline Estimate

| Phase | Duration | Milestone |
|-------|----------|-----------|
| **Setup** | 1 week | Xcode project, CI/CD, design system tokens, network client |
| **Phase 1 MVP** | 6–8 weeks | Scores, college baseball hub, MLB/NFL/NBA basics, search, settings |
| **TestFlight Beta** | 1–2 weeks | Internal testing, crash fixes, performance tuning |
| **App Store Submission** | 1 week | Screenshots, metadata, review submission |
| **Phase 2** | 4–6 weeks | Push notifications, Live Activities, widgets, Spotlight |
| **Phase 3** | 4–6 weeks | StoreKit subscriptions, sabermetrics dashboard, AI intel |

**Total to App Store:** ~10–12 weeks from project start to first public release.

---

## Open Questions

1. **Apple Developer Program enrollment** — Is the $99/year Apple Developer account already active, or does this need to be set up?
2. **Push notification priority** — Should push be in MVP (delays launch by 2–3 weeks) or Phase 2?
3. **iPad support** — Target iPhone-only for MVP, or include iPad from the start? (iPad adds layout complexity but SwiftUI adapts reasonably well.)
4. **watchOS** — A complication showing live scores would be compelling. Defer to Phase 3?
5. **Monetization** — Free with premium features via StoreKit, or free app with web-based Stripe subscription? Apple takes 30% of StoreKit revenue.
6. **Analytics** — Continue with PostHog on iOS (PostHog has a Swift SDK), or use a native solution?
7. **Repo location** — Confirm `ahump20/BSI-iOS` as the separate repo, or prefer a monorepo approach with the iOS project in `ios/` subdirectory?

---

## Next Steps

1. **Decide on open questions above** — particularly Apple Developer enrollment and push priority
2. **Create the `BSI-iOS` repository** with Xcode project scaffold
3. **Implement Heritage design system** in SwiftUI (colors, typography, card/button components)
4. **Build BSIClient** network layer against existing production API
5. **Implement Scores tab** as the first feature — it touches every sport and validates the full data pipeline
6. **Set up Fastlane + GitHub Actions** for automated TestFlight builds
7. **Submit to TestFlight** for internal beta testing
