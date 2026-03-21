import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UsageBarChart } from '../components/UsageBarChart';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';

export function UsageChartsScreen(_props: MainTabScreenProps<'UsageCharts'>) {
  const { usageSeries, utilities } = useApp();

  // Wireframe mapping:
  // - In a backend-enabled build, this would likely fetch:
  //   - `GET /providers/{id}/usage` for each connected utility
  //   - then render daily/hourly breakdown + peak usage
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Usage</Text>
        <Text style={styles.subtitle}>Daily electricity usage (sample series)</Text>
        <UsageBarChart data={usageSeries} unit="kWh" />
        <Text style={styles.sectionTitle}>By utility</Text>
        {utilities.map((u) => (
          <View key={u.id} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{u.name}</Text>
              <Text style={styles.rowMeta}>{u.usageLabel}</Text>
            </View>
            <Text style={styles.rowValue}>{u.usageValue}</Text>
          </View>
        ))}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            Peak usage and hourly breakdown will appear here once your provider syncs.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rowValue: { fontSize: 16, fontWeight: '700', color: colors.accent },
  note: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});
