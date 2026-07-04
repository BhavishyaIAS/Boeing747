# Bhavishya IAS — Design System

**Document:** Phase 5 Deliverable
**Version:** 1.0
**Status:** Draft — Awaiting Approval
**Depends on:** `docs/01-PRD.md` … `docs/04-wireframes.md`
**Implements:** shadcn/ui (Radix primitives) + TailwindCSS tokens
**Last Updated:** 2026-07-04

> The visual language that turns the Phase 4 wireframes into real UI: color,
> typography, spacing, radius, elevation, motion, iconography, and a component
> library mapped to shadcn/ui. Values here are **authoritative tokens** — they map
> 1:1 to CSS variables and the Tailwind theme, and are demonstrated in the
> companion living style-guide. A single set of semantic tokens drives both the
> default **white theme** and an opt-in **dark reading theme**.

---

## 1. Design Principles

Reaffirming the PRD's philosophy (§8) as concrete rules:

1. **Reading-first.** Content is the product; typography and measure are tuned for
   long-form focus. Chrome recedes, content leads.
2. **Quiet by default, loud only for meaning.** One brand accent; color is spent on
   *state and action*, not decoration. A page of black text on white with a single
   indigo action is the norm.
3. **Academic & premium.** Serif for reading and display, a clean grotesque for UI,
   generous whitespace, soft low elevation — never flashy.
4. **Systematic.** Everything sits on a 4px grid and a fixed type scale. No
   one-off values; if it's not a token, it doesn't ship.
5. **Accessible (WCAG 2.2 AA).** Contrast, focus, motion, and semantics are
   acceptance criteria, not afterthoughts.

---

## 2. Color

### 2.1 Token architecture

Colors are defined in two layers:

- **Primitive ramps** (raw hues, e.g. `--brand-600`) — never used directly in
  components.
- **Semantic tokens** (e.g. `--color-bg`, `--color-fg`, `--color-primary`) — the
  only thing components reference. Semantic tokens are redefined per theme, so a
  component is theme-agnostic.

```
component → semantic token → primitive ramp (per theme)
```

### 2.2 Neutrals (slate-tinted — a deliberate cool bias toward the brand)

| Semantic | Light | Dark | Use |
|---|---|---|---|
| `bg` (app canvas) | `#F7F8FA` | `#0E1116` | page background |
| `surface` | `#FFFFFF` | `#161A21` | cards, sheets |
| `surface-muted` | `#F1F3F6` | `#1C222B` | subtle fills, hover |
| `border` | `#E7E9ED` | `#262D38` | hairlines |
| `border-strong` | `#D6D9E0` | `#333C49` | inputs, dividers |
| `fg` (primary text) | `#16181D` | `#E7EAF0` | body ink |
| `fg-muted` | `#585E6B` | `#9AA3B2` | secondary text |
| `fg-faint` | `#8A909C` | `#6C7688` | captions, placeholders |

Body text on surface: `#16181D` on `#FFFFFF` ≈ **16.9:1** (AAA).

### 2.3 Brand — Indigo ("Bhavishya" blue)

The single interactive accent: trust, focus, academic authority.

| Step | Hex |  | Semantic role |
|---|---|---|---|
| 50 | `#EEF0FB` | | `primary-subtle-bg` |
| 100 | `#DEE2F7` | | hover on subtle |
| 200 | `#C0C7EF` | | |
| 300 | `#98A2E4` | | |
| 400 | `#6E7BD6` | | brand text on dark |
| 500 | `#4B59C9` | | |
| **600** | **`#3B4CCA`** | | **`primary`** (default) |
| 700 | `#2F3CA6` | | `primary-hover`, `primary-subtle-fg` |
| 800 | `#283086` | | `primary-active` |
| 900 | `#212a66` | | |

`primary` `#3B4CCA` on white ≈ 6.9:1 (AA for text & large); `primary-fg` = `#FFFFFF`.
Dark theme: links/`primary-fg-on-bg` shift to `#8B95F5` for contrast on dark canvas.

### 2.4 Saffron — secondary accent (used sparingly)

For achievements, streaks, highlights, and "value-addition" flourishes — a warm,
Indian-academic nod. **Never** for primary actions.

| Token | Light | Dark |
|---|---|---|
| `accent` | `#E08600` | `#F0A94A` |
| `accent-subtle-bg` | `#FCF1E1` | `#2C1E0C` |
| `accent-fg` | `#8A5200` | `#F0A94A` |

### 2.5 Semantic status

Reused everywhere, including the content-lifecycle chips.

| State | fg (light) | bg (light) | Maps to |
|---|---|---|---|
| `success` | `#1F7A46` | `#E6F4EC` | **Published** |
| `warning` | `#9A6A1E` | `#FBF3E2` | **In-Review** |
| `danger` | `#C4322B` | `#FBEAE8` | destructive / **Rejected** |
| `info` | `#2563C9` | `#E8F0FC` | **Approved** |
| `neutral` | `#585E6B` | `#F1F3F6` | **Draft** / **Archived** |

Content-status chip mapping (from wireframes W-13/14/15):
`Draft → neutral · In-Review → warning · Approved → info · Published → success ·
Archived → neutral (faint)`.

### 2.6 Domain palette (data-viz / admin only)

Consistent with the schema explorer. Categorical, ~equal luminance, distinguishable
in both themes and for common color-vision deficiencies (paired with labels/shape,
never color alone).

`Identity #5B63E0` · `Taxonomy #0E8F7E` · `Content #C2410C` ·
`Learning #7C3AED` · `Tests #BE1E50`.

> **Rule:** semantic status color ≠ brand accent ≠ domain color. They live in
> separate scales so meaning never collides with identity.

---

## 3. Typography

### 3.1 Typefaces (loaded via `next/font`, self-hosted — no CDN)

| Role | Family | Fallback | Why |
|---|---|---|---|
| **Reading / Display (serif)** | **Source Serif 4** | Georgia, serif | Editorial, academic, superb at long-form; carries headings + content body |
| **UI (sans)** | **Geist Sans** | Inter, system-ui | Neutral, precise grotesque for dense UI |
| **Mono** | **Geist Mono** | JetBrains Mono, ui-monospace | Code, IDs, tabular data |

Reading body uses the **serif**; app UI (nav, buttons, tables, forms) uses the
**sans**. This split is the core of the "academic content, modern tool" feel.

### 3.2 Type scale (base 16px)

| Token | Size / line-height | Weight | Family | Use |
|---|---|---|---|---|
| `display-xl` | 48 / 1.05 | 700 | serif | marketing hero |
| `display-l` | 36 / 1.1 | 700 | serif | section hero |
| `h1` | 30 / 1.15 | 600 | serif | page title |
| `h2` | 24 / 1.2 | 600 | serif | section |
| `h3` | 20 / 1.3 | 600 | sans/serif | subsection |
| `h4` | 17 / 1.4 | 600 | sans | card title |
| `body-lg` | 17 / 1.6 | 400 | sans | prominent UI text |
| `body` | 15 / 1.55 | 400 | sans | **UI default** |
| `small` | 13 / 1.5 | 400 | sans | meta, helper |
| `label` | 11.5 / 1.4 | 600 | sans | uppercase, `+0.12em` tracking |
| `reading` | 18 / 1.75 | 400 | **serif** | **content pages**, measure ≤ 68ch |
| `code` | 13.5 / 1.6 | 400 | mono | code blocks, IDs |

- Headings: `text-wrap: balance`, tight tracking (`-0.01em`).
- Reading columns: `max-width: 68ch`; paragraph spacing = 1em; `font-feature-settings`
  for ligatures + oldstyle numerals in prose, `tabular-nums` in data.

---

## 4. Spacing, Sizing & Radius

### 4.1 Spacing scale (4px base grid)

`0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80` (px).
Tailwind `spacing` extended to match; components compose with `gap`, never ad-hoc
margins (per Phase 2 layout rule). Section rhythm: 48–64px; card padding: 16–20px;
control padding: 8–12px.

### 4.2 Radius

| Token | px | Use |
|---|---|---|
| `radius-xs` | 4 | tags, inline chips |
| `radius-sm` | 6 | inputs, small buttons |
| `radius-md` | 8 | **default** buttons, selects |
| `radius-lg` | 12 | cards, popovers |
| `radius-xl` | 16 | modals, large surfaces |
| `radius-full` | 9999 | pills, avatars |

### 4.3 Layout metrics

App shell: sidebar `240px` (icon-rail `64px`), top bar `56px`, content max
`1200px`, reading column `720px` (≈68ch). Grid gutter `16–24px`.

---

## 5. Elevation & Focus

Soft, low shadows — premium restraint. Elevation signals layering, not drama.

| Token | Shadow (light) | Use |
|---|---|---|
| `e0` | none | flush surfaces |
| `e1` | `0 1px 2px rgba(16,18,24,.05)` | cards at rest |
| `e2` | `0 1px 2px rgba(16,18,24,.04), 0 6px 16px rgba(16,18,24,.06)` | raised cards, dropdowns |
| `e3` | `0 12px 32px rgba(16,18,24,.10)` | popovers, sheets |
| `e4` | `0 20px 56px rgba(16,18,24,.18)` | modals, ⌘K palette |

Dark theme uses deeper, softer shadows (`rgba(0,0,0,.3–.5)`) + a 1px translucent
top border for surface separation.

**Focus ring (all interactive elements):** `0 0 0 3px rgba(59,76,202,.35)` +
`outline: 2px solid transparent` (Windows high-contrast). Always visible on
keyboard focus; never removed without an equivalent.

---

## 6. Motion

| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion-fast` | 120ms | `cubic-bezier(.2,0,.2,1)` | hover, press, toggles |
| `motion-base` | 180ms | standard | dropdowns, tabs |
| `motion-slow` | 240ms | emphasized `cubic-bezier(.2,0,0,1)` | sheets, dialogs |
| `motion-enter` | 320ms | emphasized | page/section reveals |

Framer Motion for orchestrated moments (dashboard cards stagger-in, palette open).
**All motion is decorative** — every animation is wrapped by
`prefers-reduced-motion: reduce` → near-instant, no transform. No motion gates
content visibility.

---

## 7. Iconography & Imagery

- **Icons:** Lucide (ships with shadcn/ui). Default `20px`, stroke `1.75`, aligned
  to text baseline. Semantic icons pair with text, not alone (a11y).
- **Illustration:** minimal line-style, ink + brand tint, for empty states.
- **Images/media:** rounded `radius-lg`, `max-width:100%`, lazy-loaded, optimized
  (Next Image); diagrams/mind-maps from `media_asset` render on `surface`.

---

## 8. Component Library (mapped to shadcn/ui)

Each component is a shadcn/Radix primitive, restyled with our tokens. Variants and
states below are the contract; usage references the wireframes.

### 8.1 Actions
- **Button** — variants: `primary` (brand), `secondary` (surface + border),
  `ghost` (text), `destructive` (danger), `link`. Sizes: `sm/md/lg` + `icon`.
  States: default/hover/active/focus/disabled/loading. Radius `md`.
- **Icon Button**, **Dropdown Menu**, **Command (⌘K palette)** — global search
  (W-09), `e4`, keyboard-first.

### 8.2 Forms (React Hook Form + Zod)
- **Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, Slider,
  Date Picker.** Consistent 36–40px control height, `border-strong`, focus ring,
  inline error text (danger) + helper text (faint). Label above, always associated.

### 8.3 Content & data display
- **Card** (`surface`, `e1`, `radius-lg`) — dashboard tiles, node preview,
  PYQ cards.
- **Badge / Chip** — status chips (§2.5), tags, counts.
- **Table** (sortable, sticky header, zebra optional, `tabular-nums`) — admin
  lists (W-13), test solutions.
- **Tabs** — node hub content model (W-05), profile (W-17).
- **Tree** — syllabus browser (W-04); keyboard-navigable (roving tabindex, arrow
  keys, expand/collapse), status badge slot.
- **Accordion, Breadcrumb, Progress, Meter, Avatar, Separator, Tooltip,
  Skeleton** (loading states everywhere).

### 8.4 Overlays & feedback
- **Dialog** (confirmations e.g. test submit), **Sheet/Drawer** (mobile nav, user
  role editor W-16), **Popover** (highlight menu W-06), **Toast** (action
  feedback — "Published"), **Alert** (inline, semantic), **Alert Dialog**
  (destructive confirm).

### 8.5 Composite / product-specific
- **AppShell** (top bar + sidebar + content, responsive per §4.3 & wireframes §2.3).
- **StatusChip** (lifecycle), **CoverageBar**, **StreakBadge** (saffron),
  **ReaderToolbar**, **QuestionPalette** (test), **EditorToolbar** (TipTap),
  **DiffView** (review), **SearchResultRow**, **EmptyState**.

Every component ships with: all interaction states, keyboard support, ARIA roles,
light + dark, and a Storybook-style entry (Phase 15 wires visual tests).

---

## 9. States & Content Patterns

- **Async views** always define: `skeleton` (loading), `empty` (guided CTA),
  `error` (retry), `populated` — enforced as a checklist per screen.
- **Optimistic UI** for bookmark/highlight/progress; roll back on failure with a
  toast.
- **Copy voice:** plain, active, exam-native ("Start revision", toast "Published").
  Errors say what went wrong + how to fix.

---

## 10. Accessibility Baseline (WCAG 2.2 AA)

- Text contrast ≥ 4.5:1 (≥ 3:1 large); UI/icon contrast ≥ 3:1. Verified per token
  pairing (§2).
- Full keyboard operability (tree, tabs, palette, dialogs with focus trap +
  restore); visible focus ring (§5); skip-to-content link.
- Semantic HTML + ARIA on all Radix primitives (inherited, verified).
- Respects `prefers-reduced-motion` and `prefers-color-scheme`; supports OS
  high-contrast. Target sizes ≥ 24px. Tested with axe in CI (Phase 15).

---

## 11. Theming Implementation

- Tokens as CSS custom properties on `:root`; dark values under
  `:root[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`. Tailwind
  reads them via `theme.extend` so utilities and components share one source.
- **Default = white/light** (brand expression). Dark is an opt-in *reading* theme
  (night study) with equal care — not a naive invert.
- shadcn's CSS-variable mode is the integration point; `components.json` pins the
  token names below.

### 11.1 Token reference (abridged CSS)

```css
:root{
  --color-bg:#F7F8FA; --color-surface:#FFFFFF; --color-surface-muted:#F1F3F6;
  --color-border:#E7E9ED; --color-border-strong:#D6D9E0;
  --color-fg:#16181D; --color-fg-muted:#585E6B; --color-fg-faint:#8A909C;
  --color-primary:#3B4CCA; --color-primary-fg:#FFFFFF; --color-primary-hover:#2F3CA6;
  --color-primary-subtle-bg:#EEF0FB; --color-primary-subtle-fg:#2F3CA6;
  --color-accent:#E08600; --color-accent-subtle-bg:#FCF1E1;
  --color-success:#1F7A46; --color-warning:#9A6A1E; --color-danger:#C4322B; --color-info:#2563C9;
  --radius-sm:6px; --radius-md:8px; --radius-lg:12px; --radius-xl:16px;
  --ring:0 0 0 3px rgba(59,76,202,.35);
  --e1:0 1px 2px rgba(16,18,24,.05);
  --e2:0 1px 2px rgba(16,18,24,.04),0 6px 16px rgba(16,18,24,.06);
  --font-serif:"Source Serif 4",Georgia,serif;
  --font-sans:"Geist Sans",Inter,system-ui,sans-serif;
  --font-mono:"Geist Mono","JetBrains Mono",ui-monospace,monospace;
}
:root[data-theme="dark"]{
  --color-bg:#0E1116; --color-surface:#161A21; --color-surface-muted:#1C222B;
  --color-border:#262D38; --color-border-strong:#333C49;
  --color-fg:#E7EAF0; --color-fg-muted:#9AA3B2; --color-fg-faint:#6C7688;
  --color-primary:#4B59C9; --color-primary-fg:#FFFFFF; --color-primary-hover:#6E7BD6;
  --color-primary-subtle-bg:#1A2038; --color-primary-subtle-fg:#8B95F5;
  --color-accent:#F0A94A; --color-accent-subtle-bg:#2C1E0C;
  --color-success:#5FB088; --color-warning:#D1A24E; --color-danger:#E9736B; --color-info:#6AA0F0;
}
```

---

## 12. Phase 5 Exit Criteria

- Approval of: the color system (neutrals, brand indigo, saffron accent, semantic
  + domain scales), typography (serif reading / sans UI pairing + scale), spacing,
  radius, elevation, motion, and the shadcn/ui component mapping.
- On approval → **Phase 6: Folder Structure** (the Next.js App Router project
  layout, module organisation, and where tokens/components/services live).

**Approval:** _Pending stakeholder review._ A companion living style-guide
demonstrates every token and component in light and dark.
