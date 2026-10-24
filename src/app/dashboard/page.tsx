import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getKnowledgeBasesByUser } from "@/lib/knowledge-bases";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function KnowledgeBaseList() {
  // Redirects signed-out users to the sign-in URL with redirect_url=/dashboard.
  const { userId } = await auth.protect();

  const knowledgeBases = await getKnowledgeBasesByUser(userId);

  if (knowledgeBases.length === 0) {
    return (
      <p className="text-muted-foreground">
        You don&apos;t have any knowledge bases yet.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {knowledgeBases.map((kb) => (
        <li key={kb.id}>
          <Link
            href={`/knowledge-bases/${kb.id}`}
            className="block h-full rounded-lg border border-border bg-card p-4 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h2 className="font-medium">{kb.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Created {kb.createdAt.toLocaleDateString("en-US")}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Your knowledge bases</p>
      <section className="mt-8">
        <Suspense
          fallback={<p className="text-muted-foreground">Loading...</p>}
        >
          <KnowledgeBaseList />
        </Suspense>
      </section>
    </main>
  );
}
