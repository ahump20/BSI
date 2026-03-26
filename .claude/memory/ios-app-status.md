# BSI iOS App — Project Status

## Location
- Mobile app: /Users/AustinHumphrey/blazesportsintel-mobile/
- Consolidated build prompt: ~/Downloads/bsi-ios-one-shot-build-prompt-v2.md
- Architecture plan: generated in Cowork task (BSI iOS app architecture plan)

## Stack Decision
- Expo (React Native) with SDK 53+, Router v3, iOS only
- Capacitor rejected (Apple Guideline 4.2 rejects web wrappers)
- SwiftUI deferred (too much new ecosystem for solo dev at this stage)

## Build Status (March 24, 2026)
- Phase 1 (Scaffold): committed — Expo Router v3, Heritage Design System, API client, types
- Phase 2 (Live Scores): committed — 5 sport endpoints, ScoreCard, FilterPills, haptics
- Phase 3 (Articles + Offline): committed — SQLite caching, native rendering, share sheet
- Phase 4A (Push Worker): committed — bsi-push-notifications Worker in bsi-repo
- Phase 4B (Mobile Push): committed — registration, foreground display, deep linking
- Phase 5 (Game Detail + Profile + Polish): committed
- Verification: needs iOS Simulator run to confirm rendered output

## Key Dependencies
- expo-font for Heritage fonts (Oswald, Cormorant Garamond, IBM Plex Mono, Bebas Neue)
- TanStack Query for data fetching with 30s refetch on scores
- Zustand + AsyncStorage for state persistence
- expo-sqlite for offline article caching
- expo-notifications + Expo Push API for push (no Firebase)

## Next Steps
- Run `npx expo start --ios` and verify all 4 tabs render with real data
- PostHog integration (Phase 4C in v2 prompt)
- TestFlight beta → App Store submission
- Target: College World Series June 2026 for launch timing
