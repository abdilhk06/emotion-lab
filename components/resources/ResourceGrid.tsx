"use client";

import { useMemo, useState } from "react";
import { Resource, ResourceCard } from "@/components/resources/ResourceCard";

type ResourceGridProps = {
  resources: Resource[];
};

const ALL_CATEGORY = "Tous";

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function ResourceGrid({ resources }: ResourceGridProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);

  const categories = useMemo(() => {
    return [ALL_CATEGORY, ...new Set(resources.map((resource) => resource.category))];
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());

    return resources.filter((resource) => {
      const matchesCategory = activeCategory === ALL_CATEGORY || resource.category === activeCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = normalizeSearch([resource.title, resource.category, resource.description, resource.type].join(" "));
      return haystack.includes(normalizedQuery);
    });
  }, [activeCategory, query, resources]);

  return (
    <section className="resources-stack">
      <div className="resources-controls">
        <label className="search-wrap" htmlFor="resource-search">
          <span className="search-label">Rechercher</span>
          <input
            id="resource-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titre, catégorie ou contenu"
          />
        </label>

        <div className="chips-row" role="listbox" aria-label="Filtrer par catégorie">
          {categories.map((category) => {
            const selected = category === activeCategory;

            return (
              <button
                key={category}
                type="button"
                role="option"
                aria-selected={selected}
                className={`chip ${selected ? "active" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {filteredResources.length > 0 ? (
        <div className="resources-grid">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="empty-state" role="status" aria-live="polite">
          <h3>Aucune ressource ne correspond à ta recherche</h3>
          <p>Essaie un autre mot-clé ou change de catégorie. On ajoute progressivement de nouvelles ressources.</p>
        </div>
      )}

      <style jsx>{`
        .resources-stack {
          display: grid;
          gap: 16px;
        }

        .resources-controls {
          display: grid;
          gap: 12px;
        }

        .search-wrap {
          display: grid;
          gap: 8px;
        }

        .search-label {
          font-size: 13px;
          color: var(--texte-clair);
          font-weight: 600;
        }

        .search-wrap input {
          height: 46px;
          border-radius: 12px;
          border: 1px solid var(--bordure);
          background: #fff;
          padding: 0 14px;
          font-size: 14px;
        }

        .search-wrap input:focus-visible {
          outline: 2px solid #8ec0c9;
          outline-offset: 1px;
        }

        .chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chip {
          border: 1px solid #d8cfe3;
          background: #fff;
          color: var(--texte-gris);
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .chip.active {
          border-color: var(--plum);
          background: #f8eef5;
          color: var(--plum);
        }

        .resources-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .empty-state {
          border: 1px dashed #cbbdd7;
          border-radius: 16px;
          background: #fff;
          padding: 24px 18px;
          text-align: center;
        }

        .empty-state h3 {
          margin: 0 0 8px;
          color: var(--plum);
        }

        .empty-state p {
          margin: 0;
          color: var(--texte-gris);
        }

        @media (max-width: 860px) {
          .resources-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
