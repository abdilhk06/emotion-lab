"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { getSupabaseClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  pseudo: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pseudo, setPseudo] = useState<string>("Utilisateur");
  const [hasTestResult, setHasTestResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, pseudo")
          .eq("id", user.id)
          .maybeSingle<Profile>();

        if (profileError) {
          setError(profileError.message);
        }

        if (profile?.pseudo) {
          setPseudo(profile.pseudo);
        }

        const { data: tests, error: testsError } = await supabase
          .from("test_results")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (testsError) {
          setHasTestResult(false);
        } else {
          setHasTestResult(Boolean(tests && tests.length > 0));
        }
      } catch {
        setError("Une erreur inattendue est survenue sur le dashboard.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [router]);

  const nav = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", active: true },
      { href: "/results", label: "Mes resultats" },
      { href: "/buddies", label: "Buddies" },
      { href: "/messages", label: "Messages" },
      { href: "/resources", label: "Ressources" },
    ],
    []
  );

  if (loading) {
    return (
      <AppLayout title="Dashboard" nav={nav}>
        <p>Chargement de ton espace...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard" nav={nav}>
      <div className="dashboard-greeting">
        <p className="dashboard-label">Bonjour,</p>
        <h2>{pseudo}</h2>
      </div>

      {error ? <p className="dashboard-error">{error}</p> : null}

      <DashboardCards hasTestResult={hasTestResult} />

      <LogoutButton />
    </AppLayout>
  );
}
