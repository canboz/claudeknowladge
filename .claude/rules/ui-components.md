---
description: shadcn/ui is the required UI component system; reuse and compose it before writing custom components
paths:
  - "src/app/**"
  - "src/components/**"
---

# UI components (shadcn/ui)

shadcn/ui is the primary and only UI component system. It applies to all pages, layouts, forms, dialogs, navigation and interactive UI.

## Setup

- The project uses Tailwind CSS v4 and the `@/*` alias (maps to `src/*`). Primitives live in `src/components/ui/` (see the project-structure rule).
- `components.json` is the source of truth for aliases, style, base color and CSS variables. Read it before adding or changing components.
- If `components.json` does not exist, shadcn/ui is not initialized: inspect `package.json`, `tsconfig.json` and `src/app/globals.css`, then run `npx shadcn@latest init` with settings compatible with them (Tailwind v4, `@/*` aliases, `src/` layout, CSS variables on).
- If it already exists, do not re-run `init`, overwrite `components.json`, or replace `globals.css` tokens. Add components with `npx shadcn@latest add <component>`.

## Reuse first

- Before building any UI, inspect `src/components/ui/` and the shadcn/ui catalog for an existing component that fits.
- Prefer, in order: use an existing component as-is, extend it via props/`className`/variants, compose several primitives, and only then write a custom component.
- Build complex elements (data tables, command menus, settings forms) by composing primitives (`Dialog`, `Form`, `Select`, `Table`, `Sheet`, ...), not by reimplementing them.
- Do not duplicate a component or reimplement behavior shadcn/ui already provides (modals, dropdowns, tabs, toasts, tooltips, form fields).
- Do not add another component library (Material UI, Chakra UI, Ant Design, Mantine, etc.) or a competing system.

## Styling and tokens

- Use the project's CSS variables and design tokens (`bg-background`, `text-foreground`, `bg-primary`, `border-border`, ...) instead of hard-coded colors, so theming and dark mode keep working.
- Style with Tailwind utilities and merge classes with the `cn()` helper from the configured utils alias. Use `cva` variants for component variants.
- New tokens go in `src/app/globals.css`, not in component files.
- Layouts must be responsive (mobile first, then `sm:`/`md:`/`lg:`).

## Customizing components

- Edit files in `src/components/ui/` only when props, `className` or variants cannot do the job. Keep the original API (props, `asChild`, `ref` forwarding, `data-slot`) so updates and usage stay predictable.
- Preserve the underlying Radix/Base UI accessibility behavior: roles, ARIA attributes, focus management and keyboard handling. Never strip or bypass them.
- Create a custom component only when no shadcn/ui component can reasonably meet the need. Build it from shadcn/ui primitives, and place it in `src/components/` (or a route `_components/` folder), not in `ui/`.

## Accessibility and semantics

- Use semantic HTML (`main`, `nav`, `header`, `section`, `button`, `a`, `label`, headings in order). Do not use a `div` with `onClick` for something that is a button or link.
- Every interactive element must be keyboard-operable with a visible focus state.
- Form controls need associated labels (use shadcn `Label`/`Form` field components) and accessible error messages.
- Icon-only buttons need an `aria-label` or visually hidden text.
