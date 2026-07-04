import type { NextRequest } from "next/server";
import { handle, ok, parseBody } from "@server/api";
import { authService, verifyEmailSchema } from "@modules/identity";

/**
 * POST /api/v1/auth/verify
 * Confirms an account with the emailed OTP; marks the email verified + ACTIVE.
 */
export async function POST(req: NextRequest): Promise<Response> {
  return handle(async () => {
    const { email, otp } = await parseBody(req, verifyEmailSchema);
    await authService.verifyEmail(email, otp);
    return ok({ verified: true });
  });
}
