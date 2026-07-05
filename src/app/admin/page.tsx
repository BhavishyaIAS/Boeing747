import Link from "next/link";
import { FileText, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@ui/card";

export default function AdminOverviewPage() {
  const tiles = [
    {
      href: "/admin/content",
      title: "Content",
      description: "Create, edit, review and publish notes, PYQs and more.",
      icon: FileText,
    },
    {
      href: "/admin/users",
      title: "Users & Roles",
      description: "Manage accounts and assign roles across the platform.",
      icon: Users,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold">Admin Console</h1>
      <p className="mb-6 text-muted">Manage the platform's content and people.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="group">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-5">
                <span className="rounded-lg bg-primary-subtle p-2.5 text-primary">
                  <t.icon className="size-5" />
                </span>
                <div>
                  <CardTitle className="group-hover:text-primary">{t.title}</CardTitle>
                  <CardDescription className="mt-1">{t.description}</CardDescription>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
