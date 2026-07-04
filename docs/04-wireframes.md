# Bhavishya IAS — UI/UX Wireframes

**Document:** Phase 4 Deliverable
**Version:** 1.0
**Status:** Draft — Awaiting Approval
**Depends on:** `docs/01-PRD.md`, `docs/02-architecture.md`, `docs/03-database.md`
**Fidelity:** Low-fidelity (layout, hierarchy, flows) — pixels/tokens are Phase 5
**Last Updated:** 2026-07-04

> Wireframes define **structure and flow**, not final visuals. They fix
> information architecture, screen layouts, key states, and the primary user
> journeys so Phase 5 (Design System) and the build phases have a blueprint. A
> companion **interactive visual mockup** accompanies this doc (grey-box
> fidelity). Screen IDs (`W-*`) are referenced downstream.

---

## 1. Information Architecture (sitemap)

```
Bhavishya IAS
├─ Public
│  ├─ Landing (/)
│  ├─ Auth  (/login, /register, /verify, /forgot, /reset)
│  └─ Legal (/privacy, /terms)
│
├─ Student App  (authenticated)
│  ├─ Dashboard            (/app)
│  ├─ Syllabus             (/app/syllabus)            → tree browser
│  │   └─ Node             (/app/syllabus/:slug)      → node hub + content
│  ├─ Read                 (/app/read/:contentSlug)   → note / micro-topic reader
│  ├─ PYQs                 (/app/pyqs)                 → browse + filters
│  │   └─ Question         (/app/pyqs/:id)             → question + model answer
│  ├─ Current Affairs      (/app/current-affairs)
│  ├─ Tests                (/app/tests)
│  │   ├─ Attempt          (/app/tests/:id/attempt)
│  │   └─ Result           (/app/tests/:id/result/:attempt)
│  ├─ Search               (/app/search?q=)
│  ├─ Bookmarks / History  (/app/library)
│  └─ Profile & Settings   (/app/profile)
│
└─ Admin / CMS  (role-gated)
   ├─ Overview             (/admin)
   ├─ Content              (/admin/content)           → list + filters
   │   ├─ Editor           (/admin/content/:id/edit)  → TipTap editor
   │   └─ Review           (/admin/content/:id/review)
   ├─ Syllabus Manager     (/admin/syllabus)
   ├─ PYQ / Questions      (/admin/questions)
   ├─ Tests                (/admin/tests)
   ├─ Current Affairs      (/admin/current-affairs)
   ├─ Media Library        (/admin/media)
   ├─ Users & Roles        (/admin/users)
   └─ Audit Log            (/admin/audit)
```

**Role-gating:** Student sees the Student App. Content Editor/Reviewer see Content
+ their queues. Admin/Super Admin see the full CMS. The `authorize()` guard (Phase
2 §6) hides and blocks accordingly.

---

## 2. Layout Shells

### 2.1 Student app shell (`W-SHELL`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [≡] Bhavishya IAS        [ 🔎 global search…            ⌘K ]   🔔  (RA)│  ← top bar (sticky)
├───────────┬────────────────────────────────────────────────────────────┤
│ SIDEBAR   │  CONTENT AREA                                              │
│ (240px)   │                                                            │
│ ▸ Home    │   … page content renders here …                           │
│ ▸ Syllabus│                                                            │
│ ▸ PYQs    │                                                            │
│ ▸ Current │                                                            │
│ ▸ Tests   │                                                            │
│ ▸ Library │                                                            │
│           │                                                            │
│ ───────   │                                                            │
│ Exam: ▾   │                                                            │
│ Grp-1     │                                                            │
└───────────┴────────────────────────────────────────────────────────────┘
```

- **Top bar:** menu toggle, wordmark, global search (⌘K palette), notifications,
  avatar menu.
- **Left sidebar:** primary nav + **exam switcher** (drives `exam_id` scope).
  Collapses to icons < 1024px; becomes a bottom tab bar / drawer on mobile.
- **Content area:** max reading width ~72ch for text pages; full-width for
  dashboards/tables.

### 2.2 Admin shell (`W-ADMIN-SHELL`)

Same pattern, different nav (Content, Syllabus, Questions, Tests, Users, Audit),
and a **content-status filter rail**. A persistent "role: Admin" indicator.

### 2.3 Responsive rules

| Breakpoint | Behaviour |
|---|---|
| ≥ 1280px | sidebar + content, right-hand ToC/aside where relevant |
| 1024–1280 | sidebar collapses to icons; aside hides behind a toggle |
| 640–1024 | sidebar → drawer; single column |
| < 640px | bottom tab bar (Home/Syllabus/Search/PYQ/Profile); reader is full-bleed |

---

## 3. Screen Wireframes

### W-01 · Landing (public)

```
┌──────────────────────────────────────────────────────────┐
│  Bhavishya IAS                         [Login] [Register] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Towards a Brighter Future                              │
│   India's most comprehensive APPSC Group-1 platform.     │
│   [ Start preparing → ]   [ Explore syllabus ]           │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [Syllabus graph] [PYQ bank] [Model answers] [Tests]     │  ← feature strip
├──────────────────────────────────────────────────────────┤
│  How it works · What's inside · For repeaters · FAQ      │
└──────────────────────────────────────────────────────────┘
```
SEO-critical, SSR. States: default only.

### W-02 · Auth (login / register)  `FR-AUTH-*`

```
┌───────────────────────────────┐
│         Bhavishya IAS         │
│   ┌───────────────────────┐   │
│   │ [ Continue with Google]│   │
│   │ ───────  or  ───────   │   │
│   │ Email    [__________]  │   │
│   │ Password [__________]  │   │
│   │ [ Sign in ]            │   │
│   │ Forgot password?       │   │
│   └───────────────────────┘   │
│   New here? Create account    │
└───────────────────────────────┘
```
States: idle, loading, field errors (Zod), invalid credentials, unverified-email
(→ resend), OTP entry step. Register adds name + confirm; on submit → "verify your
email" screen.

### W-03 · Student Dashboard  `W-DASH` · `FR-DASH-*`

```
┌──────────────────────────────────────────────────────────────┐
│  Good evening, Ravi 👋            streak 🔥 12 days           │
├───────────────────────────┬──────────────────────────────────┤
│  CONTINUE READING          │  THIS WEEK                       │
│  ┌───────────────────────┐ │  Study time   ▓▓▓▓▓░  6h 20m     │
│  │ Fundamental Rights    │ │  Topics read  ▓▓▓░░░  14         │
│  │ …75% · resume →       │ │  Revisions due          8 →      │
│  └───────────────────────┘ │  Accuracy (tests) 68%            │
├───────────────────────────┴──────────────────────────────────┤
│  SYLLABUS COVERAGE (by subject)                               │
│  Polity      ▓▓▓▓▓▓▓░░░ 71%   Economy  ▓▓▓▓░░░░░░ 38%          │
│  History     ▓▓▓▓▓░░░░░ 52%   Geog     ▓▓░░░░░░░░ 19%          │
├───────────────────────────┬──────────────────────────────────┤
│  REVISION DUE TODAY        │  UPCOMING TESTS                  │
│  • DPSP                    │  • Polity Full Test · Sat        │
│  • Fiscal Policy           │  • AP Economy · Mon              │
│  [ Start revision ]        │  [ View all tests ]              │
├───────────────────────────┴──────────────────────────────────┤
│  WEAK AREAS  (from analytics)   Environment · Sci&Tech · Maps │
└──────────────────────────────────────────────────────────────┘
```
Data: `user_node_progress`, `reading_history`, `study_session`, `test_attempt`.
States: empty (new user → "start with the syllabus" CTA), loading (skeletons).

### W-04 · Syllabus Browser  `W-SYL` · `FR-SYL-*`

Two-pane: graph tree (left) + node preview (right).

```
┌───────────────────────────┬──────────────────────────────────┐
│ SYLLABUS · Group-1        │  Polity › Fundamental Rights      │
│ ▾ Polity            71% ● │  ──────────────────────────────── │
│   ▾ Constitution    ✓●    │  Micro-themes (6)                 │
│     • Preamble      ✓     │  ┌────────────┐ ┌────────────┐    │
│     • Fund. Rights  ◐  ←  │  │ Art 14–18  │ │ Art 19     │    │
│     • DPSP          ○     │  │ notes·pyq  │ │ notes·pyq  │    │
│   ▸ Parliament      ◐     │  └────────────┘ └────────────┘    │
│ ▸ Economy           38%   │  Attached: 12 notes · 34 PYQ ·    │
│ ▸ History           52%   │            8 videos · 2 tests     │
│ ▸ Geography         19%   │  [ Open reading view → ]          │
│ [search within…]          │  Related: DPSP, Writs, Art 32     │
└───────────────────────────┴──────────────────────────────────┘
   ✓ mastered  ◐ in-progress  ○ not-started  ● has-content
```
Tree = adjacency + closure (Phase 3 D3). Per-node status badges from
`user_node_progress`. Right pane aggregates `content_node` links. Mobile: tree and
preview become separate stacked views with breadcrumb back.

### W-05 · Node Hub / Micro-topic  `W-NODE`

Landing for a leaf node — tabs across the content model (`FR-MTK-*`, PRD §6).

```
┌──────────────────────────────────────────────────────────────┐
│ ◂ Polity › Constitution › Fundamental Rights                 │  breadcrumb
│ Fundamental Rights                         [★ bookmark] [⋯]   │
│ [Notes] [PYQs] [Model Ans] [Videos] [Flashcards] [MCQs] [Refs]│  tabs
├──────────────────────────────────────────────────────────────┤
│  (tab content)   e.g. list of notes with reading-time         │
│  • Introduction to FR ······················ 6 min ▸          │
│  • Art 19 — Freedoms ························ 11 min ▸         │
│  Contemporary linkages · Related topics (chips)               │
└──────────────────────────────────────────────────────────────┘
```

### W-06 · Reading View (Note / Micro-topic)  `W-READ` · `FR-NOTE-05`, `FR-MTK`

Three-column on wide: ToC · article · utilities.

```
┌───────────┬──────────────────────────────────┬───────────────┐
│ ON THIS   │  Fundamental Rights              │  [★] bookmark │
│ PAGE      │  ───────────────────────         │  [🅷] highlight│
│ • Intro   │  Introduction                    │  [⎙] print    │
│ • Definition  Fundamental Rights are …        │  [⬇] PDF      │
│ • Art 14  │  ## Article 14                   │  6 min read   │
│ • Art 19  │  Equality before law …           │  ───────────  │
│ • PYQs    │  [table] [flowchart img]         │  RELATED      │
│ • Revision│  > Value addition callout        │  • DPSP       │
│           │  … reading progress bar top …    │  • Writs      │
└───────────┴──────────────────────────────────┴───────────────┘
```
Renders `content_version.body` (JSONB/TipTap). Selecting text → highlight popover
(`highlight` table). Scroll updates `reading_history.progress_percent`. Sticky
reading-progress bar. Mobile: ToC collapses to a top dropdown; utilities move to a
bottom action bar.

### W-07 · PYQ Browser  `W-PYQ` · `FR-PYQ-*`

```
┌──────────────────────────────────────────────────────────────┐
│ PYQs           [Prelims] [Mains] [Interview]    (stage tabs)  │
│ Filters: Year▾  Paper▾  Subject▾  Difficulty▾  [Bookmarked]   │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 2023 · Paper II · Polity · Medium          ★             │ │
│ │ "Examine the scope of Article 21 …"                      │ │
│ │ tags: Art 21 · Right to Life        [Model answer →]     │ │
│ └──────────────────────────────────────────────────────────┘ │
│ … (cursor-paginated / infinite scroll)                        │
└──────────────────────────────────────────────────────────────┘
```
Filters map to `question` columns. Mains cards emphasise model answer; Prelims
cards can reveal options inline.

### W-08 · Question + Model Answer  `W-QDETAIL` · `FR-MANS-*`

```
┌──────────────────────────────────────────────────────────────┐
│ 2023 · Mains · Paper II · 15 marks · Polity        [★]        │
│ "Examine the scope of Article 21 in light of …"              │
├──────────────────────────────────────────────────────────────┤
│ MODEL ANSWER                          EVALUATION POINTS       │
│  Introduction …                        ✓ defines A21          │
│  Body ── subheads, SC judgments,       ✓ cites Maneka Gandhi  │
│  reports, examples, diagram            ✓ way-forward          │
│  Way forward · Conclusion                                    │
├──────────────────────────────────────────────────────────────┤
│ Value addition · Expected similar Qs · Linked micro-topics    │
└──────────────────────────────────────────────────────────────┘
```

### W-09 · Search Results  `W-SEARCH` · `FR-SRCH-*`

```
┌──────────────────────────────────────────────────────────────┐
│ 🔎 "article 21"                                    142 results│
│ Type: [All] Notes  PYQ  Model Ans  CA  Videos  Refs          │
├──────────────────────────────────────────────────────────────┤
│ NOTE   Right to Life — Article 21      Polity › FR   ▸        │
│ PYQ    2023 Mains · scope of A21       Polity        ▸        │
│ JUDG   Maneka Gandhi v. Union of India 1978          ▸        │
│ … faceted, ranked (title>keyword>body); PUBLISHED only        │
└──────────────────────────────────────────────────────────────┘
```
⌘K palette is the compact version of this. Postgres FTS (Phase 3 §8).

### W-10 · Current Affairs  `W-CA` · `FR-CA-*`

```
┌──────────────────────────────────────────────────────────────┐
│ CURRENT AFFAIRS   [Daily] [Weekly] [Monthly]                 │
│ Filters: Subject▾  Region [AP|National|Intl]  Category▾  Date │
├───────────────────────────────┬──────────────────────────────┤
│ Fri, 4 Jul 2026               │  (selected card)             │
│ • [AP] New irrigation scheme  │  Headline                    │
│ • [ECON] Repo rate held       │  Summary · why in news       │
│ • [ENV] …                     │  Linked syllabus: Economy›…  │
│                               │  [Add to revision]           │
└───────────────────────────────┴──────────────────────────────┘
```

### W-11 · Test Attempt  `W-TEST` · `FR-TEST-*`

```
┌──────────────────────────────────────────────────────────────┐
│ Polity Full Test        ⏱ 58:24        Q 12 / 100   [Submit] │
├───────────────────────────────────────────┬──────────────────┤
│ Q12. Which article deals with …           │  PALETTE         │
│  ( ) A  Article 14                         │  ▤▤▣▤▤ ▦▦░░░     │
│  (•) B  Article 19                         │  ● answered      │
│  ( ) C  Article 21                         │  ◐ marked        │
│  ( ) D  Article 32                         │  ░ not visited   │
│ [◂ Prev]  [Mark & next ▸]                  │  Jump to #__     │
└───────────────────────────────────────────┴──────────────────┘
```
Timer server-authoritative; answers persisted (`test_answer`) for resume; negative
marking noted. Confirm-on-submit modal. Mobile: palette behind a toggle.

### W-12 · Test Result  `W-RESULT` · `FR-TEST-03`

```
┌──────────────────────────────────────────────────────────────┐
│ Result · Polity Full Test                                    │
│ Score 128/200   Rank 34/512   Accuracy 71%   Time 1h 42m     │
│ [donut: correct/incorrect/skipped]   [bar: by subject]       │
├──────────────────────────────────────────────────────────────┤
│ SOLUTIONS   Q1 ✓ · Q2 ✗ (your B, ans C) [explanation ▸]      │
│ Weak areas → jump to topics · [Retake] [Leaderboard]         │
└──────────────────────────────────────────────────────────────┘
```

### W-13 · Admin — Content List  `W-CMS-LIST` · `FR-ADM-*`

```
┌──────────────────────────────────────────────────────────────┐
│ CONTENT           [+ New]     search…   type▾               │
│ Status: [All] Draft  In-Review  Approved  Published  Archived │
├──────────────────────────────────────────────────────────────┤
│ □ Title                Type      Status      Author   Updated │
│ □ Right to Life        Note      ● Published  Sushma  2d      │
│ □ Fiscal Policy 2026   Note      ◐ In-Review  Ravi    5h      │
│ □ A21 Model Answer     ModelAns  ○ Draft      Ravi    1h      │
│ …  bulk: [Submit] [Archive]              (row → editor)       │
└──────────────────────────────────────────────────────────────┘
```
Status chips reflect `content_item.status`. Reviewer sees a "My review queue" view.

### W-14 · Admin — Content Editor  `W-CMS-EDIT` · `FR-NOTE-*`

```
┌───────────────────────────────────────────┬──────────────────┐
│ ◂ Back   Right to Life — Article 21        │  SETTINGS        │
│ [B I H1 H2 • 1. ⧉table ▭img ⇱link ⌥code]   │  Slug  right-… │
│ ┌───────────────────────────────────────┐ │  Exam  Group-1   │
│ │ Introduction                          │ │  Link nodes  +   │
│ │ Fundamental Rights are …              │ │   › FR × Art21×  │
│ │ ## Article 14                         │ │  Difficulty ▾    │
│ │ [table] [image]                       │ │  ── VERSIONS ──  │
│ │  ▍auto-saved 12:04                    │ │  v4 (current)    │
│ └───────────────────────────────────────┘ │  v3 · restore    │
│ [Save draft] [Submit for review →]         │  v2 · diff       │
└───────────────────────────────────────────┴──────────────────┘
```
TipTap editor; body ↔ `content_version.body`. Auto-save writes draft version; node
links = `content_node`. Version panel = `content_version` history (diff/restore).

### W-15 · Admin — Review  `W-CMS-REVIEW` · `FR-NOTE-04`

```
┌───────────────────────────────────────────┬──────────────────┐
│ REVIEW · Fiscal Policy 2026 · v3           │  DECISION        │
│ [diff view: additions / deletions]         │  ( ) Approve     │
│ …rendered content with inline comments…    │  ( ) Request chg │
│ 💬 "Add latest RBI figure here"            │  ( ) Reject      │
│                                            │  Comment […]     │
│ Author: Ravi   Reviewer: (you)            │  [Submit review] │
│ ⚠ you cannot review your own content       │                  │
└───────────────────────────────────────────┴──────────────────┘
```
Enforces separation of duties (reviewer ≠ author). Records `content_review`;
transition updates `content_item.status`, emits events (cache/search/notify).

### W-16 · Admin — Users & Roles  `W-CMS-USERS`

```
┌──────────────────────────────────────────────────────────────┐
│ USERS & ROLES        search…     role▾     status▾           │
│ Name      Email            Roles              Exam    Status  │
│ Sushma    s@…    [Editor][Reviewer]           Grp-1   Active  │
│ Ravi      r@…    [Editor]                      Grp-1   Active  │
│  (row → drawer: assign/revoke roles, scope to exam, audit)    │
└──────────────────────────────────────────────────────────────┘
```

### W-17 · Profile & Library  `W-PROFILE`

Tabs: Profile (name, avatar, target exam, preferences) · Bookmarks · History ·
Achievements · Security (password, sessions, delete/export account).

---

## 4. Primary User Flows

### 4.1 Onboarding
`Landing → Register/Google → Verify email (OTP) → Pick target exam → Dashboard
(empty state) → “Start with syllabus”.`

### 4.2 Daily study loop
`Dashboard → Continue reading OR Revision due → Reading view → highlight/bookmark
→ mark node progress → linked PYQ/related topic → back to dashboard (streak++).`

### 4.3 Practice loop
`PYQs/Tests → attempt → submit → result + solutions → weak-area jump → topic →
revise.`

### 4.4 Content lifecycle (staff)
`Editor: New → write (auto-save draft) → Submit for review → Reviewer: diff +
comment → Approve/Request changes → Admin: Publish → (search re-index, caches
bust, notify).` Mirrors the Phase 2 §10 state machine; separation of duties
enforced.

---

## 5. Cross-Cutting UX States & Rules

- **Every list/async view** specifies: loading (skeleton), empty (guided CTA),
  error (retry), and populated.
- **Optimistic UI** for bookmark/highlight/progress; reconcile on server response.
- **Accessibility (`NFR-A11Y`):** logical heading order, skip-to-content, visible
  focus, keyboard-operable tree/tabs/palette, ARIA on interactive widgets, ⌘K and
  arrow-key navigation. Reader honours reduced-motion and supports high contrast.
- **Content trust:** published-only for students; draft watermarks in CMS previews.
- **Consistency:** one shell, one nav model, predictable breadcrumbs, status chips
  reused everywhere (`Draft/In-Review/Approved/Published/Archived`).

---

## 6. Phase 4 Exit Criteria

- Approval of: information architecture, the two app shells, the key screen
  layouts (W-01…W-17), the four primary flows, and the cross-cutting state rules.
- On approval → **Phase 5: Design System** (color, typography, spacing, component
  library on shadcn/ui, tokens, light/white-theme visual language).

**Approval:** _Pending stakeholder review._ A companion interactive visual mockup
accompanies this document.
