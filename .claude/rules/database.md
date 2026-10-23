---
description: Database access must go through the Drizzle schema and Drizzle queries (Neon + Drizzle ORM)
paths:
  - "src/lib/**"
  - "src/app/**"
  - "drizzle.config.ts"
---

# Database (Drizzle + Neon)

Every database interaction must use the Drizzle schema and Drizzle queries. The schema in `src/lib/db/schema.ts` is the single source of truth for tables, columns, enums, and relations.

## Queries

- Import the client from `@/lib/db` (`db`) and the tables from `@/lib/db/schema`. Never create a second client or connection.
- Build queries with Drizzle's query builder (`db.select().from(...)`, `db.insert(...)`, `db.update(...)`, `db.delete(...)`) or the relational API (`db.query.*`) with operators from `drizzle-orm` (`eq`, `and`, `inArray`, ...).
- Do not write raw SQL strings, and do not use the Neon driver (`@neondatabase/serverless`) directly to run queries. If Drizzle genuinely cannot express something, use the `sql` template tag from `drizzle-orm` for that fragment only, keep it parameterized, and add a short comment explaining why.
- Never interpolate user input into SQL. Pass values through Drizzle operators or `sql` template parameters.
- Select only the columns you need; scope queries by the authenticated Clerk user where the data is user-owned.
- Wrap multi-step writes that must succeed together in a transaction, if the driver in use supports it.

## Types

- Derive row types from the schema (`typeof table.$inferSelect`, `typeof table.$inferInsert`). Do not hand-write types that duplicate a table's shape.

## Schema changes

- Change the database only by editing `src/lib/db/schema.ts` and then running `drizzle-kit` (`push` during development, `generate` + `migrate` for tracked migrations). Never alter tables with hand-written SQL or in the Neon console.
- Never edit generated files in `drizzle/` by hand.
- Schema changes that drop or rename columns/tables, or change types, can lose data: confirm with the user before running `push` or `migrate`.

## Placement

- Keep data-access functions in `src/lib/` (grouped by domain, e.g. `lib/notes.ts`) and import `server-only` in them. Never import `db` into a Client Component.
- Read `DATABASE_URL` only in `drizzle.config.ts` and `src/lib/db/index.ts`.
