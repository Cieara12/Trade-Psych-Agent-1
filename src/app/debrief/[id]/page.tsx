import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PatternCallout } from "@/components/PatternCallout";

export default async function DebriefResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session.userId) {
    redirect("/login");
  }

  const debrief = await prisma.debriefSession.findFirst({
    where: { id, userId: session.userId },
    include: { patterns: true, nextIntention: true },
  });
  if (!debrief) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-12">
      <h1 className="text-2xl font-semibold">Debrief saved</h1>

      {debrief.patterns.length > 0 ? (
        debrief.patterns.map((p) => (
          <PatternCallout
            key={p.id}
            id={p.id}
            type={p.type}
            description={p.description}
            initialStatus={p.status}
          />
        ))
      ) : (
        <p className="text-black/60 dark:text-white/60">
          Nothing to flag today &mdash; noted and moving on.
        </p>
      )}

      <div className="rounded border border-black/15 p-4 dark:border-white/20">
        <p className="text-xs font-medium uppercase tracking-wide text-black/60 dark:text-white/60">
          Your intention for next session
        </p>
        <p className="pt-1">{debrief.nextIntention?.text}</p>
      </div>

      <Link href="/" className="underline">
        Back home
      </Link>
    </main>
  );
}
