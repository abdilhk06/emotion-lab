export type ResourceCategory = "Stress" | "Sommeil" | "Organisation" | "Examens";

export type ResourceSection =
  | { kind: "intro"; content: string }
  | { kind: "heading"; title: string }
  | { kind: "paragraph"; content: string }
  | { kind: "stat"; value: string; title: string; content: string; tag?: string }
  | { kind: "tips"; items: Array<{ title: string; content: string }> }
  | { kind: "warning"; title: string; content: string }
  | { kind: "remember"; content: string }
  | { kind: "breathing" }
  | { kind: "breathingPhases" }
  | { kind: "benefits"; items: Array<{ content: string }> }
  | { kind: "pomodoro" }
  | { kind: "steps"; items: Array<{ title: string; content: string }> }
  | { kind: "pauseTips" }
  | { kind: "oralPhase"; icon: string; title: string; subtitle: string; items: Array<{ title: string; content: string }> }
  | { kind: "emergency"; title: string; content: string; quote: string; footer: string };

export type ResourceDetail = {
  id: string;
  slug: string;
  icon: string;
  title: string;
  category: ResourceCategory | string;
  type: string;
  duration: string;
  description: string;
  ctaLabel: string;
  isPublished: boolean;
  sections: ResourceSection[];
  toc: string[];
  related: string[];
};

export const FALLBACK_RESOURCES: ResourceDetail[] = [
  {
    id: "respiration-4-7-8",
    slug: "respiration-4-7-8",
    icon: "🌬️",
    title: "Respiration 4-7-8",
    category: "Stress",
    type: "Exercice",
    duration: "3 min",
    description:
      "Une technique de respiration guidée pour apaiser rapidement ton système nerveux avant un cours ou un examen. Inspire 4 secondes, retiens 7, expire 8.",
    ctaLabel: "Découvrir l'exercice",
    isPublished: true,
    toc: ["L'exercice guidé", "Comment ça marche", "Pourquoi ça marche", "Conseils pratiques", "À retenir"],
    related: ["stress-oral", "sommeil-examens"],
    sections: [
      { kind: "breathing" },
      { kind: "heading", title: "Comment ça marche" },
      {
        kind: "paragraph",
        content:
          "La respiration 4-7-8 a été popularisée par le Dr Andrew Weil. C'est l'une des techniques les plus efficaces pour activer ton système parasympathique, celui qui dit à ton corps que tout va bien et qu'il peut se détendre.",
      },
      { kind: "breathingPhases" },
      { kind: "heading", title: "Pourquoi ça marche ?" },
      {
        kind: "benefits",
        items: [
          { content: "L'expiration longue déclenche le nerf vague, qui ralentit le rythme cardiaque et apaise le mental en moins d'une minute." },
          { content: "Compter active ton cortex préfrontal et empêche les pensées en boucle de prendre le dessus." },
          { content: "4 cycles suffisent à réduire la tension ressentie et à retrouver une sensation de contrôle." },
        ],
      },
      { kind: "heading", title: "Conseils pour bien le faire" },
      {
        kind: "paragraph",
        content:
          "Pratique cet exercice 2 fois par jour au début. L'effet se renforce avec la régularité, puis tu pourras l'utiliser comme un réflexe avant n'importe quelle situation stressante.",
      },
      {
        kind: "paragraph",
        content:
          "Reste assis·e ou allongé·e, le dos droit. Si tu te sens un peu étourdi·e les premières fois, réduis simplement à 3 cycles au lieu de 4.",
      },
      {
        kind: "warning",
        title: "Bon à savoir",
        content:
          "Si tu as de l'asthme ou un problème respiratoire chronique, parle-en d'abord à ton médecin. La rétention de souffle peut être inconfortable au début.",
      },
      {
        kind: "remember",
        content:
          "Choisis une technique de respiration et pratique-la régulièrement, plutôt que d'en essayer cinq de temps en temps. La régularité compte plus que la diversité.",
      },
    ],
  },
  {
    id: "sommeil-examens",
    slug: "sommeil-examens",
    icon: "😴",
    title: "Sommeil en période d'examens",
    category: "Sommeil",
    type: "Article",
    duration: "4 min",
    description:
      "Des conseils concrets pour protéger ton sommeil pendant les révisions et éviter l'effet nuit blanche.",
    ctaLabel: "Lire les conseils",
    isPublished: true,
    toc: ["Le minimum : 7 heures", "Routine de fin de soirée", "Si tu n'arrives pas à dormir", "Les siestes", "À retenir"],
    related: ["respiration-4-7-8", "methode-pomodoro"],
    sections: [
      {
        kind: "intro",
        content:
          "En période de partiels, le sommeil est souvent la première chose qu'on sacrifie. Grave erreur. Ton cerveau consolide ce que tu as appris pendant que tu dors.",
      },
      { kind: "heading", title: "Le minimum non négociable : 7 heures" },
      {
        kind: "stat",
        value: "-30%",
        title: "de capacités cognitives le lendemain",
        content: "quand tu dors moins de 7h. C'est comme passer ton examen légèrement ivre.",
        tag: "étude Stanford",
      },
      {
        kind: "paragraph",
        content:
          "Si tu dois choisir entre 2 heures de révision en plus ou 2 heures de sommeil en plus à 1 jour de l'examen, choisis toujours le sommeil.",
      },
      { kind: "heading", title: "Crée une routine de fin de soirée" },
      {
        kind: "tips",
        items: [
          { title: "Pas d'écran 30 minutes avant de te coucher.", content: "La lumière bleue bloque la production de mélatonine." },
          { title: "Température de la chambre entre 18 et 20°C.", content: "Plus c'est frais, mieux tu dors." },
          { title: "Pas de café après 14h.", content: "La caféine reste active pendant plusieurs heures." },
          { title: "Ne révise pas dans ton lit.", content: "Révise au bureau, dors au lit." },
        ],
      },
      { kind: "heading", title: "Si tu n'arrives pas à dormir" },
      {
        kind: "paragraph",
        content:
          "Ne reste pas dans ton lit à ruminer. Lève-toi, va dans une autre pièce, lis un livre papier pendant 15 minutes, puis retourne te coucher.",
      },
      { kind: "heading", title: "Les siestes : oui, mais bien" },
      {
        kind: "paragraph",
        content:
          "Une sieste de 20 minutes en début d'après-midi peut booster ta mémoire. Au-delà de 30 minutes, tu entres en sommeil profond et le réveil devient plus difficile.",
      },
      {
        kind: "warning",
        title: "L'alcool et le sommeil",
        content:
          "Un verre te fera tomber de sommeil plus vite, mais ton sommeil sera de mauvaise qualité. En période d'examens : coupure totale.",
      },
      {
        kind: "remember",
        content:
          "Dormir n'est pas perdre du temps : c'est le moment où ton cerveau range ce que tu as appris. Un·e étudiant·e qui dort 7 heures et révise 4 heures apprend plus qu'un·e étudiant·e qui dort 4 heures et révise 7 heures.",
      },
    ],
  },
  {
    id: "methode-pomodoro",
    slug: "methode-pomodoro",
    icon: "🍅",
    title: "Méthode Pomodoro",
    category: "Organisation",
    type: "Guide",
    duration: "5 min",
    description:
      "Structure tes sessions de travail en blocs courts pour mieux te concentrer et réduire la charge mentale.",
    ctaLabel: "Appliquer la méthode",
    isPublished: true,
    toc: ["Le principe", "Pourquoi ça marche", "Comment bien le faire", "Bien faire ses pauses", "Les variantes", "À retenir"],
    related: ["stress-oral", "sommeil-examens"],
    sections: [
      { kind: "pomodoro" },
      {
        kind: "intro",
        content:
          "Tu n'arrives pas à te concentrer plus de 10 minutes ? La méthode Pomodoro est l'outil le plus simple pour travailler en sessions intenses et faire des pauses sans culpabiliser.",
      },
      { kind: "heading", title: "Le principe en 3 phrases" },
      {
        kind: "paragraph",
        content:
          "Tu travailles intensément pendant 25 minutes, sans distraction. Puis tu prends 5 minutes de pause. Après 4 pomodoros, tu prends une pause plus longue de 15 à 30 minutes.",
      },
      { kind: "heading", title: "Pourquoi ça marche" },
      {
        kind: "paragraph",
        content:
          "Notre cerveau a une attention maximale limitée. La méthode transforme « je dois travailler des heures » en « je dois juste travailler 25 minutes ».",
      },
      { kind: "heading", title: "Comment bien le faire" },
      {
        kind: "steps",
        items: [
          { title: "Choisis une tâche précise.", content: "Pas « réviser le cours ». Plutôt : « faire les 10 premières flashcards »." },
          { title: "Coupe les distractions.", content: "Téléphone en mode avion, onglets fermés, notifications désactivées." },
          { title: "Lance le timer.", content: "Application ou minuteur physique, les deux fonctionnent." },
          { title: "Travaille sans interruption.", content: "Si une pensée surgit, note-la sur papier et reviens à ta tâche." },
          { title: "Quand le timer sonne, arrête.", content: "Même si tu es dans le flow. Fais ta pause." },
        ],
      },
      { kind: "heading", title: "Les pauses : comment les rendre utiles" },
      { kind: "pauseTips" },
      { kind: "heading", title: "Les variantes" },
      {
        kind: "paragraph",
        content:
          "Si 25 minutes c'est trop long, commence par 15. Si c'est trop court, essaie 45. La durée exacte compte moins que le cycle travail-pause.",
      },
      {
        kind: "remember",
        content:
          "Ta première session du matin est la plus productive. Consacre-la à la tâche la plus difficile de ta journée.",
      },
    ],
  },
  {
    id: "stress-oral",
    slug: "stress-oral",
    icon: "🎤",
    title: "Gérer le stress avant un oral",
    category: "Examens",
    type: "Fiche pratique",
    duration: "6 min",
    description:
      "Un plan simple pour préparer ton passage, réguler ton stress et gagner en confiance juste avant de parler.",
    ctaLabel: "Voir la fiche",
    isPublished: true,
    toc: ["Comprendre l'anxiété", "La veille", "Le jour J", "Pendant l'oral", "À retenir"],
    related: ["respiration-4-7-8", "methode-pomodoro"],
    sections: [
      { kind: "heading", title: "Comprendre ce qui se passe" },
      {
        kind: "paragraph",
        content:
          "L'anxiété avant une performance, c'est ton corps qui se prépare à un effort important. Ce n'est pas un signe que tu vas mal performer : c'est un signe que tu es prêt·e à performer.",
      },
      {
        kind: "oralPhase",
        icon: "🌙",
        title: "La veille — Préparation mentale",
        subtitle: "Pose les rails pour que demain soit fluide",
        items: [
          { title: "Répétition à voix haute, debout", content: "dans les conditions réelles. Pas assis·e à ton bureau." },
          { title: "T'enregistrer avec ton téléphone", content: "et réécouter pour repérer les moments où tu accélères." },
          { title: "Préparer tes 3 premières phrases par cœur.", content: "Le début est le moment le plus anxiogène." },
          { title: "Te coucher tôt.", content: "Ne révise pas après 22h : ton cerveau a besoin de sommeil." },
        ],
      },
      {
        kind: "oralPhase",
        icon: "☀️",
        title: "Le jour J — Avant d'entrer",
        subtitle: "30 minutes avant ton passage",
        items: [
          { title: "Arriver 30 minutes en avance.", content: "Évite les étudiant·es qui stressent, leur anxiété est contagieuse." },
          { title: "5 minutes de cohérence cardiaque.", content: "Tu peux aussi lancer la Respiration 4-7-8." },
          { title: "Adopter une posture stable.", content: "Debout, épaules en arrière, respiration lente pendant 2 minutes." },
          { title: "Sourire au jury en entrant.", content: "C'est désarmant pour toi comme pour eux." },
        ],
      },
      {
        kind: "oralPhase",
        icon: "🛟",
        title: "Pendant l'oral — Si ça dérape",
        subtitle: "Plan d'urgence en cas de blanc ou de panique",
        items: [],
      },
      {
        kind: "emergency",
        title: "Tu as un trou de mémoire",
        content: "Ne panique pas. Respire une fois profondément et utilise cette phrase de relais :",
        quote: "Laissez-moi reformuler ma pensée.",
        footer:
          "Les jurys apprécient un·e candidat·e qui sait gérer un blanc. Ta capacité à rester calme face à l'imprévu est une compétence évaluée.",
      },
      {
        kind: "remember",
        content:
          "L'anxiété est de l'énergie qui cherche une direction. Redirige-la vers ta préparation, ta respiration et ta posture.",
      },
    ],
  },
];
