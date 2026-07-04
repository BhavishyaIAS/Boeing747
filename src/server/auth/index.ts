import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { authService, loadActorByEmail, loginSchema, verifyOtpSchema } from "@modules/identity";
import type { Actor } from "@server/context";

/** Claims we store on the JWT (cast in callbacks; see next-auth.d.ts). */
type TokenClaims = { uid?: string; email?: string | null; roles?: Actor["roles"] };

/**
 * Auth.js (NextAuth v5) configuration. JWT sessions carry the user id + roles so
 * `authorize()` can build an Actor without a per-request DB read on the hot path.
 *
 * Providers:
 *  - Google OAuth (enabled when AUTH_GOOGLE_* env is present)
 *  - Credentials "password" — email + password
 *  - Credentials "otp" — email + one-time code (email OTP login)
 */
const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "password",
    name: "Email and password",
    credentials: { email: {}, password: {} },
    authorize: async (raw) => {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) return null;
      const user = await authService.verifyCredentials(parsed.data.email, parsed.data.password);
      return user ? { id: user.id, email: user.email, name: user.name } : null;
    },
  }),
  Credentials({
    id: "otp",
    name: "Email OTP",
    credentials: { email: {}, otp: {} },
    authorize: async (raw) => {
      const parsed = verifyOtpSchema.safeParse(raw);
      if (!parsed.success) return null;
      const user = await authService.verifyLoginOtp(parsed.data.email, parsed.data.otp);
      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth, provision/link a user in our schema. Credentials users are
      // already validated by their authorize() callback.
      if (account?.provider === "google") {
        if (!user.email) return false;
        await authService.ensureOAuthUser(user.email, user.name ?? null);
      }
      return true;
    },
    async jwt({ token, user }) {
      // On sign-in, resolve our DB user + roles and embed them in the token.
      if (user?.email) {
        const actor = await loadActorByEmail(user.email);
        if (actor) {
          const t = token as typeof token & TokenClaims;
          t.uid = actor.userId;
          t.email = actor.email;
          t.roles = actor.roles;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as TokenClaims;
      if (t.uid) {
        session.user.id = t.uid;
        session.user.roles = t.roles ?? [];
        if (t.email) session.user.email = t.email;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
