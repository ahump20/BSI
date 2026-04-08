# Build iOS Apps

Claude-native port of the OpenAI-curated `build-ios-apps` bundle.

## Coverage

- SwiftUI architecture and component patterns
- SwiftUI view-file refactors
- SwiftUI performance review and profiling intake
- Liquid Glass adoption guidance for iOS 26+
- Simulator-driven runtime debugging and UI inspection

## Included Skills

- `ios-debugger-agent`
- `swiftui-liquid-glass`
- `swiftui-performance-audit`
- `swiftui-ui-patterns`
- `swiftui-view-refactor`

## Notes

`ios-debugger-agent` assumes XcodeBuildMCP or equivalent simulator-control tooling is available in the Claude session.

`swift-lsp@claude-plugins-official` is a useful companion for Swift code intelligence, but it is optional and not a hard dependency of this plugin.

## Representative Prompts

- `Run this iOS app in the simulator and tell me why the login flow is failing.`
- `Refactor this SwiftUI view into smaller subviews without changing behavior.`
- `Audit this SwiftUI screen for performance problems and tell me what to measure in Instruments next.`
- `Adopt Liquid Glass on this tab bar and card system with a real fallback for earlier iOS versions.`
