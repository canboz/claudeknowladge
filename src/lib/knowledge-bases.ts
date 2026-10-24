import "server-only";

import { and, desc, eq } from "drizzle-orm";
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
