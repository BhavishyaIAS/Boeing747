import type { NextRequest } from "next/server";
import { handle, ok, parseBody } from "@server/api";
import { authService, forgotPasswordSchema } from "@modules/identity";

/**
 * POST /api/v1/auth/forgot-password
 * Emails a password-reset token. Always returns success (no account enumeration).
 */
export async function POST(req: NextRequest): Promise<Response> {
  return handle(async () => {
    const { email } = await parseBody(req, forgotPasswordSchema);
    await authService.requestPasswordReset(email);
    return ok({ sent: true });
  });
}
