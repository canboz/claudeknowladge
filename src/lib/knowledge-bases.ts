import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { knowledgeBasesTable, notesTable } from "@/lib/db/schema";

export async function getKnowledgeBaseByUser(
  userId: string,
  knowledgeBaseId: number,
) {
  const [knowledgeBase] = await db
    .select({
      id: knowledgeBasesTable.id,
      name: knowledgeBasesTable.name,
      createdAt: knowledgeBasesTable.createdAt,
    })
    .from(knowledgeBasesTable)
    .where(
      and(
        eq(knowledgeBasesTable.id, knowledgeBaseId),
        eq(knowledgeBasesTable.userId, userId),
      ),
    );

  return knowledgeBase ?? null;
}

export async function getNotesByKnowledgeBase(
  userId: string,
  knowledgeBaseId: number,
) {
  return db
    .select({
      id: notesTable.id,
      question: notesTable.question,
      answer: notesTable.answer,
      tags: notesTable.tags,
      difficulty: notesTable.difficulty,
    })
    .from(notesTable)
    .innerJoin(
      knowledgeBasesTable,
      eq(notesTable.knowledgeBaseId, knowledgeBasesTable.id),
    )
    .where(
      and(
        eq(notesTable.knowledgeBaseId, knowledgeBaseId),
        eq(knowledgeBasesTable.userId, userId),
      ),
    )
    .orderBy(desc(notesTable.createdAt));
}

export async function getKnowledgeBasesByUser(userId: string) {
  return db
    .select({
      id: knowledgeBasesTable.id,
      name: knowledgeBasesTable.name,
      createdAt: knowledgeBasesTable.createdAt,
    })
    .from(knowledgeBasesTable)
    .where(eq(knowledgeBasesTable.userId, userId))
    .orderBy(desc(knowledgeBasesTable.createdAt));
}

export async function updateKnowledgeBaseName(
  userId: string,
  knowledgeBaseId: number,
  name: string,
) {
  const [updated] = await db
    .update(knowledgeBasesTable)
    .set({ name })
    .where(
      and(
        eq(knowledgeBasesTable.id, knowledgeBaseId),
        eq(knowledgeBasesTable.userId, userId),
      ),
    )
    .returning({ id: knowledgeBasesTable.id });

  return updated ?? null;
}

// Returns null when the knowledge base doesn't exist or belongs to someone else.
export async function createNoteByUser(
  userId: string,
  knowledgeBaseId: number,
  values: { question: string; answer: string },
) {
  const knowledgeBase = await getKnowledgeBaseByUser(userId, knowledgeBaseId);
  if (!knowledgeBase) return null;

  const [created] = await db
    .insert(notesTable)
    .values({ knowledgeBaseId: knowledgeBase.id, ...values })
    .returning({ id: notesTable.id });

  return created ?? null;
}

// notesTable has no userId, so ownership is checked through the knowledge base.
export async function updateNoteByUser(
  userId: string,
  noteId: number,
  values: { question: string; answer: string },
) {
  const [updated] = await db
    .update(notesTable)
    .set(values)
    .where(
      and(
        eq(notesTable.id, noteId),
        inArray(
          notesTable.knowledgeBaseId,
          db
            .select({ id: knowledgeBasesTable.id })
            .from(knowledgeBasesTable)
            .where(eq(knowledgeBasesTable.userId, userId)),
        ),
      ),
    )
    .returning({
      id: notesTable.id,
      knowledgeBaseId: notesTable.knowledgeBaseId,
    });

  return updated ?? null;
}

export async function deleteNoteByUser(userId: string, noteId: number) {
  const [deleted] = await db
    .delete(notesTable)
    .where(
      and(
        eq(notesTable.id, noteId),
        inArray(
          notesTable.knowledgeBaseId,
          db
            .select({ id: knowledgeBasesTable.id })
            .from(knowledgeBasesTable)
            .where(eq(knowledgeBasesTable.userId, userId)),
        ),
      ),
    )
    .returning({
      id: notesTable.id,
      knowledgeBaseId: notesTable.knowledgeBaseId,
    });

  return deleted ?? null;
}
