import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { NodeType } from "@prisma/client";

/**
 * Loads the official APPSC Group-1 micro-theme dataset (458 leaf micro-themes,
 * 6-level hierarchy) and transforms it into a node tree for seeding.
 *
 * Level → node type:
 *   paper → SUBJECT · section → UNIT · unit → THEME · theme → SUB_THEME ·
 *   micro_theme → MICRO_THEME (leaf; slug = its stable id).
 * Stage (Prelims/Mains) is kept on the paper node's exam-angle and slug prefix.
 */
export interface RawNode {
  slug: string;
  title: string;
  type: NodeType;
  summary?: string;
  examAngle?: string;
  children?: RawNode[];
}

interface MicroTheme {
  id: string;
  stage: string;
  paper: string;
  section: string;
  unit: string;
  theme: string;
  micro_theme: string;
  geographic_scope: string;
  cognitive_level: string;
  in_both_prelims_mains: boolean;
}

interface DataFile {
  micro_themes: MicroTheme[];
}

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Ordered grouping helper: preserves first-seen order of keys. */
class OrderedGroups<T> {
  private readonly map = new Map<string, T[]>();
  private readonly order: string[] = [];
  add(key: string, value: T): void {
    let list = this.map.get(key);
    if (!list) {
      list = [];
      this.map.set(key, list);
      this.order.push(key);
    }
    list.push(value);
  }
  entries(): [string, T[]][] {
    return this.order.map((k) => [k, this.map.get(k) ?? []]);
  }
}

export function buildAppscSyllabus(): RawNode[] {
  const path = fileURLToPath(new URL("./appsc-microthemes.json", import.meta.url));
  const data = JSON.parse(readFileSync(path, "utf8")) as DataFile;

  const used = new Set<string>();
  const uniqueSlug = (base: string): string => {
    const root = base || "node";
    let slug = root;
    let n = 2;
    while (used.has(slug)) slug = `${root}-${n++}`;
    used.add(slug);
    return slug;
  };

  // Group rows: paper → section → unit → theme → micro_themes.
  const papers = new OrderedGroups<MicroTheme>();
  for (const m of data.micro_themes) papers.add(`${m.stage}||${m.paper}`, m);

  const subjects: RawNode[] = [];
  for (const [paperKey, paperRows] of papers.entries()) {
    const [stage, paper] = paperKey.split("||") as [string, string];

    const sections = new OrderedGroups<MicroTheme>();
    for (const m of paperRows) sections.add(m.section, m);

    const sectionNodes: RawNode[] = [];
    for (const [section, sectionRows] of sections.entries()) {
      const units = new OrderedGroups<MicroTheme>();
      for (const m of sectionRows) units.add(m.unit, m);

      const unitNodes: RawNode[] = [];
      for (const [unit, unitRows] of units.entries()) {
        const themes = new OrderedGroups<MicroTheme>();
        for (const m of unitRows) themes.add(m.theme, m);

        const themeNodes: RawNode[] = [];
        for (const [theme, themeRows] of themes.entries()) {
          const microNodes: RawNode[] = themeRows.map((m) => ({
            slug: uniqueSlug(m.id.toLowerCase()),
            title: m.micro_theme,
            type: "MICRO_THEME" as NodeType,
            examAngle: `${m.cognitive_level} · ${m.geographic_scope}${
              m.in_both_prelims_mains ? " · Prelims + Mains" : ""
            }`,
          }));
          themeNodes.push({
            slug: uniqueSlug(slugify(theme)),
            title: theme,
            type: "SUB_THEME" as NodeType,
            children: microNodes,
          });
        }
        unitNodes.push({
          slug: uniqueSlug(slugify(unit)),
          title: unit,
          type: "THEME" as NodeType,
          children: themeNodes,
        });
      }
      sectionNodes.push({
        slug: uniqueSlug(slugify(section)),
        title: section,
        type: "UNIT" as NodeType,
        children: unitNodes,
      });
    }

    subjects.push({
      slug: uniqueSlug(slugify(`${stage} ${paper}`)),
      title: paper,
      type: "SUBJECT" as NodeType,
      examAngle: stage,
      children: sectionNodes,
    });
  }

  return subjects;
}
