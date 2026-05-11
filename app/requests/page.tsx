"use client";

import { AppLayout } from "@/components/app-layout/AppLayout";
import { RequestTabs } from "@/components/buddies/RequestTabs";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/results", label: "Mes resultats" },
  { href: "/buddies", label: "Annuaire Buddy" },
  { href: "/requests", label: "Mes demandes", active: true },
  { href: "/messages", label: "Messagerie" },
  { href: "/resources", label: "Ressources" },
];

export default function RequestsPage() {
  return (
    <AppLayout title="Mes demandes" nav={NAV}>
      <RequestTabs />
    </AppLayout>
  );
}
