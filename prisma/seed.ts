import { PrismaClient, type RoleKey } from "@prisma/client";
import {
  PERMISSION_CATALOGUE,
  ROLE_PERMISSIONS,
} from "../src/modules/identity/rbac";
import { hashPassword } from "../src/modules/identity/password";
import { appscGroup1Syllabus, type RawNode } from "./syllabus/appsc-group1";

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
 * Idempotently seeds a syllabus tree. Slugs are the ancestor `key`s joined by
 * "-", giving every node a globally-unique, readable slug. Closure rows are
 * written for self (depth 0) and every ancestor.
 */
async function seedSyllabusTree(
  examId: string,
  nodes: RawNode[],
  parentId: string | null = null,
  parentSlug: string | null = null,
  ancestors: Ancestor[] = [],
): Promise<number> {
  let count = 0;
  let order = 0;
  for (const raw of nodes) {
    const slug = parentSlug ? `${parentSlug}-${raw.key}` : raw.key;
    let node = await prisma.syllabusNode.findFirst({ where: { examId, slug, parentId } });
    node ??= await prisma.syllabusNode.create({
      data: {
        examId,
        parentId,
        type: raw.type,
        title: raw.title,
        slug,
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
      count += await seedSyllabusTree(examId, raw.children, node.id, slug, childAncestors);
    }
    order += 1;
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

  // The official APPSC Group-1 syllabus (Prelims + Mains).
  const nodeCount = await seedSyllabusTree(exam.id, appscGroup1Syllabus);

  console.log(`Seed complete: RBAC, exam, super admin, and ${nodeCount} syllabus nodes.`);
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
