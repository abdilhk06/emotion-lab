import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PlannerResponse } from "@/lib/chatbot/planner-schema";

const COLORS = {
  plum: "#7E3D5E",
  blue: "#2E8BBF",
  rose: "#F7BAC1",
  lavender: "#F5F0F7",
  text: "#1A1A2E",
  muted: "#5D6B82",
  border: "#E5E0EC",
  card: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 42,
    backgroundColor: "#FDFBFC",
    color: COLORS.text,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
  },
  hero: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: COLORS.plum,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  brand: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
  },
  heroText: {
    color: "#F8EAF1",
    fontSize: 10,
  },
  summary: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  summaryCard: {
    flex: 1,
    padding: 9,
    borderRadius: 10,
    backgroundColor: "#925270",
  },
  label: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  heroLabel: {
    color: "#F6DDEA",
  },
  value: {
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
  sectionTitle: {
    color: COLORS.plum,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 7,
    marginTop: 7,
  },
  rowMeta: {
    color: COLORS.blue,
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 3,
  },
  rowTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 3,
  },
  rowText: {
    color: "#2D3B59",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 5,
  },
  chip: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 7,
    backgroundColor: COLORS.lavender,
    color: COLORS.plum,
    fontSize: 7.5,
    fontWeight: 700,
  },
  bullet: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.rose,
    marginTop: 4,
  },
  bulletText: {
    flex: 1,
    color: "#2D3B59",
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
    fontSize: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function PdfFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text>Emotion Lab</Text>
      <Text>Plan de travail</Text>
    </View>
  );
}

export function PlanPdfDocument({ plan }: { plan: PlannerResponse }) {
  return (
    <Document title="Plan de travail Emotion Lab" author="Emotion Lab">
      <Page size="A4" style={styles.page}>
        <View style={styles.hero} wrap={false}>
          <Text style={styles.brand}>Emotion Lab</Text>
          <Text style={styles.title}>Plan de travail</Text>
          <Text style={styles.heroText}>{plan.synthese.methode_recommandee}</Text>
          <View style={styles.summary}>
            <View style={styles.summaryCard}>
              <Text style={[styles.label, styles.heroLabel]}>Taches</Text>
              <Text style={styles.value}>{plan.synthese.nb_taches}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.label, styles.heroLabel]}>Deadline</Text>
              <Text style={styles.value}>{plan.synthese.deadline_globale}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.label, styles.heroLabel]}>Charge</Text>
              <Text style={styles.value}>{plan.synthese.charge_totale_minutes} min</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planning detaille</Text>
          {plan.planning.map((slot, index) => (
            <View key={`${slot.date}-${slot.heure_debut}-${slot.tache}-${index}`} style={styles.row} wrap={false}>
              <Text style={styles.rowMeta}>
                {slot.jour} {slot.date} - {slot.heure_debut} a {slot.heure_fin}
              </Text>
              <Text style={styles.rowTitle}>{slot.tache}</Text>
              <Text style={styles.rowText}>{slot.conseil}</Text>
              <View style={styles.chips}>
                <Text style={styles.chip}>{slot.type}</Text>
                <Text style={styles.chip}>{slot.methode}</Text>
                <Text style={styles.chip}>Importance {slot.importance}</Text>
                <Text style={styles.chip}>{slot.duree_min} min</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conseils generaux</Text>
          {plan.conseils_generaux.map((item) => (
            <View style={styles.bullet} key={item}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
