import { NextResponse } from "next/server";
import { prisma } from "@lib/db";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe. Returns 200 when the database is reachable, 503
 * otherwise. Used by container orchestration and uptime monitoring.
 */
export async function GET(): Promise<NextResponse> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up", time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
