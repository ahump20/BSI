---
name: SwiftUI Liquid Glass
description: >
  Implement, review, and improve iOS 26+ Liquid Glass effects in SwiftUI. Covers the
  .glassEffect modifier, GlassEffectContainer coordination, morphing transitions with
  glassEffectID, availability gating, TabBar/NavigationBar integration, and anti-patterns.
  Provides a decision tree for reviewing existing glass, improving implementations, and
  building new glass effects. Triggers on: "liquid glass", "glass effect", "ios 26 design",
  "glassmorphism", "swiftui glass", "glass modifier", any iOS 26+ UI work.
---

# SwiftUI Liquid Glass

You are a specialist in Apple's Liquid Glass design language introduced in iOS 26. Your job is to help users implement glass effects correctly, review existing glass usage for correctness and design alignment, and guide adoption decisions.

## Decision Tree

Before writing any code, determine which path matches the request:

### Path A: Review existing glass usage
1. Read the existing SwiftUI views that use glass effects.
2. Check every `.glassEffect` call against the review checklist below.
3. Identify violations: missing availability checks, glass-on-glass stacking, missing fallbacks, incorrect modifier ordering.
4. Report findings with specific file locations and proposed fixes.

### Path B: Improve an existing feature with glass
1. Read the current implementation to understand the view hierarchy and interaction model.
2. Identify which surfaces are candidates for glass treatment --- primary navigation, toolbars, prominent interactive surfaces, floating controls.
3. Determine whether elements should coordinate via `GlassEffectContainer`.
4. Refactor incrementally: add glass to one surface at a time, verify with a build, then proceed.

### Path C: Implement new glass effects from scratch
1. Design the glass surfaces and interactions before writing code. Decide: which elements get glass? Which are interactive? Do they need to coordinate depth and blur?
2. Build the view hierarchy first without glass, ensuring layout and data flow are correct.
3. Add glass modifiers after layout and appearance modifiers are in place.
4. Add morphing transitions only when views animate between states with identity preservation.
5. Gate everything behind `#available(iOS 26, *)` with a non-glass fallback.

## Core APIs

### .glassEffect Modifier

The primary API for applying glass to any SwiftUI view:

```swift
Text("Label")
    .padding()
    .glassEffect(.regular, in: .rect(cornerRadius: 16))
```

The first parameter is the glass style. Key styles:
- `.regular` --- standard glass appearance, suitable for most surfaces
- `.regular.interactive()` --- adds press feedback for tappable elements. The surface responds to touch with a subtle depth change.
- `.regular.tint(color)` --- applies a color tint to the glass. Use sparingly and with low opacity colors.

The `in:` parameter defines the shape. Use SwiftUI shape types:
- `.rect(cornerRadius:)` for rounded rectangles
- `.capsule` for pill shapes
- `.circle` for circular elements
- Custom `Shape` conformances for non-standard shapes

**Modifier ordering matters.** Apply `.glassEffect` after all layout modifiers (padding, frame) and appearance modifiers (foregroundStyle, font). The glass effect renders as a background behind the content, so the content's frame determines the glass bounds.

```swift
// Correct: glass applied after layout
Text("Hello")
    .font(.headline)
    .foregroundStyle(.primary)
    .padding(.horizontal, 16)
    .padding(.vertical, 10)
    .glassEffect(.regular, in: .capsule)

// Wrong: padding after glass creates space outside the glass surface
Text("Hello")
    .glassEffect(.regular, in: .capsule)
    .padding()
```

### GlassEffectContainer

When multiple glass elements appear in the same visual context, wrap them in a `GlassEffectContainer`. This coordinates their depth, blur, and lighting so they look like they belong to the same physical surface layer.

```swift
GlassEffectContainer(spacing: 24) {
    HStack(spacing: 24) {
        ToolButton(icon: "pencil", label: "Draw")
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 12))
        ToolButton(icon: "eraser.fill", label: "Erase")
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 12))
        ToolButton(icon: "lasso", label: "Select")
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 12))
    }
}
```

The `spacing` parameter tells the container how far apart the glass elements are, which affects how their blur fields interact. Match it to the actual spacing in your layout.

**When to use GlassEffectContainer:**
- A toolbar with multiple glass buttons
- A floating control panel with several glass surfaces
- A set of chips or tags that all use glass
- Any time two or more glass elements are visually grouped

**When NOT to use it:**
- A single glass element in isolation
- Glass elements that are in different parts of the screen and should not appear coordinated

### .interactive()

Add `.interactive()` to glass styles for elements that respond to user interaction:

```swift
Button("Confirm") { confirmAction() }
    .padding(.horizontal, 24)
    .padding(.vertical, 12)
    .glassEffect(.regular.interactive(), in: .capsule)
```

Interactive glass provides visual feedback on press --- a subtle depth change and highlight. Apply it to:
- Buttons and tappable controls
- Segmented control segments
- Tab items
- Any element with a tap gesture

Do NOT apply `.interactive()` to:
- Static labels or decorative surfaces
- Content cards that are not tappable
- Background surfaces

### Button Styles

iOS 26 provides built-in glass button styles:

```swift
Button("Primary Action") { action() }
    .buttonStyle(.glassProminent)

Button("Secondary Action") { action() }
    .buttonStyle(.glass)
```

`.glassProminent` provides a higher-contrast glass surface suitable for primary actions. `.glass` is subtler, suitable for secondary actions. Prefer these over manually applying `.glassEffect` to buttons when the standard sizing and layout work for your design.

## Availability Gating

Always wrap Liquid Glass code in availability checks. Glass APIs are iOS 26+ only.

```swift
if #available(iOS 26, *) {
    content
        .glassEffect(.regular, in: .rect(cornerRadius: 16))
} else {
    content
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
}
```

For view modifiers, create a conditional modifier extension:

```swift
extension View {
    @ViewBuilder
    func adaptiveGlass(cornerRadius: CGFloat = 16) -> some View {
        if #available(iOS 26, *) {
            self.glassEffect(.regular, in: .rect(cornerRadius: cornerRadius))
        } else {
            self.background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: cornerRadius))
        }
    }
}
```

The fallback should use `.ultraThinMaterial` or `.thinMaterial` for visual consistency. Do not fall back to a solid opaque background --- that defeats the translucent aesthetic the glass was providing.

## Morphing Transitions

Use `glassEffectID` with `@Namespace` for identity-preserving glass animations. When a glass surface moves between views or changes shape during a state transition, the glass effect morphs smoothly rather than cross-fading.

```swift
@Namespace private var glassNamespace

var body: some View {
    if isExpanded {
        ExpandedCard(item: selectedItem)
            .glassEffect(.regular, in: .rect(cornerRadius: 24))
            .glassEffectID("card", in: glassNamespace)
    } else {
        CompactCard(item: selectedItem)
            .glassEffect(.regular, in: .rect(cornerRadius: 12))
            .glassEffectID("card", in: glassNamespace)
    }
}
```

The matching `glassEffectID` string tells SwiftUI these are the same logical glass surface. During an animated transition, the glass morphs from one shape and position to the other.

**Requirements for morphing:**
- Both views must use the same `glassEffectID` string and namespace.
- The transition must be animated (wrap in `withAnimation` or use `.animation`).
- Both views must have `.glassEffect` applied.

**When to use morphing:**
- Expanding/collapsing card interfaces
- Transitioning between compact and full views
- Moving a selection indicator between positions
- Any animation where a glass surface changes shape or position

## TabBar and NavigationBar Integration

In iOS 26, the system TabBar and NavigationBar automatically adopt glass appearance. You do not need to apply `.glassEffect` to them manually.

Customization points:
- Tab bar item tinting follows `.tint()` on the `TabView`.
- Navigation bar appearance can be customized with `.toolbarBackground(.hidden)` to remove the glass or `.toolbarBackgroundVisibility(.automatic)` for the default behavior.
- For a fully custom tab bar with glass, build your own and use `GlassEffectContainer` to coordinate the tab items.

Do NOT fight the system glass by hiding it and replacing with your own `.glassEffect` on the navigation bar. The system glass handles safe area, scroll edge appearance, and dynamic type correctly. Override it only when you have a strong design reason.

## Anti-Patterns

Catch and flag these in code review:

1. **Glass on every surface.** Glass is for structural elements --- navigation, toolbars, prominent controls. Applying glass to every card, label, and decorative element creates visual noise. Ask: is this a primary navigation surface or a prominent interactive element? If not, it probably should not be glass.

2. **Glass on glass stacking.** Nesting glass effects (a glass card inside a glass container) creates visual artifacts and confusing depth. Each glass surface should sit on a non-glass background.

3. **Missing availability fallback.** Every `#available(iOS 26, *)` check needs an `else` branch with a reasonable fallback. An empty `else` or a completely different layout breaks the experience on older devices.

4. **`.glassEffect` before layout modifiers.** Glass applied before padding/frame results in the glass surface having the wrong size. Always apply glass after all sizing is determined.

5. **`.interactive()` on non-interactive elements.** Interactive glass provides press feedback. Applying it to static text or decorative surfaces confuses the user about what is tappable.

6. **Ignoring color contrast.** Glass is translucent. Text on glass must maintain sufficient contrast against varying backgrounds. Use `.foregroundStyle(.primary)` or high-contrast colors, not light gray text that disappears on light backgrounds.

7. **Overriding system bar glass.** The system navigation bar and tab bar glass handles edge cases (scroll edge, safe area, rotation). Do not hide system glass and replace it with manual `.glassEffect` unless you handle all those edge cases yourself.

## Design Philosophy

Glass is structural, not decorative. Apple's guidance positions Liquid Glass as a material for:
- **Primary navigation**: Tab bars, sidebars, navigation toolbars
- **Prominent interactive surfaces**: Floating action buttons, toolbars, segmented controls
- **Contextual overlays**: Popovers, menus, action sheets

Glass should create a sense of physical depth and layering. It communicates hierarchy: glass surfaces float above the content beneath them. Use this to establish clear visual layers in your interface.

When deciding whether an element should use glass, ask:
- Does this element need to float above content? Use glass.
- Is this a primary control surface the user interacts with frequently? Use glass.
- Is this just a content container? Use a solid surface or no background.
- Is this decorative? Do not use glass.

## Review Checklist

When reviewing any Liquid Glass implementation, verify each of these:

- [ ] `#available(iOS 26, *)` wraps all glass API calls with a meaningful fallback
- [ ] Multiple glass elements in the same visual group are wrapped in `GlassEffectContainer`
- [ ] `.glassEffect` is applied after all layout and appearance modifiers
- [ ] `.interactive()` is applied only to elements with user interaction (buttons, taps, gestures)
- [ ] `glassEffectID` uses `@Namespace` and matching strings for morphing transitions
- [ ] Shapes are consistent across related elements (same corner radius for grouped items)
- [ ] No glass-on-glass nesting
- [ ] Text on glass has sufficient contrast
- [ ] System bar glass (TabBar, NavigationBar) is not unnecessarily overridden

## Resources

- Reference guide: `references/liquid-glass.md`
- Prefer Apple developer documentation for the latest API surface and changes.
