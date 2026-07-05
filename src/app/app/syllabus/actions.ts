"use server";

import { revalidatePath } from "next/cache";
import type { NodeProgressStatus } from "@prisma/client";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { nodeProgressService } from "@modules/learning";

export async function markNodeAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  const nodeId = String(formData.get("nodeId"));
  const slug = String(formData.get("slug"));
  const status = String(formData.get("status")) as NodeProgressStatus;
  await nodeProgressService.markStatus(actor, exam.id, nodeId, status);
  revalidatePath(`/app/syllabus/${slug}`);
}
