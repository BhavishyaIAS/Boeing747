"use server";

import { revalidatePath } from "next/cache";
import type { RoleKey } from "@prisma/client";
import { requireActor } from "@server/auth-context";
import { adminIdentityService } from "@modules/identity";

export async function assignRoleAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role")) as RoleKey;
  await adminIdentityService.assignRole(actor, userId, role);
  revalidatePath("/admin/users");
}

export async function removeRoleAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role")) as RoleKey;
  await adminIdentityService.removeRole(actor, userId, role);
  revalidatePath("/admin/users");
}
