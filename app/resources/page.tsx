"use client";

import { AppLayout } from "@/components/app-layout/AppLayout";
import { Resource } from "@/components/resources/ResourceCard";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { UrgentHelpBanner } from "@/components/resources/UrgentHelpBanner";

const RESOURCES: Resource[] = [
  {
    id: "respiration-4-7-8",
    icon: "🌬️",
    title: "Respiration 4-7-8",
    category: "Stress",
    type: "Exercice",
    duration: "3 min",
    description: "Une technique de respiration guidee pour apaiser rapidement le systeme nerveux avant un cours ou un examen.",
    ctaLabel: "Decouvrir l'exercice",
    href: "#",
  },
  {
    id: "sommeil-examens",
    icon: "😴",
    title: "Sommeil en periode d'examens",
    category: "Sommeil",
    type: "Article",
    duration: "4 min",
    description: "Des conseils concrets pour proteger ton sommeil pendant les revisions et eviter l'effet nuit blanche.",
    ctaLabel: "Lire les conseils",
    href: "#",
  },
  {
    id: "methode-pomodoro",
    icon: "🍅",
    title: "Methode Pomodoro",
    category: "Organisation",
    type: "Guide",
    duration: "5 min",
    description: "Structure tes sessions de travail en blocs courts pour mieux te concentrer et reduire la charge mentale.",
    ctaLabel: "Appliquer la methode",
    href: "#",
  },
  {
    id: "stress-oral",
    icon: "🎤",
    title: "Gerer le stress avant un oral",
    category: "Examens",
    type: "Fiche pratique",
    duration: "6 min",
    description: "Un plan simple pour preparer ton passage, reguler ton stress et gagner en confiance juste avant de parler.",
    ctaLabel: "Voir la fiche",
    href: "#",
  },
];

export default function ResourcesPage() {
  return (
    <AppLayout title="Ressources">
      <section className="resources-page-intro">
        <h2>Ressources pour t&apos;accompagner</h2>
        <p>Articles, conseils pratiques et outils rapides pour ton bien-etre et ta reussite etudiante.</p>
      </section>
      <UrgentHelpBanner />
      <ResourceGrid resources={RESOURCES} />
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
      `}</style>
    </AppLayout>
  );
}
