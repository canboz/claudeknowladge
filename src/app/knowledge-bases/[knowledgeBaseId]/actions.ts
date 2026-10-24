"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { knowledgeBaseNameSchema } from "@/lib/knowledge-base-schema";
import { updateKnowledgeBaseName } from "@/lib/knowledge-bases";

const updateKnowledgeBaseSchema = z.object({
  knowledgeBaseId: z.number().int().positive(),
  name: knowledgeBaseNameSchema,
});

export type UpdateKnowledgeBaseInput = z.infer<
  typeof updateKnowledgeBaseSchema
>;

export type UpdateKnowledgeBaseResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: { name?: string[] } };

export async function updateKnowledgeBase(
  input: UpdateKnowledgeBaseInput,
): Promise<UpdateKnowledgeBaseResult> {
  const parsed = updateKnowledgeBaseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid input",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You must be signed in" };

  try {
    const updated = await updateKnowledgeBaseName(
      userId,
      parsed.data.knowledgeBaseId,
      parsed.data.name,
    );
    // Other users' knowledge bases behave exactly like missing ones.
    if (!updated) return { ok: false, error: "Knowledge base not found" };
  } catch {
    return { ok: false, error: "Failed to update the knowledge base" };
  }

  revalidatePath(`/knowledge-bases/${parsed.data.knowledgeBaseId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
