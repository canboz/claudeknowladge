import { z } from "zod";

// Shared by the edit form (client-side UX) and the Server Action (the check that counts).
export const noteQuestionSchema = z.string().trim().min(1, "Question is required");
export const noteAnswerSchema = z.string().trim().min(1, "Answer is required");
