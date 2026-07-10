"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { detectRecurringPattern } from "@/lib/patternAgent";

const debriefSchema = z.object({
  tradedWhat: z.string().trim().min(1, "Tell me what you traded."),
  feltHow: z.string().trim().min(1, "Tell me how it felt."),
  redoMoment: z.string().trim().min(1, "Name the one moment you'd redo."),
  outcome: z.enum(["GREEN", "RED", "FLAT"]),
  nextIntention: z.string().trim().min(1, "Set one intention for next time."),
  checkedIntentionId: z.string().optional(),
  intentionKept: z.enum(["yes", "no"]).optional(),
});

export type DebriefActionState = { error: string } | null;

const RECURRING_PATTERN_MIN_PRIOR_SESSIONS = 2;
const RECURRING_PATTERN_LOOKBACK = 10;

export async function submitDebrief(
  _prevState: DebriefActionState,
  formData: FormData
): Promise<DebriefActionState> {
  const userId = await requireUserId();

  const parsed = debriefSchema.safeParse({
    tradedWhat: formData.get("tradedWhat"),
    feltHow: formData.get("feltHow"),
    redoMoment: formData.get("redoMoment"),
    outcome: formData.get("outcome"),
    nextIntention: formData.get("nextIntention"),
    checkedIntentionId: formData.get("checkedIntentionId") || undefined,
    intentionKept: formData.get("intentionKept") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  // Verify the intention being checked in on actually belongs to this user
  // and hasn't already been checked in, before trusting the client's answer.
  let checkedIntention: { id: string; text: string } | null = null;
  if (data.checkedIntentionId) {
    checkedIntention = await prisma.intention.findFirst({
      where: {
        id: data.checkedIntentionId,
        userId,
        checkIns: { none: {} },
      },
      select: { id: true, text: true },
    });
  }

  const session = await prisma.debriefSession.create({
    data: {
      userId,
      tradedWhat: data.tradedWhat,
      feltHow: data.feltHow,
      redoMoment: data.redoMoment,
      outcome: data.outcome,
      checkedIntentionId: checkedIntention ? checkedIntention.id : null,
      intentionKept: checkedIntention ? data.intentionKept === "yes" : null,
    },
  });

  await prisma.intention.create({
    data: {
      userId,
      text: data.nextIntention,
      originSessionId: session.id,
    },
  });

  const sessionCount = await prisma.debriefSession.count({ where: { userId } });

  // Deterministic contradiction: the trader themselves just told us they
  // broke an intention they stated in their own words. No inference
  // required, so no false-positive risk — surface it directly.
  if (checkedIntention && data.intentionKept === "no") {
    await prisma.pattern.create({
      data: {
        userId,
        type: "CONTRADICTION",
        sourceQuote: checkedIntention.text,
        description: `Last time, you said: "${checkedIntention.text}." That didn't hold today.`,
        surfacedInSessionId: session.id,
      },
    });
  } else if (sessionCount > RECURRING_PATTERN_MIN_PRIOR_SESSIONS) {
    // No same-session contradiction to report — look for a genuine
    // multi-session repeat instead. One callout max per session, so this
    // only runs when the deterministic path above found nothing.
    const priorSessions = await prisma.debriefSession.findMany({
      where: { userId, id: { not: session.id } },
      orderBy: { createdAt: "desc" },
      take: RECURRING_PATTERN_LOOKBACK,
      select: {
        createdAt: true,
        tradedWhat: true,
        feltHow: true,
        redoMoment: true,
        outcome: true,
      },
    });
    const dismissed = await prisma.pattern.findMany({
      where: { userId, status: "DISMISSED" },
      select: { description: true },
    });

    const pattern = await detectRecurringPattern(
      priorSessions.reverse().map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
      dismissed
    );

    if (pattern) {
      await prisma.pattern.create({
        data: {
          userId,
          type: pattern.type,
          sourceQuote: pattern.sourceQuote,
          description: pattern.description,
          surfacedInSessionId: session.id,
        },
      });
    }
  }

  redirect(`/debrief/${session.id}`);
}
