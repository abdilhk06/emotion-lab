import Image from "next/image";

const team = [
  {
    name: "Ghita BOUCHKAR",
    role: "Pilotage & design",
    image: "/Ghita bouchkar.jpeg",
  },
  {
    name: "Imane DERRAJ",
    role: "Structuration fonctionnelle",
    image: "/Imane derraj.jpeg",
  },
  {
    name: "Nada EL MESSARI",
    role: "Communication digitale",
    image: "/Nada el messari.jpeg",
  },
  {
    name: "Hiba ZAH",
    role: "Expérience utilisateur",
    image: "/Hiba zah.jpeg",
  },
  {
    name: "Abdelhakim MORTAKI",
    role: "Suivi technique",
    image: "/Abdelhakim MORTAKI.jpeg",
  },
];

export function TeamSection() {
  return (
    <section className="team-section">
      <div className="section-title">
        <span className="eyebrow">L&apos;équipe</span>
        <h2>Cinq étudiant·es de l&apos;ISCAE</h2>
        <p style={{ color: "var(--texte-gris)", marginTop: "10px" }}>
          Encadré·es par Mme Kbaili dans le cadre du PIS.
        </p>
      </div>
      <div className="team-grid">
        {team.map((member) => (
          <div className="team-member" key={member.name}>
            <div className="team-avatar">
              <Image
                src={member.image}
                alt={member.name}
                width={120}
                height={120}
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
            <div className="team-name">{member.name}</div>
            <div className="team-role">{member.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

