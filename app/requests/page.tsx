"use client";

import { AppLayout } from "@/components/app-layout/AppLayout";
import { RequestTabs } from "@/components/buddies/RequestTabs";

export default function RequestsPage() {
  return (
    <AppLayout title="Mes demandes">
      <RequestTabs />
    </AppLayout>
  );
}
