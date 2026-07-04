/**
 * Identity module — public API. Authorization primitives, the auth service, and
 * session helpers. Other modules import only from here.
 */
export {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_CATALOGUE,
  type Permission,
  type PermissionGrant,
} from "./rbac";

export { AuthService, authService, type PublicUser, type AuthServiceDeps } from "./auth.service";
export { buildActor, loadActor, loadActorByEmail } from "./session";
export {
  PrismaIdentityRepository,
  type IdentityRepository,
  type ActorRoleRow,
} from "./identity.repository";
export { hashPassword, verifyPassword } from "./password";

export {
  registerSchema,
  verifyEmailSchema,
  requestOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  loginSchema,
  type RegisterInput,
  type VerifyEmailInput,
  type RequestOtpInput,
  type VerifyOtpInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type LoginInput,
} from "./dto";
