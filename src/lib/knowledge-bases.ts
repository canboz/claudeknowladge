import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { knowledgeBasesTable } from "@/lib/db/schema";

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
