import Anthropic from "@anthropic-ai/sdk";

export type PatternType = "CONTRADICTION" | "REPEATED_BEHAVIOR" | "EMOTIONAL_TRIGGER";

export interface DetectedPattern {
  type: PatternType;
  sourceQuote: string;
  description: string;
}

export interface PriorSessionSummary {
  createdAt: string;
  tradedWhat: string;
  feltHow: string;
  redoMoment: string;
  outcome: string;
}

export interface DismissedPattern {
  description: string;
}

/**
 * Looks for a REPEATED_BEHAVIOR or EMOTIONAL_TRIGGER pattern across a
 * trader's recent debrief history. Deliberately does NOT handle
 * CONTRADICTION — that's detected deterministically in the caller from the
 * trader's own yes/no answer on whether they kept their last intention,
 * since that requires no inference and carries no false-positive risk.
 *
 * Only called once at least 2 prior sessions exist, so a "repeat" is a
 * genuine second occurrence rather than a single data point.
 */
export async function detectRecurringPattern(
  priorSessions: PriorSessionSummary[],
  dismissedPatterns: DismissedPattern[]
): Promise<DetectedPattern | null> {
  if (priorSessions.length < 2) return null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  const reportTool: Anthropic.Tool = {
    name: "report_pattern",
    description:
      "Report whether a genuine recurring pattern was found in the trader's debrief history.",
    input_schema: {
      type: "object",
      properties: {
        found: {
          type: "boolean",
          description: "True only if you are confident a real recurring pattern exists.",
        },
        type: {
          type: "string",
          enum: ["REPEATED_BEHAVIOR", "EMOTIONAL_TRIGGER"],
        },
        sourceQuote: {
          type: "string",
          description:
            "A short direct quote (or close paraphrase) of the trader's own words from the sessions where this recurred. Do not editorialize.",
        },
        description: {
          type: "string",
          description:
            "One sentence, phrased as a question to the trader, e.g. 'Is this the same setup as last Tuesday, or different?' Quote their own words rather than labeling their character.",
        },
      },
      required: ["found"],
    },
  };

  const sessionsText = priorSessions
    .map(
      (s, i) =>
        `Session ${i + 1} (${s.createdAt}, outcome: ${s.outcome}):\n` +
        `  Traded: ${s.tradedWhat}\n  Felt: ${s.feltHow}\n  Redo moment: ${s.redoMoment}`
    )
    .join("\n\n");

  const dismissedText = dismissedPatterns.length
    ? `\n\nThe trader has already dismissed these observations. Do NOT raise them again in any form:\n` +
      dismissedPatterns.map((d) => `- ${d.description}`).join("\n")
    : "";

  const system = `You are a pattern-memory module inside a trading psychology debrief agent. Your only job is to notice genuine, repeated behaviors or feeling-to-action links across a trader's session history, and phrase them cautiously.

Rules, non-negotiable:
- Only report "found: true" if the same behavior or feeling->action link appears in at least TWO separate prior sessions. A single instance is never enough.
- Never comment on trading strategy, position sizing as a strategy choice, or predict market outcomes. You are a mirror, not an analyst.
- Quote the trader's own words in sourceQuote. Do not psychoanalyze or label their character (never say things like "you tend to be greedy").
- Phrase the description as an open question the trader can confirm or reject, not a verdict.
- Prefer silence over a shaky pattern. If you are not confident, set found to false. A wrong callout destroys trust; a missed one costs nothing.
- Never repeat a pattern the trader has already dismissed, even in a reworded form.`;

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system,
    messages: [
      {
        role: "user",
        content: `Here is this trader's recent debrief history, oldest first:\n\n${sessionsText}${dismissedText}\n\nUse the report_pattern tool to report your finding.`,
      },
    ],
    tools: [reportTool],
    tool_choice: { type: "tool", name: "report_pattern" },
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) return null;

  const input = toolUse.input as {
    found: boolean;
    type?: PatternType;
    sourceQuote?: string;
    description?: string;
  };

  if (!input.found || !input.type || !input.sourceQuote || !input.description) {
    return null;
  }

  return {
    type: input.type,
    sourceQuote: input.sourceQuote,
    description: input.description,
  };
}
