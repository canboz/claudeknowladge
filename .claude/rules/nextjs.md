---
description: Next.js 16 App Router conventions (Server/Client Components, data fetching, caching, special files)
paths:
  - "src/app/**"
  - "src/components/**"
  - "src/hooks/**"
  - "next.config.ts"
---

# Next.js 16 (App Router)

This Next.js version differs from older releases. Before using an API you are unsure about, read the relevant guide in `node_modules/next/dist/docs/01-app/` (see `AGENTS.md`) and heed deprecation notices.

## Server vs Client Components

- Components are Server Components by default. Add `"use client"` only for state, effects, event handlers, or browser APIs.
- Put `"use client"` on the smallest leaf component that needs it; keep parents server-rendered and pass server-rendered content in as `children`.
- Never import server-only code into a Client Component. Pass data down as serializable props.

## Routing and special files

- Use `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` (must be a Client Component), `not-found.tsx`, and `route.ts` per the App Router file conventions.
- Type route props with the generated globals (`PageProps<"/path">`, `LayoutProps<"/path">`) as `src/app/layout.tsx` does. `params` and `searchParams` are Promises; `await` them.
- Add `loading.tsx` or `<Suspense>` boundaries around slow data instead of blocking the whole page.
- Add an `error.tsx` at meaningful boundaries; call `notFound()` for missing resources.
- Use `next/link` for navigation, `next/image` for images, `next/font` for fonts.

## Metadata

- Export `metadata` (static) or `generateMetadata` (dynamic) from `layout.tsx`/`page.tsx`. Never use a manual `<head>`. Replace the placeholder "Create Next App" title and description when building real pages.

## Data fetching and caching

`cacheComponents` is enabled in `next.config.ts`, so rendering is dynamic by default and caching is opt-in.

- Fetch data in Server Components with `async`/`await`, directly or via functions in `src/lib/`. Do not use `useEffect` + `fetch` for initial data, and do not create a route handler just to feed your own pages.
- Opt into caching with the `"use cache"` directive on async functions or components, with `cacheLife` and `cacheTag` to control lifetime and invalidation.
- Do not read `cookies()`, `headers()`, or `searchParams` inside a `"use cache"` scope. Read them outside and pass the values as arguments.
- Wrap runtime/uncached data access in `<Suspense>` so the static shell can still prerender.
- Run independent fetches in parallel (`Promise.all`), not sequentially.
- Invalidate with `revalidateTag` / `updateTag` / `revalidatePath` from Server Actions or route handlers after mutations.

## Mutations and route handlers

- Prefer Server Actions (`"use server"`) for mutations from the UI; validate and authorize all input on the server.
- Use `route.ts` only for external consumers (webhooks, public APIs). Return `Response`/`NextResponse` with correct status codes.

## Keep client JavaScript small

- Don't mark whole pages or layouts `"use client"`, and don't duplicate server logic in client code.
- Lazy-load heavy client-only components with `next/dynamic` where it helps.
