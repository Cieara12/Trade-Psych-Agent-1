import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DebriefForm } from "@/components/DebriefForm";
import { logOut } from "@/app/actions/auth";

export default async function HomePage() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/login");
  }
  const userId = session.userId;

  const latestSession = await prisma.debriefSession.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { nextIntention: { include: { checkIns: true } } },
  });

  const pendingIntention =
    latestSession?.nextIntention && latestSession.nextIntention.checkIns.length === 0
      ? { id: latestSession.nextIntention.id, text: latestSession.nextIntention.text }
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Today&apos;s debrief</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/history" className="underline">
            History
          </Link>
          <form action={logOut}>
            <button type="submit" className="underline">
              Log out
            </button>
          </form>
        </nav>
      </div>
      <DebriefForm pendingIntention={pendingIntention} />
    </main>
  );
}
