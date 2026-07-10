import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const OUTCOME_LABEL: Record<string, string> = {
  GREEN: "Green",
  RED: "Red",
  FLAT: "Flat",
};

export default async function HistoryPage() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/login");
  }

  const sessions = await prisma.debriefSession.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { patterns: true, nextIntention: true },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">History</h1>
        <Link href="/" className="underline">
          Back home
        </Link>
      </div>

      {sessions.length === 0 && (
        <p className="text-black/60 dark:text-white/60">No debriefs yet.</p>
      )}

      <ul className="flex flex-col gap-6">
        {sessions.map((s) => (
          <li key={s.id} className="rounded border border-black/15 p-4 dark:border-white/20">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
              <span>{s.createdAt.toLocaleDateString()}</span>
              <span>{OUTCOME_LABEL[s.outcome]}</span>
            </div>
            <p className="pt-2">
              <span className="font-medium">Redo moment: </span>
              {s.redoMoment}
            </p>
            {s.patterns.length > 0 && (
              <p className="pt-2 text-sm text-black/70 dark:text-white/70">
                {s.patterns.map((p) => p.description).join(" ")}
              </p>
            )}
            {s.nextIntention && (
              <p className="pt-2 text-sm">
                <span className="font-medium">Next intention: </span>
                {s.nextIntention.text}
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
