"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { knowledgeBaseNameSchema } from "@/lib/knowledge-base-schema";
import {
  deleteNoteByUser,
  updateKnowledgeBaseName,
  updateNoteByUser,
} from "@/lib/knowledge-bases";
import { noteAnswerSchema, noteQuestionSchema } from "@/lib/note-schema";

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

const updateNoteSchema = z.object({
  noteId: z.number().int().positive(),
  question: noteQuestionSchema,
  answer: noteAnswerSchema,
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export type UpdateNoteResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: { question?: string[]; answer?: string[] };
    };

export async function updateNote(
  input: UpdateNoteInput,
): Promise<UpdateNoteResult> {
  const parsed = updateNoteSchema.safeParse(input);
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
    const updated = await updateNoteByUser(userId, parsed.data.noteId, {
      question: parsed.data.question,
      answer: parsed.data.answer,
    });
    // Other users' notes behave exactly like missing ones.
    if (!updated) return { ok: false, error: "Note not found" };

    revalidatePath(`/knowledge-bases/${updated.knowledgeBaseId}`);
  } catch {
    return { ok: false, error: "Failed to update the note" };
  }

  return { ok: true };
}

const deleteNoteSchema = z.object({
  noteId: z.number().int().positive(),
});

export type DeleteNoteInput = z.infer<typeof deleteNoteSchema>;

export type DeleteNoteResult = { ok: true } | { ok: false; error: string };

export async function deleteNote(
  input: DeleteNoteInput,
): Promise<DeleteNoteResult> {
  const parsed = deleteNoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You must be signed in" };

  try {
    const deleted = await deleteNoteByUser(userId, parsed.data.noteId);
    if (!deleted) return { ok: false, error: "Note not found" };

    revalidatePath(`/knowledge-bases/${deleted.knowledgeBaseId}`);
  } catch {
    return { ok: false, error: "Failed to delete the note" };
  }

  return { ok: true };
}
