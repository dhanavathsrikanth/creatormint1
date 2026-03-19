"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  ExternalLink,
  Store,
  LifeBuoy,
  TrendingUp,
  Activity,
  Rocket,
  Palette,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",               label: "Overview",      icon: LayoutDashboard, exact: true },
  { href: "/dashboard/products",      label: "Products",      icon: Package },
  { href: "/dashboard/store-builder", label: "Store Builder", icon: Palette },
  { href: "/dashboard/sales",         label: "Sales",         icon: TrendingUp },
  { href: "/dashboard/support",       label: "Support",       icon: LifeBuoy },
  { href: "/dashboard/settings",      label: "Settings",      icon: Settings },
  { href: "/roadmap",                 label: "Roadmap",       icon: Rocket },
];

interface DashboardShellProps {
  profile: Profile;
  children: React.ReactNode;
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const pathname = usePathname();

  const initials = (profile.full_name ?? profile.email ?? "CM")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] border-r border-border sidebar-bg shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-foreground">
            <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">
              CM
            </span>
            <span>CreatorMint</span>
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
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}

          <Separator className="my-3" />

          {profile.store_slug && (
            <a
              href={`/${profile.store_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Store className="w-4 h-4 shrink-0" />
              View store
              <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
            </a>
          )}
          <a
            href="/platform-status"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Activity className="w-4 h-4 shrink-0" />
            Platform Status
            <span className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <ExternalLink className="w-3 h-3 opacity-60" />
            </span>
          </a>
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50">
            <Avatar className="w-7 h-7">
              <AvatarImage src={profile.avatar_url ?? ""} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile.full_name ?? "Creator"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground text-sm">
          <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">CM</span>
          CreatorMint
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 md:overflow-auto">
        <div className="md:hidden h-14" />
        {/* Breadcrumb bar */}
        <div className="sticky top-0 z-10 h-11 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-5">
          <Breadcrumbs homeHref="/dashboard" />
        </div>
        {children}
      </main>
    </div>
  );
}
