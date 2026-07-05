# Bhavishya IAS — Testing & CI

**Document:** Phase 15 Deliverable
**Last Updated:** 2026-07-05

How the platform is tested and how the suite is gated in CI.

## Strategy (test pyramid)

| Layer | What it covers | Tooling | Location |
|-------|----------------|---------|----------|
| **Unit** | Domain services with **mocked repositories** (authorization, workflow, scheduling, aggregation), pure helpers (state machine, tokens, streak, revision) | Vitest | colocated `*.test.ts` |
| **Component** | The rich-text renderer — structure + **XSS-safety** (HTML escaping, unsafe-link blocking) via server render | Vitest + `react-dom/server` | colocated `*.test.tsx` |
| **Integration** | API **route handlers** end-to-end (envelope shape, status codes, error mapping, validation, exam-scope) with mocked auth + services, real Zod + api helpers | Vitest | `tests/integration/` |

**Why mocked repositories:** services own the business rules (authorization, separation of duties, scoping, scheduling) — testing them against fakes gives fast, deterministic, DB-free coverage of the logic that matters. Repositories are thin Prisma wrappers; they're exercised by the build's type-checking and (in a real environment) by the seed + manual/E2E runs.

## Current coverage (90 tests)

- **Authorization** (`authorize`): role→permission grants, exam scoping, wildcard.
- **Content**: create (slug/reading-time/audit), published-vs-draft visibility,
  cross-exam isolation, lifecycle transitions + **separation of duties**,
  draft-only editing, management listing.
- **Workflow**: full state machine (legal/illegal transitions, action→permission).
- **Identity/Auth**: registration, verification, OTP login, password reset
  (no account enumeration), credential checks, OAuth provisioning; token hashing;
  admin role management (Super-Admin grant guard).
- **Learning**: dashboard aggregation + streak, node-progress + spaced-revision
  scheduler, reading progress (clamp/monotonic), bookmark toggle.
- **PYQ / Current Affairs**: filtering, pagination, authorization, not-found.
- **Renderer**: headings/lists/marks, HTML escaping, unsafe-link blocking.
- **API layer**: envelope helpers, error taxonomy → HTTP mapping, body/query parsing;
  `syllabus` and `content` route contracts (401/422/404/200/201).

## Commands

```bash
pnpm test          # run the whole suite once
pnpm test:watch    # watch mode
pnpm typecheck     # tsc --noEmit
pnpm build         # production build (also type-checks routes)
```

## Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request:

```
install → prisma generate → prisma validate → typecheck → test → build
```

The job uses placeholder env values and never connects to a real database (the
schema/generate steps and the dynamic Next build only require the vars to exist).
`concurrency` cancels superseded runs on the same ref.

## Roadmap

- **E2E** (Playwright, Chromium pre-installed): auth → read → mark-progress →
  attempt, against an ephemeral Postgres.
- **DB integration**: repository tests against a throwaway Postgres (testcontainers).
- **a11y**: axe checks on key pages.
- **Lint**: ESLint flat config with import-boundary rules (Phase 6 §5) wired into CI.
