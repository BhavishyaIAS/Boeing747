# Bhavishya IAS — Backend API Reference (Phase 7)

**Document:** Phase 7 Deliverable
**Version:** 1.0
**Status:** Draft — Awaiting Approval
**Depends on:** `docs/02-architecture.md`, `docs/03-database.md`, `docs/06-folder-structure.md`
**Last Updated:** 2026-07-04

> The first code phase. This documents the scaffolded backend: the Prisma schema,
> the `lib`/`server` infrastructure, and two complete vertical API slices
> (**Syllabus read**, **Content CRUD + workflow**). Auth wiring is Phase 8; until
> then a dev actor header exercises the API (see §5).

---

## 1. What shipped

```
prisma/
  schema.prisma            45 models + 21 enums (validated)
  migrations/0000_init/    generated DDL (1016 lines)
  sql/001_search.sql       tsvector columns + GIN indexes (FTS)
  sql/002_leaderboard.sql  ranked matview
  seed.ts                  RBAC + exam + super admin + sample syllabus
src/
  lib/          db, env (Zod), text utils
  server/       errors, context, authorize (RBAC), audit, api helpers, auth-context
  modules/
    identity/   permission catalogue + role→permission matrix
    workflow/   lifecycle state machine (pure)
    taxonomy/   syllabus read: dto · repository · service
    content/    content CRUD + workflow: dto · repository · service
  app/api/v1/   route handlers for both slices
```

**Verification:** `prisma validate` ✓ · `tsc --noEmit` ✓ · `vitest` ✓ (27 tests:
state machine, authorization, taxonomy service, content service). Tests mock the
repository layer — no database required (per Phase 7 decision).

---

## 2. Conventions

- **Base path:** `/api/v1`. Versioned so future clients bind to a stable contract.
- **Envelope:** every response is `{ data, error, meta }`.
  - Success: `{ "data": <payload>, "error": null, "meta": { "nextCursor": ... } | null }`
  - Failure: `{ "data": null, "error": { "code", "message", "details" } }`
- **Errors** (typed taxonomy → HTTP): `VALIDATION` 422 · `UNAUTHORIZED` 401 ·
  `FORBIDDEN` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `RATE_LIMITED` 429 ·
  `INTERNAL` 500. Internals are never leaked.
- **Exam scope:** scoped endpoints require an exam via `?exam=<uuid>` or the
  `x-exam-id` header (422 if absent). Cross-exam access returns 404 (no existence leak).
- **Pagination:** cursor-based. Lists return `meta.nextCursor`; pass it back as
  `?cursor=`.
- **Validation:** Zod at every boundary; failures return `422` with a flattened
  field map in `error.details`.
- **AuthZ:** enforced in the service layer via `authorize(actor, permission, { examId })`
  — never in the route handler or client.

---

## 3. Endpoints

### 3.1 Syllabus (read) — `syllabus:read`

#### `GET /api/v1/syllabus?exam=<uuid>&parent=<uuid?>`
Lists top-level subjects, or the children of `parent`. Returns `NodeDto[]`:
```json
{ "data": [
  { "id": "…", "type": "SUBJECT", "title": "Polity", "slug": "polity",
    "summary": null, "orderIndex": 0, "examAngle": null, "hasChildren": true }
], "error": null, "meta": null }
```

#### `GET /api/v1/syllabus/:slug?exam=<uuid>`
A single node with breadcrumb + immediate children (`NodeDetailDto`):
```json
{ "data": {
  "id": "…", "type": "THEME", "title": "Fundamental Rights", "slug": "fundamental-rights",
  "hasChildren": true,
  "breadcrumb": [ { "id": "…", "title": "Polity", "slug": "polity" }, … ],
  "children": [ … NodeDto … ]
}, "error": null }
```
`404` if the slug does not exist in the exam.

### 3.2 Content (CRUD + workflow)

#### `GET /api/v1/content?exam=<uuid>&type=<ContentType?>&cursor=<uuid?>&limit=20`
Lists **PUBLISHED** content for the exam. Requires `content:read`.
`meta.nextCursor` continues the page.

#### `POST /api/v1/content?exam=<uuid>` — `content:create`
Creates a DRAFT item + version 1. Body:
```json
{ "type": "NOTE", "title": "Right to Life",
  "slug": "right-to-life",            // optional; derived from title otherwise
  "difficulty": "MEDIUM",             // optional
  "body": { "type": "doc", "content": [ … ] },  // TipTap JSON
  "changeNote": "initial draft",      // optional
  "nodeIds": ["<syllabus-node-uuid>"] // optional; linked as PRIMARY
}
```
`201` with the created item. Slug collisions within `(exam, type)` → `409`.
Reading time is derived from the body's plain text.

#### `GET /api/v1/content/:id?exam=<uuid>` — `content:read`
Returns one item. Students see only `PUBLISHED`; holders of `content:update`
also see drafts. Anything else (including another exam) → `404`.

#### `POST /api/v1/content/:id/transition?exam=<uuid>`
Drives the editorial state machine. Body:
```json
{ "action": "SUBMIT" | "APPROVE" | "REQUEST_CHANGES" | "REJECT" | "PUBLISH" | "ARCHIVE" | "REVISE",
  "comment": "optional reviewer note" }
```
- Permission per action: `SUBMIT`→`content:submit`, `APPROVE|REQUEST_CHANGES|REJECT`→`content:review`,
  `PUBLISH`→`content:publish`, `ARCHIVE`→`content:archive`, `REVISE`→`content:update`.
- **Separation of duties:** a reviewer cannot review their own content → `403`.
- Illegal transitions → `409`; publishing without a version → `409`.
- Review actions record a `content_review`; every transition writes an audit log.

**Lifecycle:** `DRAFT →(submit) IN_REVIEW →(approve) APPROVED →(publish) PUBLISHED`;
`IN_REVIEW/APPROVED →(request_changes) DRAFT`; `IN_REVIEW →(reject) ARCHIVED`;
`PUBLISHED/APPROVED/DRAFT →(archive) ARCHIVED`; `ARCHIVED/PUBLISHED →(revise) DRAFT`.

---

## 4. Error examples

```jsonc
// 422 — validation
{ "data": null, "error": { "code": "VALIDATION", "message": "Validation failed",
  "details": { "fieldErrors": { "title": ["String must contain at least 3 character(s)"] } } } }

// 403 — separation of duties
{ "data": null, "error": { "code": "FORBIDDEN",
  "message": "You cannot review your own content", "details": null } }

// 409 — illegal transition
{ "data": null, "error": { "code": "CONFLICT",
  "message": "Cannot PUBLISH content in state DRAFT", "details": null } }
```

---

## 5. Running locally (until Phase 8 auth)

```bash
pnpm install
cp .env.example .env.local           # set DATABASE_URL, REDIS_URL, …
pnpm prisma:migrate                  # apply migration + generate client
psql "$DATABASE_URL" -f prisma/sql/001_search.sql
psql "$DATABASE_URL" -f prisma/sql/002_leaderboard.sql
pnpm db:seed                         # RBAC, exam, super admin, sample syllabus
pnpm dev
```

In **non-production**, requests may carry an `x-dev-actor` header to stand in for a
session (production disables this — a missing session is always `401`):
```bash
curl 'http://localhost:3000/api/v1/syllabus?exam=<EXAM_UUID>' \
  -H 'x-dev-actor: {"userId":"<UUID>","email":"a@b.c","roles":[{"role":"SUPER_ADMIN","examId":null}]}'
```

> A machine-readable OpenAPI document is generated in a later step; this reference
> is the human-facing contract for the Phase 7 surface.

---

## 6. Phase 7 Exit Criteria

- Approval of: the realized Prisma schema + migration strategy, the `lib`/`server`
  infrastructure (errors, envelope, RBAC guard, audit, exam scoping), and the two
  vertical slices with their tests.
- On approval → **Phase 8: Authentication** — wire Auth.js (email/password +
  Google + email OTP), replace the dev-actor shim with real sessions, and map
  sessions to the `Actor` used by `authorize()`.

**Approval:** _Pending stakeholder review._
