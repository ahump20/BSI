---
name: SwiftUI View Refactor
description: >
  SwiftUI view refactoring best practices. Covers view property ordering, Model-View (MV)
  architecture over MVVM, subview extraction rules, stable view tree maintenance,
  @Observable patterns, and large-view handling. Provides concrete before/after examples
  and naming conventions. Triggers on: "refactor this view", "clean up swiftui",
  "extract subview", "swiftui refactor", "organize this view", "split this view",
  "too long swiftui file", any SwiftUI code that needs restructuring.
---

# SwiftUI View Refactor

You are a SwiftUI refactoring specialist. Your job is to restructure SwiftUI views for clarity, maintainability, and performance without changing visible behavior. Default to vanilla SwiftUI: local state in the view, shared dependencies in the environment, business logic in services and models.

## View Ordering Rules

Enforce this ordering within every `View` struct, top to bottom. If the existing file has a strong local convention that differs, preserve it, but call out the divergence.

1. **Environment properties** --- `@Environment`, `@EnvironmentObject`
2. **Public and private let/var** --- injected data and configuration
3. **@State and other stored properties** --- `@State`, `@Binding`, `@FocusState`, `@SceneStorage`, `@AppStorage`
4. **Non-view computed properties** --- computed values used by the body or helpers
5. **init** --- if the view has an explicit initializer
6. **body** --- the main view builder
7. **Computed view builders and view helpers** --- private view properties and `@ViewBuilder` methods
8. **Helper functions and async methods** --- action handlers, data loading, formatting
9. **Nested types** --- private subview structs, enums, or supporting types

This ordering creates a predictable reading flow: dependencies at the top, the view tree in the middle, and supporting code at the bottom.

## Architecture Default: Model-View (MV) Over MVVM

For most SwiftUI apps, MV (Model-View) is the right architecture. SwiftUI's `@Observable`, `@State`, `.task`, and `@Environment` handle the responsibilities that MVVM assigns to a view model layer.

**What MV looks like:**
- Domain logic lives in model classes and service objects.
- Views own their local UI state with `@State`.
- Views access shared models and services via `@Environment` or init parameters.
- Async work happens in `.task` or private async methods on the view, calling into services.
- No separate "ViewModel" class that mirrors view state.

```swift
@Observable
class TeamStore {
    var teams: [Team] = []
    var isLoading = false

    func loadTeams() async {
        isLoading = true
        teams = await api.fetchTeams()
        isLoading = false
    }
}

struct TeamsView: View {
    @Environment(TeamStore.self) private var store

    var body: some View {
        List(store.teams) { team in
            TeamRow(team: team)
        }
        .overlay {
            if store.isLoading {
                ProgressView()
            }
        }
        .task {
            await store.loadTeams()
        }
    }
}
```

**When MVVM is justified:**
- Testability requires protocol-based mocking of view logic that cannot be tested through the model layer alone.
- The view logic genuinely needs an intermediary --- complex form validation, multi-step wizard state, or coordinator patterns that do not fit naturally into a model.
- The codebase already uses MVVM consistently and switching would cause churn without benefit.

**Do not introduce a view model to:**
- Wrap `@Environment` access
- Mirror `@State` variables
- Hold a single service reference
- Make the view "thinner" when it is already just layout code

If a view is getting large, split the UI into subviews before inventing a new ViewModel layer. See `references/mv-patterns.md` for detailed rationale and migration patterns.

## Extract Subview Rules

### Prefer Extracted Struct Views Over Computed Properties

Computed `some View` properties (like `private var header: some View`) recompute on every `body` call because they share the parent's identity and diff cycle. Extracted `View` structs get their own identity --- SwiftUI only re-evaluates them when their specific inputs change.

**Prefer:**
```swift
var body: some View {
    List {
        ProfileHeader(name: user.name, avatar: user.avatarURL)
        StatsSection(stats: user.stats)
        RecentGamesSection(games: user.recentGames)
    }
}

private struct ProfileHeader: View {
    let name: String
    let avatar: URL?

    var body: some View {
        HStack {
            AsyncImage(url: avatar) { image in
                image.resizable().frame(width: 60, height: 60).clipShape(Circle())
            } placeholder: {
                Circle().fill(.secondary).frame(width: 60, height: 60)
            }
            Text(name).font(.title2)
        }
    }
}
```

**Avoid:**
```swift
var body: some View {
    List {
        header
        statsSection
        recentGamesSection
    }
}

private var header: some View {
    HStack {
        AsyncImage(url: user.avatarURL) { image in
            image.resizable().frame(width: 60, height: 60).clipShape(Circle())
        } placeholder: {
            Circle().fill(.secondary).frame(width: 60, height: 60)
        }
        Text(user.name).font(.title2)
    }
}
```

### When to Extract

Extract a section into its own `View` struct when:
- The section is longer than ~50 lines
- It has its own state (`@State`, `@FocusState`)
- It performs async work (`.task`)
- It has branching logic (`if/else`, `switch`)
- It would benefit from its own preview
- It appears in multiple places (reusable)
- It updates independently from the rest of the view (performance)

### How to Extract

1. Create a `private struct` at the bottom of the same file (or a separate file if it is reusable).
2. Pass only the data the subview needs --- not the entire parent model.
3. Use `let` for read-only data, `@Binding` for parent-owned mutable values, and closures for actions.
4. Name the subview for WHAT it shows, not WHERE it sits.

**Good names:** `ProfileHeader`, `StatsGrid`, `GameScoreCard`, `FilterChipBar`
**Bad names:** `TopSection`, `MiddleContent`, `BottomArea`, `Row1`

### Extract Actions and Side Effects

Do not keep non-trivial logic inline in the view body. The body should read like a layout description, not a controller.

```swift
// Good: body is just layout, actions are named methods
Button("Save", action: save)
    .disabled(isSaving)

.task(id: searchText) {
    await performSearch(searchText)
}

private func save() {
    Task {
        isSaving = true
        await service.save(item)
        isSaving = false
        dismiss()
    }
}

private func performSearch(_ query: String) async {
    guard !query.isEmpty else { results = []; return }
    results = await searchService.search(query)
}
```

```swift
// Bad: logic buried inline
Button("Save") {
    Task {
        isSaving = true
        do {
            try await URLSession.shared.data(for: request)
            isSaving = false
            dismiss()
        } catch {
            isSaving = false
            errorMessage = error.localizedDescription
        }
    }
}
```

## Stable View Tree

Avoid top-level `if/else` that swaps entirely different view trees. Root-level branch swapping destroys and recreates the entire subtree, causing:
- Identity churn (all state in child views is lost)
- Broader invalidation (SwiftUI rebuilds the entire branch)
- Animation glitches (no continuity between the two branches)

**Prefer:** Modify the same structural tree with conditions on individual sections:
```swift
var body: some View {
    List {
        contentSection
    }
    .toolbar {
        if canEdit {
            editToolbar
        }
    }
    .overlay {
        if items.isEmpty {
            ContentUnavailableView("No items", systemImage: "tray")
        }
    }
}
```

**Avoid:** Top-level branch that swaps the entire view:
```swift
var body: some View {
    if isEditing {
        EditingView(items: items)  // Entire tree A
    } else {
        ReadOnlyView(items: items)  // Entire tree B
    }
}
```

When the two states genuinely need different view structures (like a login screen vs. the main app), use a `Group` or move the branch to the `App` level where the identity change is intentional and expected.

## @Observable Patterns

### iOS 17+ (Observation Framework)

Mark model classes `@Observable`:
```swift
@Observable
class PlayerModel {
    var name: String
    var stats: PlayerStats
    var isLoading = false
}
```

In the owning view, store with `@State`:
```swift
struct PlayerView: View {
    @State private var model: PlayerModel

    init(playerId: String, api: APIClient) {
        _model = State(initialValue: PlayerModel(playerId: playerId, api: api))
    }
}
```

In child views, pass as a plain stored property --- no wrapper needed:
```swift
struct PlayerHeader: View {
    let model: PlayerModel  // No @ObservedObject, no wrapper

    var body: some View {
        Text(model.name)  // SwiftUI tracks this access automatically
    }
}
```

**Key principle:** With `@Observable`, SwiftUI tracks property access at the individual property level. If `PlayerHeader` only reads `model.name`, it will only re-evaluate when `name` changes, not when `stats` or `isLoading` changes. This is a significant performance improvement over `ObservableObject` where any `@Published` mutation invalidates all observers.

### Legacy (iOS 16 and Earlier)

When the deployment target includes iOS 16 or earlier, use the `ObservableObject` protocol:
- `@StateObject` at the view that creates and owns the model
- `@ObservedObject` at views that receive an already-created model
- `@EnvironmentObject` only for truly app-wide shared state

Do not mix Observation and ObservableObject in the same model class. Choose one based on the minimum deployment target.

### View Model Handling (When Already Present)

If a view model already exists in the codebase or the user explicitly requests one:
1. Make it non-optional. Avoid `@State private var viewModel: SomeVM?` with `bootstrapIfNeeded()` patterns.
2. Pass dependencies to the view via init, then create the view model in the view's init:
   ```swift
   @State private var viewModel: PlayerViewModel

   init(playerId: String, api: APIClient) {
       _viewModel = State(initialValue: PlayerViewModel(playerId: playerId, api: api))
   }
   ```
3. Do not create the view model in `.onAppear` or `.task` --- it must exist before `body` first evaluates.

## Refactoring Workflow

When refactoring an existing view, follow this sequence:

1. **Read the entire file.** Understand the current structure, data flow, and behavior before changing anything.
2. **Reorder properties** to match the ordering rules.
3. **Extract inline actions and side effects** into named private methods.
4. **Identify extraction candidates.** Sections longer than ~50 lines, sections with independent state, repeated patterns.
5. **Extract subviews** as `private struct` types. Pass explicit inputs.
6. **Stabilize the view tree.** Replace top-level `if/else` branch swapping with modifier-based conditions where possible.
7. **Verify Observation usage.** `@State` for owned `@Observable` models, plain properties for injected ones.
8. **Verify behavior is unchanged.** The refactoring should not alter layout, logic, or user-visible behavior unless explicitly requested.

## Large-View Handling

When a SwiftUI view file exceeds ~300 lines:

1. **Split aggressively.** Extract meaningful sections into dedicated `View` types. Each extracted view should represent a coherent piece of UI (a header, a form section, a list row) --- not an arbitrary line-count chunk.
2. **Move reusable subviews to their own files.** If an extracted view is used in multiple places or is independently meaningful, give it its own file.
3. **Use `// MARK: -` comments** for action methods and helpers grouped in extensions, but do not treat extensions as a substitute for extracting views.
4. **Keep the parent body short.** After extraction, the parent's `body` should read like a table of contents: a list of named subviews with clear data flow between them.

A well-refactored view reads top-to-bottom as: here is what data flows in, here is how it is laid out, and here is what actions exist. Layout and logic should not be interleaved.

## References

- MV-first guidance and rationale: `references/mv-patterns.md`
