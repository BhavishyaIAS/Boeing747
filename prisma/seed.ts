import { PrismaClient, type RoleKey } from "@prisma/client";
import {
  PERMISSION_CATALOGUE,
  ROLE_PERMISSIONS,
} from "../src/modules/identity/rbac";
import { hashPassword } from "../src/modules/identity/password";
import { buildAppscSyllabus, type RawNode } from "./syllabus/microthemes";

const prisma = new PrismaClient();

const ROLE_META: Record<RoleKey, { name: string; description: string }> = {
  STUDENT: { name: "Student", description: "Consumes content, tests and answer-writing" },
  FACULTY: { name: "Faculty", description: "Evaluates answers and mentors" },
  CONTENT_EDITOR: { name: "Content Editor", description: "Authors content in draft" },
  REVIEWER: { name: "Reviewer", description: "Approves or requests changes on content" },
  ADMIN: { name: "Admin", description: "Manages users, content and taxonomy" },
  SUPER_ADMIN: { name: "Super Admin", description: "Full control, including role management" },
};

async function seedRbac(): Promise<Map<RoleKey, string>> {
  for (const key of PERMISSION_CATALOGUE) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
  }
  const permissions = await prisma.permission.findMany();
  const permId = new Map(permissions.map((p) => [p.key, p.id]));

  const roleId = new Map<RoleKey, string>();
  for (const key of Object.keys(ROLE_PERMISSIONS) as RoleKey[]) {
    const meta = ROLE_META[key];
    const role = await prisma.role.upsert({
      where: { key },
      update: { name: meta.name, description: meta.description },
      create: { key, name: meta.name, description: meta.description },
    });
    roleId.set(key, role.id);
  }

  for (const key of Object.keys(ROLE_PERMISSIONS) as RoleKey[]) {
    const grants = ROLE_PERMISSIONS[key];
    const keys = grants.includes("*") ? PERMISSION_CATALOGUE : (grants as string[]);
    const rId = roleId.get(key);
    if (!rId) continue;
    for (const pk of keys) {
      const pId = permId.get(pk);
      if (!pId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: rId, permissionId: pId } },
        update: {},
        create: { roleId: rId, permissionId: pId },
      });
    }
  }
  return roleId;
}

interface Ancestor {
  id: string;
  depth: number;
}

/**
 * Idempotently seeds a syllabus tree. Each node carries a globally-unique,
 * pre-computed slug. Closure rows are written for self (depth 0) and every
 * ancestor, enabling O(1) subtree/ancestor queries.
 */
async function seedSyllabusTree(
  examId: string,
  nodes: RawNode[],
  parentId: string | null = null,
  ancestors: Ancestor[] = [],
): Promise<number> {
  let count = 0;
  let order = 0;
  for (const raw of nodes) {
    let node = await prisma.syllabusNode.findFirst({ where: { examId, slug: raw.slug } });
    node ??= await prisma.syllabusNode.create({
      data: {
        examId,
        parentId,
        type: raw.type,
        title: raw.title,
        slug: raw.slug,
        orderIndex: order,
        summary: raw.summary ?? null,
        examAngle: raw.examAngle ?? null,
      },
    });
    count += 1;

    for (const anc of [{ id: node.id, depth: 0 }, ...ancestors]) {
      await prisma.syllabusClosure.upsert({
        where: { ancestorId_descendantId: { ancestorId: anc.id, descendantId: node.id } },
        update: {},
        create: { ancestorId: anc.id, descendantId: node.id, depth: anc.depth },
      });
    }

    if (raw.children?.length) {
      const childAncestors: Ancestor[] = [
        { id: node.id, depth: 1 },
        ...ancestors.map((a) => ({ id: a.id, depth: a.depth + 1 })),
      ];
      count += await seedSyllabusTree(examId, raw.children, node.id, childAncestors);
    }
    order += 1;
  }
  return count;
}

function doc(paragraphs: string[]): object {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
}

/** Create (idempotently) a PUBLISHED content item with an initial version. */
async function ensurePublished(
  examId: string,
  authorId: string,
  input: {
    type: "QUESTION" | "MODEL_ANSWER" | "CURRENT_AFFAIR" | "NOTE";
    title: string;
    slug: string;
    body: object;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
  },
): Promise<string> {
  const existing = await prisma.contentItem.findFirst({ where: { examId, slug: input.slug } });
  if (existing) return existing.id;

  const item = await prisma.contentItem.create({
    data: {
      examId,
      type: input.type,
      title: input.title,
      slug: input.slug,
      status: "PUBLISHED",
      authorId,
      difficulty: input.difficulty ?? null,
      readingTimeSeconds: 120,
      publishedAt: new Date(),
    },
  });
  const version = await prisma.contentVersion.create({
    data: { contentItemId: item.id, versionNumber: 1, body: input.body, plainText: "", createdById: authorId },
  });
  await prisma.contentItem.update({
    where: { id: item.id },
    data: { currentVersionId: version.id },
  });
  return item.id;
}

async function linkNode(contentItemId: string, nodeId: string): Promise<void> {
  await prisma.contentNode.upsert({
    where: { contentItemId_nodeId: { contentItemId, nodeId } },
    update: {},
    create: { contentItemId, nodeId, relationType: "PRIMARY" },
  });
}

async function findNode(examId: string, contains: string): Promise<string | null> {
  const node = await prisma.syllabusNode.findFirst({
    where: { examId, title: { contains, mode: "insensitive" }, deletedAt: null },
    orderBy: { type: "asc" },
    select: { id: true },
  });
  return node?.id ?? null;
}

async function seedSamplePyqs(examId: string, authorId: string): Promise<number> {
  const fallback = await prisma.syllabusNode.findFirst({
    where: { examId, type: "SUBJECT" },
    orderBy: { orderIndex: "asc" },
    select: { id: true },
  });
  const nodeFor = async (kw: string): Promise<string | null> =>
    (await findNode(examId, kw)) ?? fallback?.id ?? null;

  let count = 0;

  // 1. Prelims MCQ — Constitution.
  const q1 = await ensurePublished(examId, authorId, {
    type: "QUESTION",
    title: "Which article of the Indian Constitution guarantees the Right to Life and Personal Liberty?",
    slug: "pyq-pre-2023-right-to-life",
    body: doc(["Choose the correct option."]),
    difficulty: "EASY",
  });
  await prisma.question.upsert({
    where: { contentItemId: q1 },
    update: {},
    create: {
      contentItemId: q1,
      kind: "MCQ",
      stage: "PRELIMS",
      isPyq: true,
      year: 2023,
      paper: "Paper I",
      marks: 1,
      source: "APPSC Group-I Prelims 2023",
      explanation: doc([
        "Article 21 guarantees that no person shall be deprived of life or personal liberty except according to procedure established by law.",
        "In Maneka Gandhi v. Union of India (1978), the Supreme Court held that this procedure must be just, fair and reasonable.",
      ]),
    },
  });
  if ((await prisma.questionOption.count({ where: { questionItemId: q1 } })) === 0) {
    await prisma.questionOption.createMany({
      data: [
        { questionItemId: q1, label: "A", text: "Article 14", isCorrect: false, orderIndex: 0 },
        { questionItemId: q1, label: "B", text: "Article 19", isCorrect: false, orderIndex: 1 },
        { questionItemId: q1, label: "C", text: "Article 21", isCorrect: true, orderIndex: 2 },
        { questionItemId: q1, label: "D", text: "Article 32", isCorrect: false, orderIndex: 3 },
      ],
    });
  }
  const n1 = await nodeFor("Constitution");
  if (n1) await linkNode(q1, n1);
  count += 1;

  // 2. Prelims MCQ — Indus Valley Civilization.
  const q2 = await ensurePublished(examId, authorId, {
    type: "QUESTION",
    title: "The Great Bath, an important public structure of the Indus Valley Civilization, was found at which site?",
    slug: "pyq-pre-2022-great-bath",
    body: doc(["Choose the correct option."]),
    difficulty: "MEDIUM",
  });
  await prisma.question.upsert({
    where: { contentItemId: q2 },
    update: {},
    create: {
      contentItemId: q2,
      kind: "MCQ",
      stage: "PRELIMS",
      isPyq: true,
      year: 2022,
      paper: "Paper I",
      marks: 1,
      source: "APPSC Group-I Prelims 2022",
      explanation: doc([
        "The Great Bath was discovered at Mohenjodaro. It reflects the advanced hydraulic engineering and ritual bathing practices of the Harappans.",
      ]),
    },
  });
  if ((await prisma.questionOption.count({ where: { questionItemId: q2 } })) === 0) {
    await prisma.questionOption.createMany({
      data: [
        { questionItemId: q2, label: "A", text: "Harappa", isCorrect: false, orderIndex: 0 },
        { questionItemId: q2, label: "B", text: "Mohenjodaro", isCorrect: true, orderIndex: 1 },
        { questionItemId: q2, label: "C", text: "Lothal", isCorrect: false, orderIndex: 2 },
        { questionItemId: q2, label: "D", text: "Kalibangan", isCorrect: false, orderIndex: 3 },
      ],
    });
  }
  const n2 = await nodeFor("Indus Valley");
  if (n2) await linkNode(q2, n2);
  count += 1;

  // 3. Mains descriptive with a model answer.
  const ma = await ensurePublished(examId, authorId, {
    type: "MODEL_ANSWER",
    title: "Model Answer — Scope of Article 21",
    slug: "model-mains-2023-article-21",
    body: doc([
      "Introduction: Article 21 guarantees the Right to Life and Personal Liberty, one of the most dynamic fundamental rights.",
      "Body: Post-Maneka Gandhi (1978), 'procedure established by law' must be just, fair and reasonable. The Court has read in a wide bundle of rights — right to livelihood (Olga Tellis), right to a clean environment (Subhash Kumar), right to privacy (K.S. Puttaswamy, 2017), and right to die with dignity (Common Cause, 2018).",
      "Way forward: A rights-based, purposive interpretation of Article 21 must be balanced against reasonable state regulation and competing public interest.",
      "Conclusion: Article 21 has evolved from a narrow guarantee into the bedrock of substantive due process in India.",
    ]),
  });
  const q3 = await ensurePublished(examId, authorId, {
    type: "QUESTION",
    title: "Examine the expanding scope of Article 21 in light of judicial interpretation since the Maneka Gandhi case.",
    slug: "pyq-mains-2023-article-21",
    body: doc(["Answer in about 250 words. (15 marks)"]),
    difficulty: "HARD",
  });
  await prisma.question.upsert({
    where: { contentItemId: q3 },
    update: { modelAnswerItemId: ma },
    create: {
      contentItemId: q3,
      kind: "DESCRIPTIVE",
      stage: "MAINS",
      isPyq: true,
      year: 2023,
      paper: "Paper III",
      marks: 15,
      source: "APPSC Group-I Mains 2023",
      modelAnswerItemId: ma,
      explanation: doc([
        "Evaluation points: define Article 21; cite Maneka Gandhi; list expanded rights with case law; include a balanced way-forward and conclusion.",
      ]),
    },
  });
  const n3 = await nodeFor("Fundamental Rights");
  if (n3) await linkNode(q3, n3);
  count += 1;

  return count;
}

async function seedSampleCurrentAffairs(examId: string, authorId: string): Promise<number> {
  const items: {
    title: string;
    slug: string;
    cadence: "DAILY" | "WEEKLY" | "MONTHLY";
    region: "ANDHRA_PRADESH" | "NATIONAL" | "INTERNATIONAL";
    category: string;
    publishDate: string;
    node: string;
    body: string[];
  }[] = [
    {
      title: "RBI holds the repo rate steady",
      slug: "ca-rbi-repo-rate-hold",
      cadence: "DAILY",
      region: "NATIONAL",
      category: "Economy",
      publishDate: "2026-07-04",
      node: "Money, Banking",
      body: [
        "The Reserve Bank of India's Monetary Policy Committee voted to keep the repo rate unchanged, citing balanced inflation and growth dynamics.",
        "Why in news: signals monetary policy continuity; relevant to banking, inflation targeting and the RBI's mandate.",
      ],
    },
    {
      title: "Andhra Pradesh launches a new irrigation scheme",
      slug: "ca-ap-irrigation-scheme",
      cadence: "WEEKLY",
      region: "ANDHRA_PRADESH",
      category: "Andhra Pradesh",
      publishDate: "2026-07-03",
      node: "Andhra Pradesh",
      body: [
        "The Andhra Pradesh government announced a new lift-irrigation initiative to expand assured irrigation across drought-prone districts.",
        "Why in news: directly relevant to AP economy, agriculture and river-water utilisation themes.",
      ],
    },
    {
      title: "India ratifies a global biodiversity commitment",
      slug: "ca-india-biodiversity-commitment",
      cadence: "MONTHLY",
      region: "INTERNATIONAL",
      category: "Environment",
      publishDate: "2026-07-01",
      node: "Environment",
      body: [
        "India formalised its commitment under an international biodiversity framework, setting targets for conservation and restoration.",
        "Why in news: links to environment, climate diplomacy and India's international commitments.",
      ],
    },
  ];

  let count = 0;
  for (const it of items) {
    const id = await ensurePublished(examId, authorId, {
      type: "CURRENT_AFFAIR",
      title: it.title,
      slug: it.slug,
      body: doc(it.body),
    });
    await prisma.currentAffair.upsert({
      where: { contentItemId: id },
      update: {},
      create: {
        contentItemId: id,
        cadence: it.cadence,
        region: it.region,
        category: it.category,
        publishDate: new Date(it.publishDate),
      },
    });
    const nodeId = await findNode(examId, it.node);
    if (nodeId) await linkNode(id, nodeId);
    count += 1;
  }
  return count;
}

async function main(): Promise<void> {
  const roleId = await seedRbac();

  const exam = await prisma.exam.upsert({
    where: { key: "APPSC_GROUP_1" },
    update: {},
    create: { key: "APPSC_GROUP_1", name: "APPSC Group-1", description: "Andhra Pradesh Group-1" },
  });

  // Optional: set a password on the super admin so email/password login works
  // out of the box in development. Provide SEED_ADMIN_PASSWORD to enable.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const passwordHash = adminPassword ? await hashPassword(adminPassword) : null;

  const admin = await prisma.user.upsert({
    where: { email: "admin@bhavishyaias.app" },
    update: passwordHash ? { passwordHash } : {},
    create: {
      email: "admin@bhavishyaias.app",
      name: "Super Admin",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      primaryExamId: exam.id,
      passwordHash,
    },
  });
  const superRoleId = roleId.get("SUPER_ADMIN");
  if (superRoleId) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superRoleId } },
      update: {},
      create: { userId: admin.id, roleId: superRoleId },
    });
  }

  // The official APPSC Group-1 syllabus (Prelims + Mains, micro-theme grain).
  const nodeCount = await seedSyllabusTree(exam.id, buildAppscSyllabus());

  // A few sample PYQs + current affairs so the modules are demonstrable.
  const pyqCount = await seedSamplePyqs(exam.id, admin.id);
  const caCount = await seedSampleCurrentAffairs(exam.id, admin.id);

  console.log(
    `Seed complete: RBAC, exam, super admin, ${nodeCount} syllabus nodes, ${pyqCount} PYQs, ${caCount} current affairs.`,
  );
  console.log(
    passwordHash
      ? "Super admin password set from SEED_ADMIN_PASSWORD (admin@bhavishyaias.app)."
      : "Tip: set SEED_ADMIN_PASSWORD to enable password login for admin@bhavishyaias.app.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
