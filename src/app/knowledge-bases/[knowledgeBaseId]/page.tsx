import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import {
  getKnowledgeBaseByUser,
  getNotesByKnowledgeBase,
} from "@/lib/knowledge-bases";

export const metadata: Metadata = {
  title: "Knowledge base",
};

const knowledgeBaseIdSchema = z.coerce.number().int().positive();

async function KnowledgeBaseDetail({
  params,
}: Pick<PageProps<"/knowledge-bases/[knowledgeBaseId]">, "params">) {
  const { knowledgeBaseId } = await params;

  // Redirects signed-out users to the sign-in URL.
  const { userId } = await auth.protect();

  const parsedId = knowledgeBaseIdSchema.safeParse(knowledgeBaseId);
  if (!parsedId.success) notFound();

  const [knowledgeBase, notes] = await Promise.all([
    getKnowledgeBaseByUser(userId, parsedId.data),
    getNotesByKnowledgeBase(userId, parsedId.data),
  ]);

  // Other users' knowledge bases behave exactly like missing ones.
  if (!knowledgeBase) notFound();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">
        {knowledgeBase.name}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Created {knowledgeBase.createdAt.toLocaleDateString("en-US")} ·{" "}
        {notes.length} {notes.length === 1 ? "note" : "notes"}
      </p>
      <section className="mt-8">
        {notes.length === 0 ? (
          <p className="text-muted-foreground">
            This knowledge base doesn&apos;t have any notes yet.
          </p>
        ) : (
          <ul className="grid gap-4">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-lg border border-border bg-card p-4 text-card-foreground"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-medium">{note.question}</h2>
                  {note.difficulty && (
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                      {note.difficulty}
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {note.answer}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function KnowledgeBasePage(
  props: PageProps<"/knowledge-bases/[knowledgeBaseId]">,
) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <Link
        href="/dashboard"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        ← Back to dashboard
      </Link>
      <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
        <KnowledgeBaseDetail params={props.params} />
      </Suspense>
    </main>
  );
}
