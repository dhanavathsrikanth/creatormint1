"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Compass, ShoppingBag, Rocket, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const navItems = [
  { href: "/buyer",         label: "Discover",     icon: Compass, exact: true },
  { href: "/buyer/orders",  label: "My Orders",    icon: ShoppingBag },
  { href: "/buyer/roadmap", label: "Feature Board", icon: Rocket },
];

interface BuyerShellProps {
  profile: Profile;
  children: React.ReactNode;
}

export function BuyerShell({ profile, children }: BuyerShellProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const initials = (profile.full_name ?? profile.email ?? "U")
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] border-r border-border sidebar-bg shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/buyer" className="flex items-center gap-2.5 font-bold text-foreground">
            <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">
              CM
            </span>
            <span>CreatorMint</span>
          </Link>
        </div>

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
        </nav>

        <div className="px-3 pb-4 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50">
            <Avatar className="w-7 h-7">
              <AvatarImage src={profile.avatar_url ?? ""} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile.full_name ?? "Buyer"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
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
          <Breadcrumbs homeHref="/buyer" />
        </div>
        {children}
      </main>
    </div>
  );
}
