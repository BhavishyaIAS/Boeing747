import { currentActor } from "@server/auth-context";
import { AccessNotice } from "@components/shell/admin-shell";
import { StudentShell } from "@components/shell/student-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await currentActor();
  if (!actor) {
    return (
      <AccessNotice
        title="Sign in required"
        message="Sign in to access your dashboard and study tools."
      />
    );
  }
  return <StudentShell email={actor.email}>{children}</StudentShell>;
}
