---
description: Data retrieval in Server Components, mutations in Server Actions, all validation with zod, typed (non-FormData) action inputs
paths:
  - "src/app/**"
  - "src/components/**"
  - "src/lib/**"
---

# Data flow and validation

## Reading data

- Data retrieval is always done in Server Components. Fetch with `async`/`await` directly in the component, or by calling data-access functions from `src/lib/` (which use Drizzle, see the database rule).
- Never fetch data from Client Components: no `useEffect` + `fetch`, no client-side data libraries, no route handlers created just to feed our own UI. If a Client Component needs data, fetch it in a parent Server Component and pass it down as serializable props.

## Writing data

- Every insert, update, and delete is done in a Server Action (`"use server"`). Never mutate the database from a Server Component, a Client Component, or a route handler. Route handlers are only for external consumers such as webhooks.
- Put actions in a colocated `actions.ts` file with `"use server"` at the top (e.g. `src/app/notes/actions.ts`), and have them call data-access functions in `src/lib/`. Don't define `"use server"` inline inside components.
- Call actions from Client Components with a typed argument (event handlers, `useTransition`, or `useActionState`), not from `<form action>`.
- After a mutation, invalidate with `revalidatePath` / `revalidateTag` / `updateTag` as the Next.js rule describes.
- Actions must authenticate and enforce ownership as the auth rule describes, and are never to trust the client for identity.

## Validation with zod

- All data validation uses zod (`import { z } from "zod"`). Do not hand-write validation or use another validation library. If `zod` is not installed, add it with `npm install zod`.
- Define each schema once, next to the code that owns it, and derive the TypeScript type from it with `z.infer<typeof schema>`. Don't declare the type separately.
- Validate data at every boundary: Server Action inputs, route handler bodies and params, `fetch` responses from external services, and environment variables.
- Use `safeParse` and handle failure explicitly. Don't let a `ZodError` escape as an unhandled throw.
- Keep client-side validation (for UX) on the same schema, but the server-side parse is the one that counts.

## Server Action inputs

- Every Server Action takes typed parameters, and the type is `z.infer` of a zod schema. **Never use `FormData` as a parameter type**, and don't read values with `formData.get(...)`.
- Treat the argument as `unknown` at runtime: the first step in every action is `schema.safeParse(input)`, and nothing touches the database before it succeeds. A TypeScript type alone does not validate anything at runtime.
- Don't pass `userId` through the action's input (see the auth rule). Get it from `auth()` inside the action.
- Return a discriminated union rather than throwing for expected failures, for example `{ ok: true; data } | { ok: false; error }`, with field errors from zod (`z.flattenError`) where they help the UI.

```ts
"use server";

import { z } from "zod";

const createNoteSchema = z.object({
  knowledgeBaseId: z.number().int().positive(),
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export async function createNote(input: CreateNoteInput) {
  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: z.flattenError(parsed.error) } as const;
  }
  // auth() -> userId, verify ownership, then call the Drizzle data function
}
```
