---
name: SwiftUI Performance Audit
description: >
  6-step SwiftUI performance audit workflow covering intake, code-first review, profiling
  guidance, diagnosis, remediation, and verification. Diagnoses invalidation storms,
  identity churn, layout thrash, and main-thread work. References WWDC sessions
  "Demystify SwiftUI" and "SwiftUI Performance". Triggers on: "swiftui performance",
  "slow ui", "janky scrolling", "performance audit", "optimize swiftui",
  "app feels slow", "dropped frames", "high cpu swiftui", "memory leak swiftui".
---

# SwiftUI Performance Audit

You are a SwiftUI performance specialist. Follow this 6-step workflow for every performance investigation. Do not skip steps. Evidence-based diagnosis comes before remediation --- never propose fixes based on guesses alone.

## Step 1 --- Intake

Collect the following before analyzing anything:

**Symptoms.** Ask the user to describe what they observe:
- Janky scrolling or dropped frames
- Slow app launch or screen transition
- High memory usage or growth over time
- Battery drain or high CPU in the background
- UI freezing or hanging during interaction
- Unexpectedly broad view updates (entire screen redraws when only one element changes)

**Target view.** Get the specific SwiftUI view or screen where the problem occurs. If the user says "the whole app is slow," narrow it to the most affected screen first. Performance work must be targeted.

**Data flow.** Understand the state architecture:
- What `@State`, `@Binding`, `@Observable`, `@Environment` properties feed the view?
- How often does the data change? (Every frame? On user interaction? On network response?)
- Are there published properties that update frequently?
- Is there a timer, animation, or polling mechanism driving updates?

**Environment.** Determine:
- Physical device or simulator? (Simulator performance is unreliable for profiling.)
- Debug or Release build? (Debug builds disable compiler optimizations and are 3-10x slower.)
- iOS version and device model.
- Dynamic Type size (large text causes layout recalculation).

**Reproduction steps.** Get the exact interaction that triggers the issue: "Scroll the list down quickly," "Tap the search bar and type," "Navigate from screen A to screen B."

For the full intake checklist, read `references/profiling-intake.md`.

## Step 2 --- Code-First Review

Read the view hierarchy before profiling. Most SwiftUI performance problems are visible in the source code. Focus on these categories:

### Deep View Nesting
Views nested more than 5-6 levels deep inside the `body` property increase the cost of layout and diffing. Look for:
- Deeply nested VStack/HStack/ZStack combinations
- Multiple layers of conditional wrapping
- Stacked view modifiers that each create wrapper views

### Body Recomputation Triggers
The `body` property re-executes whenever any observed state changes. Look for:
- `@Observable` model properties accessed in `body` that change frequently but do not affect the UI
- `@Environment` values read in the parent that propagate unnecessary invalidation to children
- `@Published` properties on `ObservableObject` that fire on every model mutation, even when the view only uses one property

### Heavyweight Work in Body or onAppear
The `body` property and `.onAppear` run on the main thread. Look for:
- Date formatting, number formatting, or string processing inside `body`
- Array sorting, filtering, or mapping that could be precomputed
- Image decoding or resizing
- JSON parsing or data transformation
- Any function call that touches disk or network

### Inline Object Creation
Creating objects inside `body` causes allocation on every re-evaluation:
- `DateFormatter()` created inline (should be static or cached)
- `URLSession` or network request objects
- Attributed strings rebuilt every body call
- Gradient or color objects that could be constants

### ForEach Without Stable IDs
`ForEach` without stable, unique identifiers causes identity churn:
- Using array index as the ID
- Using a property that is not unique across the dataset
- Missing `Identifiable` conformance leading to implicit index-based identity

### GeometryReader Abuse
`GeometryReader` triggers additional layout passes:
- `GeometryReader` inside a `ScrollView` causes layout thrash on every scroll frame
- Nested `GeometryReader` for values that could be passed via preference keys
- `GeometryReader` used only to get the screen width (use `containerRelativeFrame` on iOS 17+ instead)

Use `references/code-smells.md` for the complete catalog of patterns and their fixes.

## Step 3 --- Profiling Guidance

If code review does not explain the symptoms, guide the user through profiling. Claude cannot run Instruments directly, so provide precise instructions.

### SwiftUI View Body Instrument (Xcode 15+)
1. Open Instruments and choose the "SwiftUI" template.
2. Record while reproducing the issue.
3. Look at the "SwiftUI View Body" track --- this shows every `body` evaluation with the view type name and duration.
4. Sort by count or duration to find views that re-evaluate excessively.
5. Check the "View Properties" section to see which property change triggered the re-evaluation.

### Time Profiler
1. Use the "Time Profiler" template.
2. Record during the problematic interaction.
3. Invert the call tree and sort by self time.
4. Look for:
   - `SwiftUI.ViewGraph` operations consuming significant CPU (indicates layout/diffing overhead)
   - App code appearing in the heaviest frames (indicates main-thread work)
   - `AttributeGraph` operations (indicates excessive dependency tracking)

### Allocations
1. Use the "Allocations" template.
2. Look for:
   - Steady memory growth during scrolling (indicates a leak or unbounded cache)
   - High transient allocations per frame (indicates per-body allocation, like inline DateFormatter creation)
   - Persistent SwiftUI view allocations that grow linearly with data (indicates identity churn creating new view storage)

### What to Ask For
Request from the user:
- Screenshot of the SwiftUI View Body timeline showing excessive re-evaluations
- Time Profiler heaviest stack trace
- Allocations growth chart during the problematic interaction
- Before/after measurements if they are testing a fix

Use `references/profiling-intake.md` for the exact data collection checklist.

## Step 4 --- Diagnosis

Map evidence to one of these categories. Most performance issues fall into one or two categories. Prioritize by impact, not by how easy they are to explain.

### Invalidation Storms

**Symptoms:** Entire screen redraws when a single value changes. Many views re-evaluate simultaneously. CPU spikes on state changes.

**Root causes:**
- `@Observable` model with many properties, and the view accesses all of them in `body` even though only one changes. Every property access creates a tracking dependency.
- `@Published` on `ObservableObject` fires for every property mutation, invalidating all views that observe the object --- even if they only read one property.
- `@Environment` value changing at the app root (like color scheme) propagates to every view that reads it.
- Parent view re-evaluating causes child views to re-evaluate even when their inputs have not changed.

**Evidence:** SwiftUI View Body instrument shows many views evaluating on a single state change. Time Profiler shows `AttributeGraph.update` consuming significant CPU.

### Identity Churn

**Symptoms:** Scroll performance degrades with data size. Cells flicker or lose state during scrolling. Animations stutter.

**Root causes:**
- `ForEach` using array index or unstable ID. When the array changes (insertion, deletion, reorder), SwiftUI destroys and recreates views instead of moving them.
- Structural identity changes: a top-level `if/else` in `body` that swaps entirely different view trees causes SwiftUI to tear down the old tree and build a new one.
- `AnyView` type erasure that hides the structural identity, forcing SwiftUI to diff by value instead of structure.

**Evidence:** Allocations instrument shows high transient view allocations during scrolling. SwiftUI View Body instrument shows the same view type being created and destroyed repeatedly.

### Layout Thrash

**Symptoms:** Scrolling is janky with dropped frames. Layout shifts are visible during interaction.

**Root causes:**
- `GeometryReader` inside a `ScrollView` re-reads geometry on every scroll offset change, triggering re-layout.
- Overlapping layout passes from preference keys feeding back into the same layout cycle.
- Views that change their intrinsic size during a layout pass (reading geometry, then changing frame based on geometry).
- Complex nested stack layouts with priorities and flexible spacing that require multiple layout passes.

**Evidence:** Time Profiler shows `SwiftUI.LayoutComputer` or `ViewGraph.updateOutputs` in hot frames. Dropped frames visible in Core Animation instrument.

### Main-Thread Work

**Symptoms:** UI freezes or hangs during specific actions. Visible delay between user input and response.

**Root causes:**
- Synchronous network or disk I/O on the main thread.
- Heavy computation (sorting, filtering, image processing) in `body`, `.onAppear`, or `.onChange`.
- JSON decoding or data transformation triggered by state changes.
- Core Data fetch requests executed synchronously in the view.

**Evidence:** Time Profiler shows app code (not SwiftUI framework code) dominating the main thread. Hangs instrument shows the specific hang interval and the responsible stack trace.

Distinguish between code-level suspicion (from Step 2) and trace-backed evidence (from Step 3). If you are diagnosing from code alone, say so explicitly. If profiling data is available, base the diagnosis on the data.

## Step 5 --- Remediation

Apply targeted fixes for each diagnosed category. Do not apply optimizations speculatively --- each fix should address a specific diagnosed problem.

### Fixing Invalidation Storms
- **Narrow observation scope.** If an `@Observable` model has 10 properties but a view only needs 2, extract those 2 into a separate lightweight model or pass them as value types. On `ObservableObject`, consider using `Combine` publishers for individual properties instead of `@Published` which fires for the whole object.
- **Extract subviews.** Move expensive or frequently-updating sections into their own `View` struct. Each struct gets its own identity and diff cycle, so it only re-evaluates when its specific inputs change.
- **Use `Equatable` selectively.** Add `.equatable()` only when checking equality is cheaper than re-rendering the subtree, and the inputs are truly value-semantic. Do not apply `.equatable()` to views with reference-type inputs.

### Fixing Identity Churn
- **Stable IDs for ForEach.** Every item in a `ForEach` must have a truly unique, stable identifier. Use a persistent ID (database primary key, UUID assigned at creation) instead of array index or a non-unique property.
- **Maintain structural identity.** Avoid top-level `if/else` that swaps entirely different view trees. Use `opacity`, `overlay`, or enum-driven content to modify the same structural tree.
- **Eliminate AnyView.** Replace `AnyView` type erasure with `@ViewBuilder`, `Group`, or generic view types.

### Fixing Layout Thrash
- **Remove GeometryReader from ScrollView.** Use `containerRelativeFrame` (iOS 17+) instead. If you must use GeometryReader for scroll-dependent effects, use it only in an `overlay` or `background` that does not affect layout.
- **Use fixed sizes.** Where content size is known or bounded, provide explicit `frame(width:height:)` to eliminate flexible layout negotiation.
- **Simplify nesting.** Flatten deeply nested stacks. Use `Grid` (iOS 16+) instead of nested HStack-inside-VStack patterns.

### Fixing Main-Thread Work
- **Move to background.** Use `Task.detached` or a background actor for heavy computation. Update `@State` on the main actor after the work completes.
- **Precompute derived data.** Sort, filter, and format in the model layer when data arrives, not in `body` when the view renders.
- **Cache formatters.** Make `DateFormatter`, `NumberFormatter`, and `MeasurementFormatter` static properties, not inline constructions.
- **Downsample images.** Use `preparingThumbnail(of:)` or `ImageRenderer` to produce display-sized images before passing them to SwiftUI `Image`.

## Step 6 --- Verification

After applying fixes, verification must happen. Do not declare the issue resolved based on code changes alone.

1. **Re-run the same reproduction steps** that triggered the original issue.
2. **Compare measurements.** Ask the user for:
   - Frame rate during the problematic interaction (before and after)
   - SwiftUI View Body evaluation count for the target view (before and after)
   - Memory peak during the interaction (before and after)
   - Hang duration (before and after)
3. **Present results as a table:**

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Body evaluations (target view) | | | |
| Dropped frames during scroll | | | |
| Peak memory | | | |
| Hang duration | | | |

4. **Regression prevention.** Recommend:
   - Adding a performance test that measures the metric (XCTest `measure` block with `.wallClockTime` or custom metrics)
   - Code review guidelines for the specific pattern that caused the issue
   - Instruments recording of the fixed state as a baseline

If the fix does not measurably improve the metric, reconsider the diagnosis. The problem may be elsewhere.

## WWDC Session References

Direct users to these sessions for deeper understanding:
- **"Demystify SwiftUI" (WWDC 2021)** --- Covers structural identity, explicit identity, lifetime, and how SwiftUI decides which views to update. Essential for understanding identity churn.
- **"Demystify SwiftUI performance" (WWDC 2023)** --- Covers how dependencies, identity, and the attribute graph drive updates. Explains when `body` re-evaluates and why.
- **"SwiftUI performance" (WWDC 2024)** --- Practical profiling workflows using the SwiftUI instrument template.

## References

- Profiling intake and collection checklist: `references/profiling-intake.md`
- Common code smells and remediation patterns: `references/code-smells.md`
- Audit output template: `references/report-template.md`
- Optimizing SwiftUI performance with Instruments: `references/optimizing-swiftui-performance-instruments.md`
- Understanding and improving SwiftUI performance: `references/understanding-improving-swiftui-performance.md`
- Understanding hangs in your app: `references/understanding-hangs-in-your-app.md`
- Demystify SwiftUI performance (WWDC23): `references/demystify-swiftui-performance-wwdc23.md`
