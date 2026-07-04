import type { NextRequest } from "next/server";
import { handle, ok, parseBody } from "@server/api";
import { authService, requestOtpSchema } from "@modules/identity";

/**
 * POST /api/v1/auth/otp
 * Requests an email one-time code for sign-in. Always returns success (no
 * account enumeration). Complete the login via the "otp" Credentials provider.
 */
export async function POST(req: NextRequest): Promise<Response> {
  return handle(async () => {
    const { email } = await parseBody(req, requestOtpSchema);
    await authService.requestLoginOtp(email);
    return ok({ sent: true });
  });
}
