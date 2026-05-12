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
      <button className="btn btn-tertiary" type="button" onClick={onLogout} disabled={loading}>
        {loading ? "Deconnexion..." : "Me deconnecter"}
      </button>
      {error ? <p className="dashboard-error">{error}</p> : null}
    </div>
  );
}
