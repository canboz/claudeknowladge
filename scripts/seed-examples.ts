// Usage: npx tsx scripts/seed-examples.ts <clerk_user_id>
// Inserts two example knowledge bases (with notes) owned by the given Clerk user.
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";

config({ path: ".env.local" });

type NoteInsert = Omit<
  typeof import("../src/lib/db/schema").notesTable.$inferInsert,
  "knowledgeBaseId"
>;

const javascriptNotes: NoteInsert[] = [
  { question: "What is the difference between let and const?", answer: "let allows reassignment, while const cannot be reassigned.", tags: ["variables"], difficulty: "easy" },
  { question: "What is the difference between var and let?", answer: "var is function-scoped and hoisted with an undefined value; let is block-scoped and cannot be used before its declaration.", tags: ["variables", "scope"], difficulty: "easy" },
  { question: "What are the primitive data types in JavaScript?", answer: "string, number, bigint, boolean, undefined, null, symbol.", tags: ["types"], difficulty: "easy" },
  { question: "What is the difference between == and ===?", answer: "== compares values after type coercion, while === compares both value and type without coercion.", tags: ["operators"], difficulty: "easy" },
  { question: "What does typeof null return?", answer: "\"object\". This is a long-standing quirk of the language.", tags: ["types"], difficulty: "medium" },
  { question: "What is an array?", answer: "An ordered list of values, accessed by a zero-based index, e.g. [1, 2, 3].", tags: ["arrays"], difficulty: "easy" },
  { question: "What does the map() method do?", answer: "It creates a new array by applying a function to every element of the original array.", tags: ["arrays", "methods"], difficulty: "easy" },
  { question: "What does the filter() method do?", answer: "It creates a new array containing only the elements for which the callback returns true.", tags: ["arrays", "methods"], difficulty: "easy" },
  { question: "What is a function?", answer: "A reusable block of code that can take inputs (parameters) and return a value.", tags: ["functions"], difficulty: "easy" },
  { question: "What is an arrow function?", answer: "A shorter function syntax, (a, b) => a + b, that does not have its own this binding.", tags: ["functions", "es6"], difficulty: "easy" },
  { question: "What is an object?", answer: "A collection of key-value pairs, e.g. { name: \"Ada\", age: 30 }.", tags: ["objects"], difficulty: "easy" },
  { question: "What is a template literal?", answer: "A string wrapped in backticks that supports embedded expressions with ${} and multi-line text.", tags: ["strings", "es6"], difficulty: "easy" },
  { question: "What is a closure?", answer: "A function that remembers the variables from the scope where it was created, even after that scope has finished running.", tags: ["functions", "scope"], difficulty: "medium" },
  { question: "What is a Promise?", answer: "An object representing the eventual completion (or failure) of an asynchronous operation and its resulting value.", tags: ["async"], difficulty: "medium" },
  { question: "What does async/await do?", answer: "It lets you write Promise-based asynchronous code in a synchronous-looking style; await pauses an async function until the Promise settles.", tags: ["async"], difficulty: "medium" },
];

const vocabularyNotes: NoteInsert[] = [
  { question: "What does \"achievement\" mean?", answer: "Something successfully completed through effort, skill, or courage.", tags: ["nouns"], difficulty: "easy" },
  { question: "What does \"abundant\" mean?", answer: "Existing in large quantities; more than enough.", tags: ["adjectives"], difficulty: "easy" },
  { question: "What does \"curious\" mean?", answer: "Eager to learn or know something.", tags: ["adjectives"], difficulty: "easy" },
  { question: "What does \"reluctant\" mean?", answer: "Unwilling or hesitant to do something.", tags: ["adjectives"], difficulty: "medium" },
  { question: "What does \"generous\" mean?", answer: "Willing to give more of something, such as money or time, than is expected.", tags: ["adjectives"], difficulty: "easy" },
  { question: "What does \"efficient\" mean?", answer: "Achieving results with little wasted time, effort, or resources.", tags: ["adjectives"], difficulty: "easy" },
  { question: "What does \"postpone\" mean?", answer: "To delay something until a later time.", tags: ["verbs"], difficulty: "easy" },
  { question: "What does \"persuade\" mean?", answer: "To convince someone to do or believe something by giving good reasons.", tags: ["verbs"], difficulty: "medium" },
  { question: "What does \"hesitate\" mean?", answer: "To pause before doing something because you are unsure.", tags: ["verbs"], difficulty: "easy" },
  { question: "What does \"significant\" mean?", answer: "Important or large enough to be noticed or to have an effect.", tags: ["adjectives"], difficulty: "medium" },
  { question: "What does \"obstacle\" mean?", answer: "Something that blocks your way or makes progress difficult.", tags: ["nouns"], difficulty: "easy" },
  { question: "What does \"ancient\" mean?", answer: "Belonging to a very distant past; extremely old.", tags: ["adjectives"], difficulty: "easy" },
  { question: "What does \"fragile\" mean?", answer: "Easily broken or damaged.", tags: ["adjectives"], difficulty: "easy" },
  { question: "What does \"ambitious\" mean?", answer: "Having a strong desire to succeed or achieve something big.", tags: ["adjectives"], difficulty: "medium" },
  { question: "What does \"vivid\" mean?", answer: "Producing very clear, strong, and detailed images in the mind; bright and intense.", tags: ["adjectives"], difficulty: "medium" },
];

const seeds = [
  { name: "JavaScript Fundamentals", notes: javascriptNotes },
  { name: "English Vocabulary", notes: vocabularyNotes },
];

async function main() {
  const userId = process.argv[2];
  if (!userId?.startsWith("user_")) {
    throw new Error("Pass the owner's Clerk user ID: tsx scripts/seed-examples.ts user_xxx");
  }

  // Imported after dotenv so src/lib/db reads DATABASE_URL from .env.local.
  const { db } = await import("../src/lib/db");
  const { knowledgeBasesTable, notesTable } = await import("../src/lib/db/schema");

  for (const seed of seeds) {
    const [existing] = await db
      .select({ id: knowledgeBasesTable.id })
      .from(knowledgeBasesTable)
      .where(and(eq(knowledgeBasesTable.userId, userId), eq(knowledgeBasesTable.name, seed.name)));
    if (existing) {
      console.log(`Skipping "${seed.name}": already exists (id ${existing.id})`);
      continue;
    }

    const [kb] = await db
      .insert(knowledgeBasesTable)
      .values({ userId, name: seed.name })
      .returning({ id: knowledgeBasesTable.id });
    if (!kb) throw new Error(`Failed to insert "${seed.name}"`);

    try {
      await db.insert(notesTable).values(seed.notes.map((note) => ({ ...note, knowledgeBaseId: kb.id })));
    } catch (error) {
      // neon-http has no transactions; remove the empty knowledge base (notes cascade).
      await db.delete(knowledgeBasesTable).where(eq(knowledgeBasesTable.id, kb.id));
      throw error;
    }
    console.log(`Inserted "${seed.name}" (id ${kb.id}) with ${seed.notes.length} notes`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
