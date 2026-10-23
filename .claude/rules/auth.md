---
description: Authentication is handled only by Clerk; users must only ever access their own data
paths:
  - "src/app/**"
  - "src/lib/**"
  - "src/proxy.ts"
---

# Auth and data ownership (Clerk)

All authentication is handled by Clerk. Do not build, add, or mix in any other auth mechanism (custom sessions, JWT handling, password storage, another auth library). Clerk is the source of truth for users; there is no users table, and `userId` columns store the Clerk user ID.

Users must only be able to read or change their own data. Never return, modify, or delete data that does not belong to the signed-in user.

## Identifying the user

- On the server, get the user with `auth()` from `@clerk/nextjs/server` (`await auth()`), and read `userId` from it. This is the only trusted source of identity.
- Never accept a user ID from the client (props, form fields, query params, route params, request body, headers) and use it to decide whose data to access. Derive it from `auth()` on the server.
- In Client Components, Clerk hooks (`useUser`, `useAuth`) and `<SignedIn>`/`<SignedOut>` are for display only. They are never an authorization check.
- Use Clerk's components (`<SignIn>`, `<SignUp>`, `<UserButton>`) and the existing sign-in and sign-up pages instead of custom auth UI.

## Authorizing every access

- Every Server Action, route handler, and data-access function that touches user data must check `userId` itself. Don't rely on `src/proxy.ts` (`clerkMiddleware`) alone: it does not protect routes unless configured to, and it never checks ownership of a record.
- If there is no `userId`, stop before touching the database: redirect to sign-in in pages, return 401 from route handlers, and return an error result from Server Actions.
- Scope every query by owner. Put the `userId` condition in the Drizzle query itself (`and(eq(table.id, id), eq(table.userId, userId))`), not in a check done after fetching the row.
- `notesTable` has no `userId` of its own; it belongs to a user through `knowledgeBasesTable`. Any note query, including by note ID, must join to or filter by its knowledge base's `userId`. Before creating a note, confirm the target knowledge base belongs to the current user.
- Apply the ownership condition to updates and deletes too, not just reads.
- Treat IDs from the client as untrusted: someone else's record must behave the same as a missing one. Return not-found (`notFound()` or a 404), not 403, so record existence isn't leaked.
- Set `userId` on insert from `auth()`, never from input. Never allow `userId` to be updated.
- Keep ownership checks in the data-access layer (`src/lib/`) so no caller can skip them. Functions there should take `userId` as a required argument, with no unscoped variants like `getAllNotes()`.
- Caching must not leak data between users: do not use `"use cache"` on functions that return user-specific data unless `userId` is passed as an argument so it becomes part of the cache key. Read `auth()` outside the cached scope.

## Secrets and webhooks

- Clerk keys come from environment variables. Never hard-code them, and never expose `CLERK_SECRET_KEY` to the client (only `NEXT_PUBLIC_*` values are public).
- Verify Clerk webhooks with `verifyWebhook` before trusting the payload.

## Before finishing

When you add or change a query, action, or route that touches user data, check it against these questions: Is `userId` from `auth()`? Is the ownership condition in the query? Does an unauthenticated or other user's request get nothing?
