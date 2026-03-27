---
name: shadcn-best-practices
description: Manages shadcn components and projects — adding, searching, fixing, debugging, styling, and composing UI. Provides project context, component docs, and usage examples. Applies when working with shadcn/ui, component registries, presets, --preset codes, or any project with a components.json file. Also triggers for "shadcn init", "create an app with --preset", or "switch to --preset".
---

# shadcn/ui

A framework for building UI, components, and design systems by adding source files directly to the user's project through the CLI.

> IMPORTANT: Run CLI commands with the project's package runner: `npx shadcn@latest`, `pnpm dlx shadcn@latest`, or `bunx --bun shadcn@latest`, based on the repo's package manager.

## Current project context

Before changing anything, run the project-appropriate `shadcn info --json` command to inspect the active configuration, installed components, aliases, icon library, framework, and resolved paths. Use `shadcn docs <component>` to retrieve the current docs and example URLs before editing a component.

## Principles

1. Use existing components first. Run `shadcn search` before writing custom UI.
2. Compose instead of reinventing. Build product surfaces out of the existing primitives when possible.
3. Prefer built-in variants before custom styling.
4. Use semantic colors and design tokens instead of raw Tailwind color values.

## Critical rules

These rules are always enforced. Each links to a file with concrete incorrect and correct examples.

### Styling & Tailwind → [styling.md](./rules/styling.md)

- `className` is for layout and composition, not for rewriting the component's design system.
- Use `gap-*`, not `space-x-*` or `space-y-*`.
- Use `size-*` when width and height are equal.
- Use `truncate` instead of rebuilding the truncation stack manually.
- Avoid manual `dark:` color overrides when semantic tokens already solve the problem.
- Use `cn()` for conditional classes.
- Avoid manual z-index overrides on overlay primitives.

### Forms & Inputs → [forms.md](./rules/forms.md)

- Forms use `FieldGroup` and `Field`, not loose div stacks.
- `InputGroup` uses its dedicated child primitives.
- Buttons inside inputs should use the input-group addon pattern.
- Small option sets should use `ToggleGroup`.
- Group related checkboxes or radios with `FieldSet` and `FieldLegend`.
- Validation state belongs on the field wrapper and the actual control, not in ad hoc class names.

### Component Structure → [composition.md](./rules/composition.md)

- Keep child items inside their required parent group primitives.
- Use `asChild` or `render` according to the project's base primitive system.
- Dialog, Sheet, and Drawer always need a title for accessibility.
- Use full Card composition rather than dumping everything into `CardContent`.
- Compose button loading states with `Spinner` and `disabled`; do not invent custom button APIs.
- Keep triggers inside their required parent wrappers.
- `Avatar` always needs a fallback.

### Use components, not custom markup → [composition.md](./rules/composition.md)

- Prefer existing components before custom markup.
- Use `Alert`, `Empty`, `Separator`, `Skeleton`, and `Badge` rather than rebuilding those patterns.
- Use `toast()` from `sonner` for toasts.

### Icons → [icons.md](./rules/icons.md)

- Icons in buttons use `data-icon`.
- Avoid manual icon sizing inside wrapped components unless the API requires it.
- Pass icon objects, not string keys.

## Key patterns

These are the patterns that most often separate clean shadcn/ui work from improvised markup:

```tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" />
  </Field>
</FieldGroup>
```

```tsx
<Field data-invalid>
  <FieldLabel>Email</FieldLabel>
  <Input aria-invalid />
  <FieldDescription>Invalid email.</FieldDescription>
</Field>
```

```tsx
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>
```

```tsx
<div className="flex flex-col gap-4" />
```

```tsx
<Avatar className="size-10" />
```

## Project-shape reminders

When `shadcn info --json` reports the project context, pay attention to:

- `aliases`
- `isRSC`
- `tailwindVersion`
- `tailwindCssFile`
- `style`
- `base`
- `iconLibrary`
- `resolvedPaths`
- `framework`
- `packageManager`

Use those values instead of assuming defaults.

## Workflow

1. Run `shadcn info --json`.
2. Check what is already installed before adding anything.
3. Run `shadcn search` to find candidate components or blocks.
4. Run `shadcn docs <component>` and fetch the resulting docs before editing or adding it.
5. Use `shadcn add` to install or update components.
6. After adding registry code, read the new files and fix any bad imports, composition errors, or icon mismatches.
7. Do not guess the registry. If the user did not specify one, ask.
8. When switching presets, ask whether the user wants reinstall, merge, or skip behavior.

## Updating components

When the user wants upstream updates while preserving local changes:

1. Run `shadcn add <component> --dry-run`.
2. For each affected file, run `shadcn add <component> --diff <file>`.
3. Merge upstream changes intentionally when the file has local edits.
4. Never use `--overwrite` without explicit approval.

## Quick reference

```bash
npx shadcn@latest init --defaults
npx shadcn@latest add button card dialog
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest docs button dialog select
npx shadcn@latest add button --dry-run
npx shadcn@latest add button --diff button.tsx
```

## Detailed references

- [rules/forms.md](./rules/forms.md)
- [rules/composition.md](./rules/composition.md)
- [rules/icons.md](./rules/icons.md)
- [rules/styling.md](./rules/styling.md)
- [rules/base-vs-radix.md](./rules/base-vs-radix.md)
- [cli.md](./cli.md)
- [customization.md](./customization.md)
