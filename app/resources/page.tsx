"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { loadResources, type ResourceLoadResult } from "@/lib/resources";
import { getSupabaseClient } from "@/lib/supabase/client";

type PageState =
  | { status: "loading" }
  | { status: "ready"; result: ResourceLoadResult }
  | { status: "error"; message: string; result: ResourceLoadResult };

export default function ResourcesPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    const run = async () => {
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

        const result = await loadResources();
        if (result.error) {
          setState({ status: "error", message: result.error, result });
          return;
        }

        setState({ status: "ready", result });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de charger les ressources.";
        const result = await loadResources();
        setState({ status: "error", message, result });
      }
    };

    void run();
  }, [router]);

  const result = state.status === "loading" ? null : state.result;

  return (
    <AppLayout title="Ressources">
      <section className="resources-page-intro">
        <h2>Ressources pour t&apos;accompagner</h2>
        <p>Articles, conseils pratiques et outils rapides pour ton bien-être et ta réussite étudiante.</p>
      </section>

      {state.status === "loading" ? (
        <section className="resources-state" role="status" aria-live="polite">
          <h3>Chargement des ressources...</h3>
          <p>On prépare les fiches disponibles pour toi.</p>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="resources-state resources-state-warning" role="status">
          <h3>Ressources locales affichées</h3>
          <p>La lecture Supabase a échoué : {state.message}</p>
        </section>
      ) : null}

      {result ? <ResourceGrid resources={result.resources} /> : null}

      <style jsx>{`
        .resources-page-intro h2 {
          margin: 0 0 8px;
          color: var(--texte);
          font-size: 27px;
        }

        .resources-page-intro p {
          margin: 0;
          color: var(--texte-gris);
        }

        .resources-state {
          border: 1px solid var(--bordure);
          border-radius: 16px;
          background: #fff;
          padding: 18px;
        }

        .resources-state h3 {
          margin: 0 0 8px;
          color: var(--plum);
        }

        .resources-state p {
          margin: 0;
          color: var(--texte-gris);
        }

        .resources-state-warning {
          background: #fffbf7;
          border-color: #f1d2ba;
        }
      `}</style>
    </AppLayout>
  );
}
