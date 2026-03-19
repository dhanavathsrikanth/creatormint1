"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  LayoutDashboard,
  LifeBuoy,
  Users,
  Users2,
  ShieldCheck,
  Map,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const navItems = [
  { href: "/admin",           label: "Overview",  icon: LayoutDashboard, exact: true },
  { href: "/admin/tickets",   label: "Tickets",   icon: LifeBuoy },
  { href: "/admin/accounts",  label: "Accounts",  icon: Users2 },
  { href: "/admin/creators",  label: "Creators",  icon: Users },
  { href: "/admin/roadmap",   label: "Roadmap",   icon: Map },
];

interface AdminShellProps {
  profile: Profile;
  children: React.ReactNode;
}

export function AdminShell({ profile, children }: AdminShellProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] border-r border-border bg-gray-950 shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2.5 font-bold text-white">
            <span className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-xs font-black">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span>Admin Panel</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(href, exact)
                  ? "bg-red-500/20 text-red-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-800">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Back to Dashboard
            </Link>
          </div>
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-800/50">
            <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(profile.full_name ?? "A")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.full_name ?? "Admin"}</p>
              <p className="text-xs text-gray-400 truncate">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="sticky top-0 z-10 h-11 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-5">
          <Breadcrumbs homeHref="/admin" />
        </div>
        {children}
      </main>
    </div>
  );
}
