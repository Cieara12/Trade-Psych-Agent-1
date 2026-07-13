# Trade Psych Agent

A daily debrief for intraday day-traders. After each session, you answer a
few short prompts about what you traded, how it felt, and the one moment
you'd redo. The agent remembers your prior sessions — and calls out when
you repeat a mistake or break an intention you set yourself.

## v0 scope

- **Audience:** daily intraday day-traders (a session most days = enough
  data for cross-session memory to mean something).
- **Loop:** post-session debrief → agent checks in on your last intention →
  you set one new intention → repeat tomorrow.
- **Pattern memory** is the product's core differentiator:
  - *Contradiction* — you said you'd do something and told us yourself it
    didn't hold. Detected deterministically from your own kept/broke
    answer, no LLM guessing involved.
  - *Repeated behavior* / *emotional trigger* — a recurring theme across
    2+ sessions, detected by an LLM call that only fires once there's
    enough history to make a real comparison, quotes your own words back
    to you, and never re-raises anything you've dismissed.
  - At most one callout per session.
- **Explicitly out of scope for v0:** broker/trade-data integration,
  real-time alerts, payment wall, dashboards/analytics.
- **Success metric:** Day-7 return rate — % of users completing a debrief
  on 4+ separate days in their first week.

## Stack

Next.js (App Router) + TypeScript + Tailwind, Prisma with SQLite for local
dev, session auth via signed cookies (`iron-session`), and the Claude API
for pattern detection.

## Running locally

```bash
npm install
npx prisma migrate deploy   # creates dev.db
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000), sign up, and run
through a debrief. Set `ANTHROPIC_API_KEY` in `.env` to enable
recurring-pattern detection (contradiction detection works without it,
since it's rule-based).

Env vars (see `.env`):

- `DATABASE_URL` — SQLite file path, defaults to `file:./dev.db`.
- `SESSION_SECRET` — signs the session cookie; set a real secret in
  production.
- `ANTHROPIC_API_KEY` — required for the recurring-pattern agent call.
