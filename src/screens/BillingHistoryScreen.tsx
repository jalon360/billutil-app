import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';

export function BillingHistoryScreen(_props: MainTabScreenProps<'BillingHistory'>) {
  const { billingHistory } = useApp();

  // Wireframe mapping:
  // - This list represents billing data from `GET /providers/{id}/billing`
  //   (or an aggregated `GET /dashboard` response, depending on backend design).
  // - PDF viewer + payment history would use `pdf_url` from `billing_records`.
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Billing history</Text>
        <Text style={styles.subtitle}>Statements and due dates (sample data)</Text>
        {billingHistory.map((row) => (
          <View key={row.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.provider}>{row.provider}</Text>
              <Text style={styles.amount}>${row.amount.toFixed(2)}</Text>
            </View>
            <Text style={styles.period}>
              Period {row.periodStart} — {row.periodEnd}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.due}>Due {row.dueDate}</Text>
              <View style={[styles.pill, row.paid ? styles.paid : styles.open]}>
                <Text style={styles.pillText}>{row.paid ? 'Paid' : 'Open'}</Text>
              </View>
            </View>
            <Text style={styles.pdfHint}>PDF bill & payment history will open here.</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  provider: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  amount: { fontSize: 20, fontWeight: '800', color: colors.text },
  period: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  due: { fontSize: 14, color: colors.text },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  paid: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  open: { backgroundColor: 'rgba(248, 113, 113, 0.15)' },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.text },
  pdfHint: { marginTop: spacing.md, fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
});
