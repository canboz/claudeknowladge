---
description: Strict TypeScript conventions for types, nullability, and error handling
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript

`tsconfig.json` has `strict: true`; keep it on and keep the code free of type errors (`npx tsc --noEmit`).

## Types

- Let inference work for locals and obvious returns. Annotate exported function signatures, public props, and anything where an explicit type documents intent.
- Use `interface` for object shapes that may be extended and `type` for unions, intersections, and mapped/utility types.
- Name props `<Component>Props`, defined in the same file as the component.
- Derive types instead of re-declaring them: `Pick`, `Omit`, `Partial`, `ReturnType`, `Awaited`, `typeof`, `z.infer` (if a schema library is added). Keep one source of truth.
- Colocate a type with its owner. Move it to `src/types/` only when used by multiple features.
- Use `import type { ... }` for type-only imports.
- Prefer string-literal unions (or `as const` objects) over `enum`.

## Avoid escape hatches

- No `any`. Use `unknown` for untrusted data (JSON, `catch` errors, external input) and narrow it with type guards or validation before use.
- Avoid `as` assertions and non-null `!`. Fix the types or narrow instead. If an assertion is unavoidable, add a short comment explaining why it is safe.
- Do not use `@ts-ignore`; if suppression is truly needed, use `@ts-expect-error` with a reason.

## Nullability and errors

- Handle `null`/`undefined` explicitly: optional chaining, `??`, and early returns. Don't use `||` for defaults when `0` or `""` are valid values.
- Check array/index access results (`arr[i]` may be undefined in practice).
- In `catch`, treat the error as `unknown` and narrow (`error instanceof Error`) before reading `.message`.
- Validate data at boundaries (route handlers, Server Actions, `fetch` responses); don't just cast `await res.json()` to a type.
- Model expected failures in return types (e.g. a discriminated union `{ ok: true; data } | { ok: false; error }`) instead of throwing for control flow.
