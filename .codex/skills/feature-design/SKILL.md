---
name: feature-design
description: Project-local design workflow for the Notes App. Use when Codex changes UI, styling, layout, Tailwind classes, React component presentation, frontend interactions, or design documentation in this repository.
---

# Feature Design

## Overview

Use this skill for UI and frontend presentation work in the Notes App. Apply the project design system deliberately without injecting mandatory design context into every prompt.

## Workflow

1. Before editing UI, styling, layout, or interaction behavior, read `docs/design/design.md`.
2. From `design.md`, read only the linked detail docs relevant to the task:
   - `docs/design/tokens.md` for color, typography, spacing, radius, shadow, or Tailwind token choices.
   - `docs/design/components.md` for `Layout`, `NoteList`, `NoteItem`, `NoteEditor`, or matching component structure.
   - `docs/design/interactions.md` for click, hover, focus, input, save, delete, loading, error, or empty states.
   - `docs/design/patterns.md` for button, input, card, accessibility, Do/Don't, and new component checks.
3. Implement with existing `src/index.css` theme tokens and existing Tailwind utility patterns before adding new values.
4. Keep the scope tight. Do not broaden UI work into unrelated copy, mojibake, data, or behavior fixes unless the user asked for it.
5. After editing, check `docs/design/patterns.md` Do/Don't rules and `docs/design/interactions.md` for state and interaction consistency.
6. If a new token, visual pattern, component pattern, or interaction behavior is introduced, update the relevant `docs/design` document in the same turn.
7. For source UI/style changes, run the narrowest meaningful validation. Prefer `node .codex/hooks/check-design-system.mjs` for design-system checks, plus tests/build only when behavior or contracts changed.

## Project Rules

- Use theme-token Tailwind classes such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, and `border-border`.
- Avoid hardcoded colors, arbitrary Tailwind colors, undocumented shadows, undocumented gradients, and new radius patterns unless the design docs are updated.
- Preserve the quiet notes-app tone: light gray background, white cards, restrained borders, low shadows, and minimal decoration.
- Keep card nesting shallow. Use cards for repeated items, modals, and genuinely framed tools, not for every page section.
- Keep existing event boundaries intact, especially note selection versus note deletion.
- Use inline UI errors only when the feature requires user-visible validation; otherwise follow existing error handling conventions.

## When Not To Use

Do not use this skill for backend-only changes, documentation-only changes outside design docs, architecture diagrams, non-UI tests, package maintenance, or data-only refactors.
