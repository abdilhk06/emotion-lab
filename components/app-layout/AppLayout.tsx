"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

type NavItem = {
  href: string;
  label: string;
  icon?: IconName;
  match: (pathname: string) => boolean;
};

type IconName = "home" | "chart" | "users" | "mail" | "message" | "bot" | "book" | "profile" | "settings";
type BadgeKey = "requests" | "messages";

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "home", match: (pathname) => pathname === "/dashboard" },
  { href: "/results", label: "Mes resultats", icon: "chart", match: (pathname) => pathname === "/results" || pathname === "/test/results" },
  { href: "/buddies", label: "Annuaire Buddy", icon: "users", match: (pathname) => pathname === "/buddies" || pathname.startsWith("/buddies/") },
  { href: "/requests", label: "Mes demandes", icon: "mail", match: (pathname) => pathname === "/requests" },
  { href: "/messages", label: "Messagerie", icon: "message", match: (pathname) => pathname === "/messages" || pathname.startsWith("/messages/") },
  { href: "/chatbot", label: "Chatbot", icon: "bot", match: (pathname) => pathname === "/chatbot" },
  { href: "/resources", label: "Ressources", icon: "book", match: (pathname) => pathname === "/resources" },
];

const BOTTOM_NAV: NavItem[] = [
  { href: "/profile", label: "Mon profil", icon: "profile", match: (pathname) => pathname === "/profile" },
  { href: "/settings", label: "Parametres", icon: "settings", match: (pathname) => pathname === "/settings" },
];

function navBadge(href: string, badges?: Partial<Record<BadgeKey, number>>): number | undefined {
  if (href === "/requests") return badges?.requests || undefined;
  if (href === "/messages") return badges?.messages || undefined;
  return undefined;
}

function SidebarIcon({ name }: { name: IconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10.8 9-7.2 9 7.2" />
        <path d="M5.5 9.5V20h5v-5.5h3V20h5V9.5" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-3" />
      </>
    ),
    users: (
      <>
        <path d="M16 18c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
        <path d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M20 18c0-1.7-1-3.1-2.5-3.7" />
        <path d="M17 5.2a2.6 2.6 0 0 1 0 5" />
      </>
    ),
    mail: (
      <>
        <path d="M4 6h16v12H4z" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    message: (
      <>
        <path d="M5 6h14v10H8l-3 3V6Z" />
      </>
    ),
    bot: (
      <>
        <path d="M8 10h8a3 3 0 0 1 3 3v4H5v-4a3 3 0 0 1 3-3Z" />
        <path d="M12 10V6" />
        <path d="M9 14h.01" />
        <path d="M15 14h.01" />
        <path d="M8 20h8" />
      </>
    ),
    book: (
      <>
        <path d="M6 4h12v16H6z" />
        <path d="M8 4v16" />
        <path d="M10 8h5" />
      </>
    ),
    profile: (
      <>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M5 21c.7-3.3 3.4-5 7-5s6.3 1.7 7 5" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.8-1L14.4 3h-4l-.4 3.1a7 7 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.8 1l.4 3.1h4l.4-3.1a7 7 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.6.1-1Z" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export function AppLayout({
  title,
  children,
  badges,
}: {
  title: string;
  children: ReactNode;
  badges?: Partial<Record<BadgeKey, number>>;
}) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="sidebar-logo" href="/dashboard">
          Emotion Lab
        </Link>
        <nav className="sidebar-nav" aria-label="Navigation principale">
          <p className="sidebar-menu-label">Menu</p>
          {MAIN_NAV.map((item) => {
            const badge = navBadge(item.href, badges);
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                className={`sidebar-link ${active ? "active" : ""}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                <span className="sidebar-link-main">
                  {item.icon ? <SidebarIcon name={item.icon} /> : null}
                  <span>{item.label}</span>
                </span>
                {badge ? <span className="sidebar-badge">{badge}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          {BOTTOM_NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                className={`sidebar-link ${active ? "active" : ""}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                <span className="sidebar-link-main">
                  {item.icon ? <SidebarIcon name={item.icon} /> : null}
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}
          <LogoutButton />
        </div>
      </aside>

      <main className="app-main">
        <header className="app-main-header sr-only">
          <h1>{title}</h1>
        </header>
        <section className="app-main-content">{children}</section>
      </main>
    </div>
  );
}
