import { currentActor } from "@server/auth-context";
import { can } from "@server/authorize";
import { PERMISSIONS } from "@modules/identity";
import { AccessNotice, AdminShell } from "@components/shell/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await currentActor();

  if (!actor) {
    // Once the marketing/auth pages ship (Phase 10+), this becomes redirect("/login").
    return (
      <AccessNotice
        title="Sign in required"
        message="You need to sign in to access the admin console."
      />
    );
  }

  const allowed =
    can(actor, PERMISSIONS.CONTENT_UPDATE) ||
    can(actor, PERMISSIONS.CONTENT_REVIEW) ||
    can(actor, PERMISSIONS.USER_MANAGE);

  if (!allowed) {
    return (
      <AccessNotice
        title="Not authorized"
        message="Your account doesn't have permission to use the admin console."
      />
    );
  }

  return <AdminShell email={actor.email}>{children}</AdminShell>;
}
