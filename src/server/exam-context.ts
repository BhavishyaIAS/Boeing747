import type { Exam } from "@prisma/client";
import { prisma } from "@lib/db";

/**
 * Resolves the active exam context. At launch there is a single exam
 * (APPSC Group-1); as more exams are added this becomes user/route driven.
 */
export async function getDefaultExam(): Promise<Exam> {
  const exam = await prisma.exam.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (!exam) throw new Error("No active exam configured — run the seed");
  return exam;
}
