export type HobbyCategory = {
  id: string;
  name: string;
  hobbies: string[];
};

export const MIN_HOBBIES = 5;
export const MAX_HOBBIES = 15;

export const HOBBY_CATEGORIES: HobbyCategory[] = [
  {
    id: "sport-activite",
    name: "Sport & activite physique",
    hobbies: [
      "Football",
      "Basketball",
      "Tennis / Padel",
      "Running",
      "Natation",
      "Musculation",
      "Yoga",
      "Danse",
      "Randonnee"
    ]
  },
  {
    id: "arts-creation",
    name: "Arts & creation",
    hobbies: [
      "Dessin / Peinture",
      "Photographie",
      "Ecriture / Poesie",
      "Design graphique",
      "Artisanat / DIY",
      "Mode / Stylisme"
    ]
  },
  {
    id: "lecture-culture",
    name: "Lecture & culture",
    hobbies: [
      "Lecture (romans)",
      "Developpement personnel",
      "Essais / sciences",
      "BD / Mangas",
      "Cinema / Series",
      "Musees / Expos"
    ]
  },
  {
    id: "cuisine-lifestyle",
    name: "Cuisine & lifestyle",
    hobbies: [
      "Cuisine / Patisserie",
      "Decouverte resto",
      "Jardinage",
      "Deco d'interieur"
    ]
  },
  {
    id: "musique-audio",
    name: "Musique & audio",
    hobbies: [
      "Chant",
      "Instrument",
      "Concerts",
      "Podcasts",
      "Production musicale"
    ]
  },
  {
    id: "tech-jeux",
    name: "Tech & jeux",
    hobbies: [
      "Jeux video",
      "Jeux de societe",
      "Programmation",
      "Intelligence artificielle",
      "Gadgets / innovation"
    ]
  },
  {
    id: "voyage-nature",
    name: "Voyage & nature",
    hobbies: [
      "City trips",
      "Voyages en van",
      "Camping",
      "Parcs naturels",
      "Road trips"
    ]
  },
  {
    id: "engagement-bienetre",
    name: "Engagement & bien-etre",
    hobbies: [
      "Meditation",
      "Benevolat",
      "Ecologie",
      "Developpement durable",
      "Spiritualite"
    ]
  }
];
