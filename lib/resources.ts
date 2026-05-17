import { FALLBACK_RESOURCES, type ResourceDetail } from "@/lib/data/resources";
import { getSupabaseClient } from "@/lib/supabase/client";

type ResourceRow = {
  id?: string;
  title?: string | null;
  slug?: string | null;
  category?: string | null;
  type?: string | null;
  duration?: string | null;
  emoji?: string | null;
  icon?: string | null;
  excerpt?: string | null;
  content?: string | null;
  description?: string | null;
  url?: string | null;
  is_published?: boolean | null;
  published?: boolean | null;
};

export type ResourceLoadResult = {
  resources: ResourceDetail[];
  source: "supabase" | "fallback";
  error?: string;
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugFromRow(row: ResourceRow): string {
  if (row.slug?.trim()) return row.slug.trim();
  if (row.url?.includes("/resources/")) return row.url.split("/resources/").pop()?.replace(/^\/+|\/+$/g, "") || "";
  return slugify(row.title || row.id || "resource");
}

function enrichRow(row: ResourceRow): ResourceDetail {
  const slug = slugFromRow(row);
  const fallback = FALLBACK_RESOURCES.find((resource) => resource.slug === slug || resource.title === row.title);
  const title = row.title?.trim() || fallback?.title || "Ressource";
  const description = row.excerpt?.trim() || row.description?.trim() || row.content?.trim() || fallback?.description || "";

  return {
    id: row.id || fallback?.id || slug,
    slug,
    icon: row.emoji?.trim() || row.icon?.trim() || fallback?.icon || "📚",
    title,
    category: row.category?.trim() || fallback?.category || "Ressources",
    type: row.type?.trim() || fallback?.type || "Article",
    duration: row.duration?.trim() || fallback?.duration || "4 min",
    description,
    ctaLabel: fallback?.ctaLabel || "Découvrir",
    isPublished: row.is_published ?? row.published ?? fallback?.isPublished ?? true,
    sections:
      row.content && !fallback
        ? [
            { kind: "intro", content: row.content },
            { kind: "remember", content: "Prends ce qui t'aide aujourd'hui, puis reviens-y quand tu en as besoin." },
          ]
        : fallback?.sections || [{ kind: "paragraph", content: description }],
    toc: fallback?.toc || ["Lire la ressource", "À retenir"],
    related: fallback?.related || FALLBACK_RESOURCES.filter((resource) => resource.slug !== slug).slice(0, 2).map((resource) => resource.slug),
  };
}

export async function loadResources(): Promise<ResourceLoadResult> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });

    if (error) {
      return { resources: FALLBACK_RESOURCES, source: "fallback", error: error.message };
    }

    const published = ((data as ResourceRow[] | null) ?? []).filter((row) => row.is_published ?? row.published ?? true);
    if (published.length === 0) {
      return { resources: FALLBACK_RESOURCES, source: "fallback" };
    }

    return { resources: published.map(enrichRow), source: "supabase" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de charger les ressources.";
    return { resources: FALLBACK_RESOURCES, source: "fallback", error: message };
  }
}

export function findResource(resources: ResourceDetail[], slug: string): ResourceDetail | undefined {
  return resources.find((resource) => resource.slug === slug);
}
