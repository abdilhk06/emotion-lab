"use client";

import { ReactNode } from "react";
import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export function AppLayout({
  title,
  children,
  nav,
}: {
  title: string;
  children: ReactNode;
  nav: NavItem[];
}) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="sidebar-logo" href="/dashboard">
          <span className="brand-logo brand-logo-sm" />Emotion Lab
        </Link>
        <nav className="sidebar-nav" aria-label="Navigation principale">
          {nav.map((item) => (
            <Link
              key={item.href}
              className={`sidebar-link ${item.active ? "active" : ""}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="app-main">
        <header className="app-main-header">
          <h1>{title}</h1>
        </header>
        <section className="app-main-content">{children}</section>
      </main>
    </div>
  );
}
