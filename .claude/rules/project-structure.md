---
description: Directory layout and file placement conventions for this Next.js project
paths:
  - "src/**"
  - "public/**"
---

# Project structure

All application code lives under `src/`. Import across folders with the `@/*` alias (maps to `src/*`); use relative imports only for siblings in the same folder.

## Layout

```
src/
  app/            # Routing only: pages, layouts, route handlers, special files, globals.css
  components/     # Shared React components
    ui/           # Generic, presentation-only primitives (Button, Card, ...)
  hooks/          # Shared client hooks (`use*.ts`)
  lib/            # Non-React utilities, data access, server helpers, constants
  types/          # Shared types used by more than one feature
public/           # Static assets served from `/`
```

Create a folder only when the first file for it exists. Do not add empty folders, barrel `index.ts` files, or wrapper abstractions "just in case".

## Placement rules

- **Routes, layouts, pages**: `src/app/**` only. Keep `page.tsx` and `layout.tsx` thin: fetch data and compose components, don't hold large UI or business logic.
- **Route-specific code**: colocate with the route in a `_components/` (or `_lib/`) private folder, e.g. `src/app/dashboard/_components/StatsCard.tsx`. Move it to `src/components` only once a second route uses it.
- **Shared components**: `src/components/`, one component per file, PascalCase filename matching the export (`UserCard.tsx`).
- **Hooks**: `src/hooks/`, camelCase `useThing.ts`. Hooks are client-only; do not put server logic in them.
- **Utilities and data access**: `src/lib/`, grouped by domain (`lib/users.ts`), not into a catch-all `utils.ts`.
- **Types**: colocate with the code that owns them; promote to `src/types/` only when shared (see the TypeScript rule).
- **Styles**: Tailwind utility classes in JSX. Global CSS, `@theme` tokens and CSS variables go in `src/app/globals.css`. Do not add per-component CSS files or CSS-in-JS.

## Separation of concerns

- Components render; `lib/` fetches and transforms data; hooks hold client state/effects.
- Keep components small and single-purpose. Extract when a component mixes data loading, state and layout, or when markup repeats.
- Prefer composition (`children`, props) over deep prop drilling or configuration-heavy components.
- Files that must never reach the client (secrets, DB access) should import `server-only`.
