---
name: SwiftUI UI Patterns
description: >
  SwiftUI navigation, state management, and composition patterns. Covers NavigationStack
  with NavigationPath, NavigationSplitView for iPad/Mac, sheet and modal presentation,
  state ownership (@State, @Binding, @Observable, @Environment, @AppStorage), new view
  workflow, composition patterns (ViewModifier, preference keys, EnvironmentKey), and
  anti-patterns. Triggers on: "swiftui patterns", "navigation in swiftui",
  "state management swift", "swiftui architecture", "which state wrapper",
  "navigationstack", "swiftui navigation", building any SwiftUI view.
---

# SwiftUI UI Patterns

You are a SwiftUI architecture specialist. Your job is to help users choose the right patterns for navigation, state management, and view composition. Default to modern SwiftUI APIs (iOS 17+) and call out minimum OS requirements when using newer features.

## Navigation Patterns

### NavigationStack with NavigationPath

Use `NavigationStack` for push-based navigation on iPhone. `NavigationPath` provides type-erased programmatic navigation.

```swift
struct ContentView: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            HomeView()
                .navigationDestination(for: Team.self) { team in
                    TeamDetailView(team: team)
                }
                .navigationDestination(for: Player.self) { player in
                    PlayerDetailView(player: player)
                }
        }
    }
}
```

**When to use NavigationStack:**
- Linear drill-down navigation (list to detail)
- iPhone-primary interfaces
- Any push/pop navigation flow

**Programmatic navigation:** Push by appending to the path:
```swift
path.append(selectedTeam)
```

Pop to root by resetting:
```swift
path = NavigationPath()
```

Pop one level:
```swift
path.removeLast()
```

**Per-tab navigation:** Each tab should own its own `NavigationStack` with its own path. Do not share a single navigation stack across tabs --- it creates confusing back-stack behavior.

```swift
TabView {
    Tab("Scores", systemImage: "sportscourt") {
        NavigationStack(path: $scoresPath) {
            ScoresView()
        }
    }
    Tab("Teams", systemImage: "person.3") {
        NavigationStack(path: $teamsPath) {
            TeamsView()
        }
    }
}
```

### NavigationSplitView for iPad and Mac

Use `NavigationSplitView` for multi-column layouts on iPad and Mac. It provides sidebar, content, and detail columns.

```swift
NavigationSplitView {
    SidebarView(selection: $selectedCategory)
} content: {
    ContentListView(category: selectedCategory, selection: $selectedItem)
} detail: {
    if let item = selectedItem {
        DetailView(item: item)
    } else {
        ContentUnavailableView("Select an item", systemImage: "doc")
    }
}
```

**When to use NavigationSplitView:**
- iPad apps with sidebar navigation
- Mac Catalyst or native macOS apps
- Any interface that benefits from persistent sidebar + detail

**Column visibility:** Control which columns are visible:
```swift
@State private var columnVisibility: NavigationSplitViewVisibility = .all

NavigationSplitView(columnVisibility: $columnVisibility) { ... }
```

On iPhone, `NavigationSplitView` automatically collapses to a single-column push navigation.

### Sheet and Modal Presentation

Use `.sheet` for modal content that overlays the current screen. Use `.fullScreenCover` for content that replaces the screen entirely.

```swift
// Prefer item-based sheets when state represents a selected model
@State private var selectedPlayer: Player?

.sheet(item: $selectedPlayer) { player in
    PlayerQuickView(player: player)
}
```

**Prefer `.sheet(item:)` over `.sheet(isPresented:)`.** When the sheet is driven by a model object, `item:` binds selection and presentation in a single state variable. `isPresented:` requires a separate boolean plus a way to pass the data, which is error-prone.

**Sheet dismissal:** Sheets should own their dismiss action internally. Use `@Environment(\.dismiss)` inside the sheet, not an `onDismiss` closure from the parent.

```swift
struct PlayerQuickView: View {
    let player: Player
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            PlayerContent(player: player)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Done") { dismiss() }
                    }
                }
        }
    }
}
```

**When to use each:**
- `.sheet` --- supplementary content that does not replace the primary flow (detail view, editor, settings)
- `.fullScreenCover` --- immersive content that replaces context (onboarding, media player, camera)
- `.popover` --- small contextual content on iPad (automatically becomes a sheet on iPhone)

### Enum-Driven Presentation

For screens with multiple possible sheets or alerts, use an enum to avoid scattered boolean flags:

```swift
enum ActiveSheet: Identifiable {
    case playerDetail(Player)
    case settings
    case shareSheet(URL)

    var id: String {
        switch self {
        case .playerDetail(let p): return "player-\(p.id)"
        case .settings: return "settings"
        case .shareSheet: return "share"
        }
    }
}

@State private var activeSheet: ActiveSheet?

.sheet(item: $activeSheet) { sheet in
    switch sheet {
    case .playerDetail(let player):
        PlayerDetailView(player: player)
    case .settings:
        SettingsView()
    case .shareSheet(let url):
        ShareView(url: url)
    }
}
```

This eliminates the anti-pattern of multiple `@State var showX = false` booleans that can conflict with each other.

## State Ownership Table

Choose the narrowest state tool that matches the ownership model. Define ownership first, then pick the wrapper.

| Scenario | Wrapper | Notes |
|----------|---------|-------|
| View-private value state (toggle, text field, selection) | `@State` | Single source of truth. Only the owning view can write. |
| Child reads/writes parent-owned value | `@Binding` | Parent passes `$property`. Child does not own the state. |
| Reference-type model owned by the view (iOS 17+) | `@State` with `@Observable` class | The view creates and owns the model instance. |
| Reference-type model injected from parent (iOS 17+) | Plain stored property | Pass the `@Observable` instance as a regular init parameter. No wrapper needed. |
| App-wide shared dependency | `@Environment(SomeType.self)` | For services, settings, or configuration shared across the app. |
| UserDefaults-backed persistence | `@AppStorage("key")` | Reads/writes UserDefaults. Use for user preferences. |
| Scene-level storage (state restoration) | `@SceneStorage("key")` | Persists across scene sessions. Limited to codable values. |
| Legacy reference model (iOS 16 and earlier) | `@StateObject` at root, `@ObservedObject` when injected | Use only when deployment target requires pre-Observation support. |

### Common Ownership Mistakes

- **Using `@ObservedObject` for owned state.** If the view creates the model, it must use `@StateObject` (legacy) or `@State` (modern). `@ObservedObject` does not own the instance --- the model will be destroyed and recreated on parent re-evaluation.
- **Using `@Environment` for everything.** Environment is for app-wide dependencies (auth service, theme, network client). Feature-local models should be passed via init parameters, not environment.
- **Creating `@State` for derived values.** If a value can be computed from other state, compute it. Do not duplicate it into separate `@State`. Derived state creates synchronization bugs.

## New View Workflow

Follow this sequence when building a new SwiftUI view:

1. **Start with data requirements.** Before writing any UI code, answer: What data does this view display? Where does it come from? How often does it change? What user interactions modify it?

2. **Choose state ownership.** For each piece of data:
   - View creates and owns it? `@State`
   - Parent owns it, child reads/writes? `@Binding`
   - Shared across the app? `@Environment`
   - Persisted in UserDefaults? `@AppStorage`

3. **Build the view hierarchy.** Start with the layout structure (stacks, lists, grids). Get the structure compiling before adding styling.

4. **Extract subviews.** Any section longer than ~30 lines or any repeated pattern should be an extracted `View` struct. Pass data via init parameters --- keep inputs explicit and minimal.

5. **Add async loading.** Use `.task` for initial data fetching:
   ```swift
   .task {
       await loadData()
   }
   ```
   Use `.task(id:)` when the fetch depends on changing input:
   ```swift
   .task(id: selectedCategory) {
       await loadItems(for: selectedCategory)
   }
   ```
   Always handle loading and error states explicitly.

6. **Add previews.** Create previews for the primary state and at least one secondary state (empty, error, loading). Previews are your fastest feedback loop.

## Composition Patterns

### ViewModifier for Reusable Styling

When a combination of modifiers appears in multiple places, extract a `ViewModifier`:

```swift
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
            .shadow(radius: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}
```

Use `ViewModifier` when the styling is stateless or takes simple parameters. Do not use `ViewModifier` for complex logic --- that should be an extracted view.

### Preference Keys for Child-to-Parent Communication

When a child view needs to communicate a value to an ancestor (like a child reporting its size to a parent), use preference keys:

```swift
struct SizePreferenceKey: PreferenceKey {
    static var defaultValue: CGSize = .zero
    static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
        value = nextValue()
    }
}

// Child reports its size
childView
    .background(GeometryReader { geo in
        Color.clear.preference(key: SizePreferenceKey.self, value: geo.size)
    })

// Parent reads it
.onPreferenceChange(SizePreferenceKey.self) { size in
    childSize = size
}
```

Preference keys flow up the view tree. Use them sparingly --- they add complexity and can cause layout feedback loops if the parent changes layout based on the preference, which changes the child's size, which changes the preference.

### EnvironmentKey for Custom Environment Values

When multiple views across the hierarchy need access to the same value, create a custom environment key:

```swift
private struct ThemeKey: EnvironmentKey {
    static let defaultValue = Theme.default
}

extension EnvironmentValues {
    var theme: Theme {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}

// Set at the root
ContentView()
    .environment(\.theme, userTheme)

// Read anywhere
@Environment(\.theme) private var theme
```

Use custom environment keys for:
- App-wide configuration (theme, locale, feature flags)
- Services that many views need (analytics, network client)
- Values that change based on context (compact vs. regular size class already uses this pattern)

## Component Selection Guide

| Need | Use | Avoid |
|------|-----|-------|
| Scrollable list of homogeneous items | `List` | `ScrollView` + `VStack` (loses lazy loading) |
| Scrollable content with heterogeneous items | `ScrollView` + `LazyVStack` | `List` (designed for homogeneous rows) |
| Fixed small set of views | `VStack` / `HStack` | `LazyVStack` (lazy loading overhead not needed for <20 items) |
| Grid of items | `LazyVGrid` / `LazyHGrid` | Nested `HStack` in `LazyVStack` (breaks accessibility and layout) |
| Overlay content on top of another view | `.overlay` modifier | `ZStack` (unless both views need independent sizing) |
| Group views without layout | `Group` | `VStack` (adds unnecessary layout) |
| Conditional content in ViewBuilder | `@ViewBuilder` | `AnyView` (erases type identity) |

## Anti-Patterns

Catch and refactor these:

1. **God views.** A single view file with 500+ lines mixing layout, business logic, networking, and formatting. Extract subviews, move logic to models/services, keep the view focused on layout and presentation.

2. **Multiple boolean flags for mutually exclusive states.** Using `@State var showSettings = false` and `@State var showProfile = false` when only one can be active at a time. Use an enum-based `activeSheet` pattern instead.

3. **`AnyView` type erasure.** `AnyView` forces SwiftUI to diff by value instead of structure, which is slower and loses structural identity. Use `@ViewBuilder`, `Group`, or generic constraints instead.

4. **Service calls in body.** Network requests, database queries, or other side effects should never execute as a consequence of `body` evaluation. Use `.task`, `.onAppear`, or explicit user-triggered actions.

5. **`@ObservedObject` for owned state.** If the view creates the model instance, it must use `@StateObject` (legacy) or `@State` (modern). `@ObservedObject` does not manage the lifecycle --- the model gets recreated on parent re-evaluation.

6. **Force unwrapping in views.** `model.name!` in a view body will crash the app. Use optional binding, nil coalescing, or ensure non-optional inputs via the view's init contract.

7. **Global router or coordinator singleton.** Passing all navigation through a global object couples every view to the router. Use SwiftUI's built-in navigation (NavigationStack, NavigationPath, .sheet) with local state management instead.

## Cross-Cutting References

- Navigation ownership and per-tab history: `references/navigationstack.md`
- Centralized modal presentation: `references/sheets.md`
- URL handling and deep linking: `references/deeplinks.md`
- Root dependency graph and app shell wiring: `references/app-wiring.md`
- Async state, cancellation, and debouncing: `references/async-state.md`
- Preview setup and fixtures: `references/previews.md`
- Performance guardrails: `references/performance.md`
- Component index: `references/components-index.md`
