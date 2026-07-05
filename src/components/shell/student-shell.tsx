import { studentNav } from "@config/nav";
import { ThemeToggle } from "@components/providers/theme-toggle";
import { NavLink } from "./nav-link";

export function StudentShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const initial = (email[0] ?? "A").toUpperCase();
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] max-lg:grid-cols-1">
      <aside className="border-r border-border bg-surface p-4 max-lg:hidden">
        <div className="mb-6 px-2">
          <div className="font-serif text-lg font-bold">
            Bhavishya <span className="text-primary">IAS</span>
          </div>
          <div className="text-xs uppercase tracking-wider text-faint">Towards a Brighter Future</div>
        </div>
        <nav className="flex flex-col gap-1">
          {studentNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              exact={item.exact}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-surface/85 px-6 backdrop-blur">
          <div className="hidden w-full max-w-sm items-center gap-2 rounded-md border border-border-strong bg-surface-muted px-3 py-1.5 text-sm text-faint sm:flex">
            <span>Search…</span>
            <kbd className="ml-auto rounded border border-border-strong px-1.5 text-xs">⌘K</kbd>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <span
              className="grid size-8 place-items-center rounded-full bg-primary-subtle text-sm font-semibold text-primary"
              title={email}
            >
              {initial}
            </span>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
