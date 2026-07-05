import type { RoleKey } from "@prisma/client";
import { requireActor } from "@server/auth-context";
import { adminIdentityService } from "@modules/identity";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { Select } from "@ui/field";
import { Table, TD, TH, THead, TR } from "@ui/table";
import { assignRoleAction, removeRoleAction } from "./actions";

export const dynamic = "force-dynamic";

const ALL_ROLES: RoleKey[] = [
  "STUDENT",
  "FACULTY",
  "CONTENT_EDITOR",
  "REVIEWER",
  "ADMIN",
  "SUPER_ADMIN",
];

export default async function UsersPage() {
  const actor = await requireActor();
  const { users } = await adminIdentityService.listUsers(actor, { limit: 100 });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-bold">Users &amp; Roles</h1>
      <p className="mb-5 text-muted">Assign or revoke roles. Granting Super Admin requires Super Admin.</p>

      <Table>
        <THead>
          <TR className="border-t-0">
            <TH>User</TH>
            <TH>Roles</TH>
            <TH>Add role</TH>
          </TR>
        </THead>
        <tbody>
          {users.map(({ user, roles }) => (
            <TR key={user.id} className="align-top">
              <TD>
                <div className="font-medium">{user.name ?? "—"}</div>
                <div className="text-xs text-muted">{user.email}</div>
              </TD>
              <TD>
                <div className="flex flex-wrap gap-1.5">
                  {roles.length === 0 ? (
                    <span className="text-xs text-faint">No roles</span>
                  ) : (
                    roles.map((r) => (
                      <form key={r.role} action={removeRoleAction} className="inline-flex">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value={r.role} />
                        <button
                          type="submit"
                          title="Remove role"
                          className="group inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-semibold text-primary hover:bg-danger-bg hover:text-danger"
                        >
                          {r.role}
                          <span aria-hidden className="opacity-60 group-hover:opacity-100">×</span>
                        </button>
                      </form>
                    ))
                  )}
                </div>
              </TD>
              <TD>
                <form action={assignRoleAction} className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <Select name="role" defaultValue="STUDENT" className="h-8 w-40 py-1 text-xs">
                    {ALL_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" size="sm" variant="secondary">
                    Add
                  </Button>
                </form>
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>

      {users.length === 0 ? (
        <p className="mt-6 text-center text-muted">No users yet.</p>
      ) : (
        <Badge className="mt-4" tone="neutral">
          {users.length} users
        </Badge>
      )}
    </div>
  );
}
