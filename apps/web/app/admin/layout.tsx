import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";
import { requireStaff } from "@/lib/authz";

export const metadata: Metadata = pageMetadata({
  title: "Admin",
  description: "Internal operations.",
  path: "/admin",
  noIndex: true
});

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/usage", label: "Usage and budget" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/readiness", label: "Launch readiness" }
];

/**
 * Admin shell.
 *
 * Authorization is checked here on the server for every admin route, and Row
 * Level Security independently constrains what any query can return. Neither is
 * a substitute for the other.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();

  if (!session.authorized) {
    return (
      <div className="container-narrow py-20">
        <h1 className="text-3xl font-bold">Not available</h1>
        <p className="mt-4 text-[var(--text-muted)]">{session.message}</p>
      </div>
    );
  }

  return (
    <div className="container-wide py-10">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Admin" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {NAV.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--purple-subtle)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
