import type { NextRequest } from "next/server";
import { created, handle, parseBody } from "@server/api";
import { authService, registerSchema } from "@modules/identity";

/**
 * POST /api/v1/auth/register
 * Creates a PENDING account and emails a verification OTP. Returns the public
 * user (no password hash).
 */
export async function POST(req: NextRequest): Promise<Response> {
  return handle(async () => {
    const input = await parseBody(req, registerSchema);
    const user = await authService.register(input);
    return created(user);
  });
}
