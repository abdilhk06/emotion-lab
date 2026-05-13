"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { clearLegacyTestFlowStorage } from "@/lib/test-flow-storage";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onLogout = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        return;
      }
      clearLegacyTestFlowStorage();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Impossible de te deconnecter pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logout-block">
      <button className="sidebar-link logout-link" type="button" onClick={onLogout} disabled={loading}>
        <span className="sidebar-link-main">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 7V5H5v14h9v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 12h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="m17 9 3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{loading ? "Deconnexion..." : "Me deconnecter"}</span>
        </span>
      </button>
      {error ? <p className="dashboard-error">{error}</p> : null}
    </div>
  );
}
