export type QuestionType = "likert" | "single" | "multi";

export type QuestionOption = {
  value: string;
  label: string;
};

export type TestQuestion = {
  id: string;
  type: QuestionType;
  text: string;
  dimension?: string;
  required?: boolean;
  options?: QuestionOption[];
};

export type TestSection = {
  id: string;
  title: string;
  description: string;
  questions: TestQuestion[];
};

export const TEST_SECTIONS: TestSection[] = [
  {
    id: "energie",
    title: "Energie & rythme",
    description: "Comprendre comment tu recupere ton energie au quotidien.",
    questions: [
      { id: "q01", type: "likert", text: "Je me sens energique au reveil.", dimension: "vitalite" },
      { id: "q02", type: "likert", text: "Je garde un bon niveau d'energie toute la journee.", dimension: "vitalite" },
      { id: "q03", type: "single", text: "Ton moment le plus productif est :", options: [
        { value: "matin", label: "Le matin" },
        { value: "apresmidi", label: "L'apres-midi" },
        { value: "soir", label: "Le soir" }
      ] },
      { id: "q04", type: "multi", text: "Ce qui te fatigue le plus :", options: [
        { value: "bruit", label: "Le bruit" },
        { value: "ecrans", label: "Trop d'ecrans" },
        { value: "pression", label: "La pression" },
        { value: "isolement", label: "L'isolement" }
      ] },
      { id: "q05", type: "likert", text: "Je prends des pauses avant d'etre epuise(e).", dimension: "regulation" }
    ]
  },
  {
    id: "relationnel",
    title: "Relationnel",
    description: "Observer tes preferences sociales et ton style d'interaction.",
    questions: [
      { id: "q06", type: "likert", text: "Je me sens a l'aise dans un nouveau groupe.", dimension: "aisance_sociale" },
      { id: "q07", type: "single", text: "Dans une discussion, tu es plutot :", options: [
        { value: "ecoute", label: "A l'ecoute" },
        { value: "equilibre", label: "Equilibre" },
        { value: "leader", label: "Moteur de la discussion" }
      ] },
      { id: "q08", type: "multi", text: "Ce qui compte le plus dans tes relations :", options: [
        { value: "confiance", label: "La confiance" },
        { value: "humour", label: "L'humour" },
        { value: "profondeur", label: "Les discussions profondes" },
        { value: "stabilite", label: "La stabilite" }
      ] },
      { id: "q09", type: "likert", text: "Je demande de l'aide quand j'en ai besoin.", dimension: "soutien" },
      { id: "q10", type: "likert", text: "Je gere bien les desaccords sans eviter le conflit.", dimension: "assertivite" }
    ]
  },
  {
    id: "emotion",
    title: "Emotions",
    description: "Mesurer la conscience emotionnelle et la regulation.",
    questions: [
      { id: "q11", type: "likert", text: "Je reconnais rapidement ce que je ressens.", dimension: "conscience" },
      { id: "q12", type: "likert", text: "Je peux me calmer apres un stress intense.", dimension: "regulation" },
      { id: "q13", type: "single", text: "Face a une critique, ta premiere reaction est :", options: [
        { value: "analyse", label: "Je prends du recul" },
        { value: "defense", label: "Je me justifie" },
        { value: "silence", label: "Je me tais" }
      ] },
      { id: "q14", type: "multi", text: "Quand tu stresses, tu as tendance a :", options: [
        { value: "ruminer", label: "Ruminer" },
        { value: "bouger", label: "Bouger / marcher" },
        { value: "isoler", label: "M'isoler" },
        { value: "parler", label: "En parler" }
      ] },
      { id: "q15", type: "likert", text: "Je sais nommer mes besoins emotionnels.", dimension: "expression" }
    ]
  },
  {
    id: "projection",
    title: "Projection & habitudes",
    description: "Identifier tes leviers concrets de progression.",
    questions: [
      { id: "q16", type: "likert", text: "Je transforme mes intentions en actions regulieres.", dimension: "discipline" },
      { id: "q17", type: "single", text: "Tu prefere progresser avec :", options: [
        { value: "plan", label: "Un plan clair" },
        { value: "essais", label: "Des essais progressifs" },
        { value: "accompagnement", label: "Un accompagnement" }
      ] },
      { id: "q18", type: "multi", text: "Tes formats favoris pour apprendre :", options: [
        { value: "lecture", label: "Lecture" },
        { value: "video", label: "Video" },
        { value: "pratique", label: "Exercices pratiques" },
        { value: "groupe", label: "Ateliers en groupe" }
      ] },
      { id: "q19", type: "likert", text: "Je maintiens mes nouvelles habitudes sur la duree.", dimension: "constance" },
      { id: "q20", type: "likert", text: "Je celebre mes progres, meme petits.", dimension: "motivation" }
    ]
  }
];
