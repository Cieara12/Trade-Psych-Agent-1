"use client";

import { useActionState } from "react";
import { submitDebrief } from "@/app/actions/debrief";

interface PendingIntention {
  id: string;
  text: string;
}

export function DebriefForm({
  pendingIntention,
}: {
  pendingIntention: PendingIntention | null;
}) {
  const [state, formAction, pending] = useActionState(submitDebrief, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {pendingIntention && (
        <fieldset className="flex flex-col gap-2 rounded border border-black/15 p-4 dark:border-white/20">
          <legend className="px-1 text-sm font-medium">Last time, you said:</legend>
          <p className="italic">&ldquo;{pendingIntention.text}&rdquo;</p>
          <input type="hidden" name="checkedIntentionId" value={pendingIntention.id} />
          <div className="flex gap-4 pt-1 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="intentionKept" value="yes" required />
              Kept it
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="intentionKept" value="no" required />
              Didn&apos;t hold
            </label>
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">What did you trade today?</span>
        <textarea
          name="tradedWhat"
          required
          rows={2}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">How did it feel?</span>
        <textarea
          name="feltHow"
          required
          rows={2}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">What&apos;s the one moment you&apos;d redo?</span>
        <textarea
          name="redoMoment"
          required
          rows={2}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Overall, today was</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="outcome" value="GREEN" required />
            Green
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="outcome" value="RED" required />
            Red
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="outcome" value="FLAT" required />
            Flat
          </label>
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">One thing you&apos;ll do differently next session</span>
        <textarea
          name="nextIntention"
          required
          rows={2}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Saving…" : "Finish debrief"}
      </button>
    </form>
  );
}
