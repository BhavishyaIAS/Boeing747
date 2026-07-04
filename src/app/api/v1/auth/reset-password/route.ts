import type { NextRequest } from "next/server";
import { handle, ok, parseBody } from "@server/api";
import { authService, resetPasswordSchema } from "@modules/identity";

/**
 * POST /api/v1/auth/reset-password
 * Sets a new password using a valid, unexpired reset token.
 */
export async function POST(req: NextRequest): Promise<Response> {
  return handle(async () => {
    const { email, token, password } = await parseBody(req, resetPasswordSchema);
    await authService.resetPassword(email, token, password);
    return ok({ reset: true });
  });
}
