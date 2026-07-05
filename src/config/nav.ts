import {
  BookOpen,
  FileQuestion,
  FileText,
  LayoutDashboard,
  Library,
  Newspaper,
  Users,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match the path exactly (for section roots like the dashboard/overview). */
  exact?: boolean;
}

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/users", label: "Users & Roles", icon: Users },
];

export const studentNav: NavItem[] = [
  { href: "/app", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/app/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/app/pyqs", label: "PYQs", icon: FileQuestion },
  { href: "/app/current-affairs", label: "Current Affairs", icon: Newspaper },
  { href: "/app/tests", label: "Tests", icon: ClipboardCheck },
  { href: "/app/library", label: "Library", icon: Library },
];
