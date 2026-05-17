import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BigFiveScores } from "@/lib/calculate-result";
import { buildResultInterpretation } from "@/lib/results/result-copy";

export type ResultPdfData = {
  generatedAt: string;
  profile: {
    pseudo: string | null;
    studyLevel: string | null;
    bio: string | null;
    lookingFor: string | null;
  };
  hobbies: string[];
  result: {
    mbtiCode: string;
    mbtiName: string;
    bigFiveScores: BigFiveScores;
    stressScore: number;
    balanceScore: number;
    createdAt: string;
  };
};

const COLORS = {
  plum: "#7E3D5E",
  blue: "#2E8BBF",
  lavender: "#F5F0F7",
  lavenderDark: "#E8DDED",
  text: "#15213D",
  muted: "#667085",
  border: "#E6DDEB",
  card: "#FFFFFF",
  amber: "#F28A33",
  green: "#43A36F",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 48,
    backgroundColor: "#FFFCFF",
    color: COLORS.text,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    lineHeight: 1.32,
  },
  cover: {
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: COLORS.plum,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  brand: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 14,
    lineHeight: 1.15,
  },
  title: {
    fontSize: 23,
    fontWeight: 700,
    lineHeight: 1.15,
    marginBottom: 9,
  },
  subtitle: {
    fontSize: 11,
    color: "#F6EAF2",
    lineHeight: 1.35,
  },
  metaGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
  },
  metaCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#91516F",
  },
  metaLabel: {
    fontSize: 7,
    color: "#F6DDEA",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 700,
  },
  section: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginBottom: 9,
  },
  sectionTint: {
    backgroundColor: COLORS.lavender,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.plum,
    marginBottom: 8,
    lineHeight: 1.2,
  },
  profileGrid: {
    flexDirection: "row",
    gap: 10,
  },
  profileCol: {
    flex: 1,
  },
  label: {
    fontSize: 7.5,
    color: COLORS.muted,
    textTransform: "uppercase",
    marginBottom: 2,
    lineHeight: 1.2,
  },
  value: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 7,
    lineHeight: 1.25,
  },
  paragraph: {
    color: "#2D3B59",
    marginBottom: 5,
    lineHeight: 1.32,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 3,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.lavenderDark,
    color: COLORS.plum,
    fontSize: 8,
  },
  mbtiRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  mbtiCode: {
    width: 82,
    height: 62,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: 700,
    textAlign: "center",
    paddingTop: 15,
    lineHeight: 1,
  },
  mbtiText: {
    flex: 1,
  },
  mbtiName: {
    fontSize: 15,
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 5,
    lineHeight: 1.2,
  },
  scoresGrid: {
    gap: 6,
  },
  scorePair: {
    flexDirection: "row",
    gap: 6,
  },
  scoreCard: {
    flex: 1,
    padding: 7,
    borderRadius: 10,
    backgroundColor: COLORS.lavender,
  },
  scoreHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  scoreName: {
    fontSize: 8.5,
    fontWeight: 700,
    lineHeight: 1.15,
  },
  scoreValue: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.plum,
    lineHeight: 1.15,
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.lavenderDark,
  },
  fill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.plum,
  },
  fillBlue: {
    backgroundColor: COLORS.blue,
  },
  fillAmber: {
    backgroundColor: COLORS.amber,
  },
  fillGreen: {
    backgroundColor: COLORS.green,
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
  },
  col: {
    flex: 1,
  },
  bullet: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 5,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.blue,
    marginTop: 4,
  },
  bulletText: {
    flex: 1,
    color: "#2D3B59",
    lineHeight: 1.3,
  },
  recommendation: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#EEF8FC",
    marginTop: 3,
    marginBottom: 8,
  },
  disclaimer: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    color: "#7A4B18",
    fontSize: 8.5,
    lineHeight: 1.3,
  },
  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    color: COLORS.muted,
    fontSize: 7.5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function PdfFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text>Emotion Lab</Text>
      <Text>Rapport de résultats</Text>
    </View>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non disponible";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function displayValue(value: string | null | undefined, fallback = "Non renseigné"): string {
  const clean = value?.trim();
  return clean || fallback;
}

function ScoreBar({ label, value, tone = "plum" }: { label: string; value: number; tone?: "plum" | "blue" | "amber" | "green" }) {
  const fillStyle = tone === "blue" ? styles.fillBlue : tone === "amber" ? styles.fillAmber : tone === "green" ? styles.fillGreen : {};
  return (
    <View style={styles.scoreCard} wrap={false}>
      <View style={styles.scoreHead}>
        <Text style={styles.scoreName}>{label}</Text>
        <Text style={styles.scoreValue}>{value}/100</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, fillStyle, { width: `${Math.max(0, Math.min(100, value))}%` }]} />
      </View>
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item) => (
        <View style={styles.bullet} key={item}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function ResultPdfDocument({ data }: { data: ResultPdfData }) {
  const interpretation = buildResultInterpretation({
    mbtiCode: data.result.mbtiCode,
    mbtiName: data.result.mbtiName,
    scores: data.result.bigFiveScores,
    stressScore: data.result.stressScore,
    balanceScore: data.result.balanceScore,
  });

  return (
    <Document title="Rapport de résultats Emotion Lab" author="Emotion Lab">
      <Page size="A4" style={styles.page}>
        <View style={styles.cover} wrap={false}>
          <Text style={styles.brand}>Emotion Lab</Text>
          <Text style={styles.title}>Rapport de résultats</Text>
          <Text style={styles.subtitle}>Lecture indicative de ton profil, de tes scores et de tes pistes de travail.</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Profil</Text>
              <Text style={styles.metaValue}>{displayValue(data.profile.pseudo, "Profil")}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Test passé le</Text>
              <Text style={styles.metaValue}>{formatDate(data.result.createdAt)}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>PDF généré le</Text>
              <Text style={styles.metaValue}>{formatDate(data.generatedAt)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, styles.sectionTint]} wrap={false}>
          <Text style={styles.sectionTitle}>Résumé étudiant</Text>
          <View style={styles.profileGrid}>
            <View style={styles.profileCol}>
              <Text style={styles.label}>Pseudo</Text>
              <Text style={styles.value}>{displayValue(data.profile.pseudo, "Profil")}</Text>
              <Text style={styles.label}>Niveau</Text>
              <Text style={styles.value}>{displayValue(data.profile.studyLevel)}</Text>
            </View>
            <View style={styles.profileCol}>
              <Text style={styles.label}>Bio</Text>
              <Text style={styles.paragraph}>{displayValue(data.profile.bio, "Bio non renseignée.")}</Text>
              <Text style={styles.label}>Ce que tu cherches</Text>
              <Text style={styles.paragraph}>{displayValue(data.profile.lookingFor, "Attente non renseignée.")}</Text>
            </View>
          </View>
          <Text style={styles.label}>Loisirs</Text>
          <View style={styles.chips}>
            {(data.hobbies.length > 0 ? data.hobbies : ["Aucun loisir renseigné"]).slice(0, 10).map((hobby) => (
              <Text style={styles.chip} key={hobby}>
                {hobby}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultat de personnalité</Text>
          <View style={styles.mbtiRow}>
            <Text style={styles.mbtiCode}>{data.result.mbtiCode}</Text>
            <View style={styles.mbtiText}>
              <Text style={styles.mbtiName}>{data.result.mbtiName}</Text>
              <Text style={styles.paragraph}>{interpretation.explanation}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scores principaux</Text>
          <View style={styles.scoresGrid}>
            <View style={styles.scorePair}>
              <ScoreBar label="Agréabilité" value={data.result.bigFiveScores.agreeableness} />
              <ScoreBar label="Extraversion" value={data.result.bigFiveScores.extraversion} />
              <ScoreBar label="Ouverture" value={data.result.bigFiveScores.openness} />
            </View>
            <View style={styles.scorePair}>
              <ScoreBar label="Consciencieusité" value={data.result.bigFiveScores.conscientiousness} tone="blue" />
              <ScoreBar label="Neuroticisme" value={data.result.bigFiveScores.neuroticism} tone="amber" />
              <ScoreBar label="Stress" value={data.result.stressScore} tone="amber" />
            </View>
            <View style={styles.scorePair}>
              <ScoreBar label="Organisation / équilibre" value={data.result.balanceScore} tone="green" />
            </View>
          </View>
        </View>

        <View style={styles.section} wrap={false} break>
          <Text style={styles.sectionTitle}>Interprétation</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>Forces possibles</Text>
              <BulletList items={interpretation.strengths} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Points de vigilance</Text>
              <BulletList items={interpretation.watchPoints} />
            </View>
          </View>
          <View style={styles.recommendation}>
            <Text style={styles.label}>Style de travail</Text>
            <Text style={styles.paragraph}>{interpretation.workStyle}</Text>
            <Text style={styles.label}>Indice Buddy</Text>
            <Text style={styles.paragraph}>{interpretation.buddyHint}</Text>
          </View>
          <Text style={styles.disclaimer}>Ce rapport est indicatif, non médical, et ne remplace pas un accompagnement professionnel.</Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
