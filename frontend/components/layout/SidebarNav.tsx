"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, FileStack, Gauge, History, PlusCircle, Settings, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/workspace", label: "Learning Workspace", icon: Gauge },
  { href: "/tasks", label: "Meine Aufgaben", icon: FileStack },
  { href: "/history", label: "Verlauf", icon: History },
  { href: "/concepts", label: "Konzepte", icon: BookOpen },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8000";

interface SidebarNavProps {
  email: string;
}

export function SidebarNav({ email }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch(`${FASTAPI_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-72 flex-col border-r bg-card/70 p-5 backdrop-blur lg:flex">
      <div className="mb-6 space-y-1">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Didactic Studio</p>
        <h1 className="text-xl font-semibold tracking-tight">CodeMentor Learn</h1>
      </div>

      <Link
        href="/workspace"
        className="mb-6 flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
      >
        <PlusCircle className="h-4 w-4" />
        Neue Session
      </Link>

      <nav className="space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        {email ? (
          <div className="rounded-xl border bg-background p-3">
            <p className="text-xs font-medium text-muted-foreground">Angemeldet als</p>
            <p className="truncate text-sm font-medium">{email}</p>
            <button
              onClick={handleLogout}
              className="mt-2 w-full rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              Abmelden
            </button>
          </div>
        ) : null}
        <div className="rounded-xl border bg-background p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Privacy Badge
          </div>
          <p className="text-xs text-muted-foreground">
            Lokale Verarbeitung bevorzugt. Keine sensiblen Daten ohne Freigabe senden.
          </p>
        </div>
      </div>
    </aside>
  );
}
