import { PrismaClient, type RoleKey } from "@prisma/client";
import {
  PERMISSION_CATALOGUE,
  ROLE_PERMISSIONS,
} from "../src/modules/identity/rbac";
import { hashPassword } from "../src/modules/identity/password";

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

async function ensureNode(
  examId: string,
  parentId: string | null,
  type: "SUBJECT" | "UNIT" | "THEME" | "SUB_THEME" | "MICRO_THEME" | "CONCEPT",
  title: string,
  slug: string,
  orderIndex: number,
  ancestors: Ancestor[],
): Promise<{ id: string }> {
  let node = await prisma.syllabusNode.findFirst({ where: { examId, slug, parentId } });
  node ??= await prisma.syllabusNode.create({
    data: { examId, parentId, type, title, slug, orderIndex },
  });

  const closures: Ancestor[] = [{ id: node.id, depth: 0 }, ...ancestors];
  for (const anc of closures) {
    await prisma.syllabusClosure.upsert({
      where: { ancestorId_descendantId: { ancestorId: anc.id, descendantId: node.id } },
      update: {},
      create: { ancestorId: anc.id, descendantId: node.id, depth: anc.depth },
    });
  }
  return { id: node.id };
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

  // Sample syllabus slice: Polity → Constitution → Fundamental Rights.
  const subject = await ensureNode(exam.id, null, "SUBJECT", "Polity", "polity", 0, []);
  const unit = await ensureNode(exam.id, subject.id, "UNIT", "Constitution", "constitution", 0, [
    { id: subject.id, depth: 1 },
  ]);
  await ensureNode(exam.id, unit.id, "THEME", "Fundamental Rights", "fundamental-rights", 0, [
    { id: unit.id, depth: 1 },
    { id: subject.id, depth: 2 },
  ]);

  console.log("Seed complete: RBAC, exam, super admin, and a sample syllabus slice.");
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
