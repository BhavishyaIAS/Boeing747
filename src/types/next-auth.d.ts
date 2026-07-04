import type { RoleKey } from "@prisma/client";
import type { DefaultSession } from "next-auth";

interface ActorRoleClaim {
  role: RoleKey;
  examId: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: ActorRoleClaim[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    roles?: ActorRoleClaim[];
  }
}
