import { z } from "zod";

const email = z.string().email().max(254);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a digit");
const otp = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email,
  password,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({ email, otp });
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const requestOtpSchema = z.object({ email });
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({ email, otp });
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email,
  token: z.string().min(10),
  password,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const loginSchema = z.object({ email, password: z.string().min(1) });
export type LoginInput = z.infer<typeof loginSchema>;
