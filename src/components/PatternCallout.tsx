"use client";

import { useState, useTransition } from "react";
import { respondToPattern } from "@/app/actions/pattern";

const TYPE_LABEL: Record<string, string> = {
  CONTRADICTION: "You said, you did",
  REPEATED_BEHAVIOR: "Noticed a repeat",
  EMOTIONAL_TRIGGER: "Noticed a pattern",
};

export function PatternCallout({
  id,
  type,
  description,
  initialStatus,
}: {
  id: string;
  type: string;
  description: string;
  initialStatus: "SURFACED" | "CONFIRMED" | "DISMISSED";
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const respond = (next: "CONFIRMED" | "DISMISSED") => {
    setStatus(next);
    startTransition(() => {
      respondToPattern(id, next);
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded border border-black/15 p-4 dark:border-white/20">
      <p className="text-xs font-medium uppercase tracking-wide text-black/60 dark:text-white/60">
        {TYPE_LABEL[type] ?? "Noticed something"}
      </p>
      <p>{description}</p>
      {status === "SURFACED" ? (
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            disabled={isPending}
            onClick={() => respond("CONFIRMED")}
            className="rounded border border-black/15 px-3 py-1 dark:border-white/20"
          >
            Yeah, that&apos;s right
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => respond("DISMISSED")}
            className="rounded border border-black/15 px-3 py-1 dark:border-white/20"
          >
            Not really
          </button>
        </div>
      ) : (
        <p className="text-sm text-black/60 dark:text-white/60">
          {status === "CONFIRMED" ? "Marked as accurate." : "Got it, won't raise this one again."}
        </p>
      )}
    </div>
  );
}
