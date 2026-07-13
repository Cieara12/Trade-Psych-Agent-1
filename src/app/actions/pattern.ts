"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function respondToPattern(patternId: string, status: "CONFIRMED" | "DISMISSED") {
  const userId = await requireUserId();

  // Scope the update to this user so one trader can't touch another's
  // pattern by guessing an id.
  await prisma.pattern.updateMany({
    where: { id: patternId, userId },
    data: { status },
  });

  revalidatePath("/debrief");
}
