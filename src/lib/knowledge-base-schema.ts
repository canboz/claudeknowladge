import { z } from "zod";

// Shared by the edit form (client-side UX) and the Server Action (the check that counts).
export const knowledgeBaseNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(255, "Name must be 255 characters or fewer");
