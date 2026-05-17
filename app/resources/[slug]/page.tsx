"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { ResourceDetailView } from "@/components/resources/ResourceDetailView";
import { findResource, loadResources, type ResourceLoadResult } from "@/lib/resources";
import { getSupabaseClient } from "@/lib/supabase/client";

type DetailState =
  | { status: "loading" }
  | { status: "ready"; result: ResourceLoadResult }
  | { status: "error"; message: string; result: ResourceLoadResult };

export default function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [state, setState] = useState<DetailState>({ status: "loading" });

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
        const message = error instanceof Error ? error.message : "Impossible de charger cette ressource.";
        const result = await loadResources();
        setState({ status: "error", message, result });
      }
    };

    void run();
  }, [router]);

  const result = state.status === "loading" ? null : state.result;
  const resource = result ? findResource(result.resources, slug) : undefined;

  return (
    <AppLayout title={resource?.title || "Ressource"}>
      {state.status === "loading" ? (
        <section className="detail-state" role="status" aria-live="polite">
          <h2>Chargement de la ressource...</h2>
          <p>On prépare la fiche demandée.</p>
        </section>
      ) : null}

      {state.status === "error" && resource ? (
        <section className="detail-state detail-state-warning" role="status">
          <h2>Version locale affichée</h2>
          <p>La lecture Supabase a échoué : {state.message}</p>
        </section>
      ) : null}

      {result && !resource ? (
        <section className="detail-state" role="status">
          <h2>Ressource introuvable</h2>
          <p>Cette fiche n&apos;est pas publiée ou n&apos;existe pas encore.</p>
          <Link className="back-link" href="/resources">
            Retour aux ressources
          </Link>
        </section>
      ) : null}

      {resource ? <ResourceDetailView resource={resource} resources={result?.resources || []} /> : null}

      <style jsx>{`
        .detail-state {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 18px;
        }

        .detail-state h2 {
          margin: 0 0 8px;
          color: var(--plum);
        }

        .detail-state p {
          margin: 0 0 14px;
          color: var(--texte-gris);
        }

        .detail-state-warning {
          margin-bottom: 14px;
          background: #fffbf7;
          border-color: #f1d2ba;
        }

        .back-link {
          color: var(--bleu-ciel);
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </AppLayout>
  );
}
