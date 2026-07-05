import { adminNav } from "@config/nav";
import { ThemeToggle } from "@components/providers/theme-toggle";
import { NavLink } from "./nav-link";

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] max-lg:grid-cols-1">
      <aside className="border-r border-border bg-surface p-4 max-lg:hidden">
        <div className="mb-6 px-2">
          <div className="font-serif text-lg font-bold">
            Bhavishya <span className="text-primary">IAS</span>
          </div>
          <div className="text-xs uppercase tracking-wider text-faint">Admin Console</div>
        </div>
        <nav className="flex flex-col gap-1">
          {adminNav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-surface/85 px-6 backdrop-blur">
          <span className="text-sm text-muted">Content Management</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted max-sm:hidden">{email}</span>
            <ThemeToggle />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

/** Shown when the visitor isn't signed in or lacks admin access. */
export function AccessNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
