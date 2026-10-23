import { defineRelations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// No users table: Clerk is the source of truth, so `userId` stores the Clerk user ID.
export const knowledgeBasesTable = pgTable(
  "knowledge_bases",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [index("knowledge_bases_user_id_idx").on(table.userId)],
);

export const notesTable = pgTable(
  "notes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    knowledgeBaseId: integer()
      .notNull()
      .references(() => knowledgeBasesTable.id, { onDelete: "cascade" }),
    question: text().notNull(),
    answer: text().notNull(),
    tags: text().array(),
    difficulty: difficultyEnum(),
    ...timestamps,
  },
  (table) => [index("notes_knowledge_base_id_idx").on(table.knowledgeBaseId)],
);

export const relations = defineRelations(
  { knowledgeBasesTable, notesTable },
  (r) => ({
    knowledgeBasesTable: {
      notes: r.many.notesTable(),
    },
    notesTable: {
      knowledgeBase: r.one.knowledgeBasesTable({
        from: r.notesTable.knowledgeBaseId,
        to: r.knowledgeBasesTable.id,
      }),
    },
  }),
);
