import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UsageBarChart } from '../components/UsageBarChart';
import { DEFAULT_UTILITY_COLORS, useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';
import type { UtilityCategory } from '../data/mockData';

type Tab = 'usage' | 'billing' | 'settings';

export function UtilityDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<'UtilityDetail'>) {
  const { utilityId } = route.params;
  const { utilities, usageSeries, billingHistory, utilityColors, setUtilityColor } = useApp();
  const [tab, setTab] = useState<Tab>('usage');

  // Wireframe mapping:
  // - `Usage` tab should call `GET /providers/{id}/usage`
  // - `Billing` tab should call `GET /providers/{id}/billing`
  // - `Settings` tab is where `DELETE /providers/{id}` (disconnect) and preferences would live

  const utility = useMemo(
    () => utilities.find((u) => u.id === utilityId),
    [utilities, utilityId]
  );

  const bills = useMemo(
    () => billingHistory.filter((b) => b.provider === utility?.name),
    [billingHistory, utility?.name]
  );

  if (!utility) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Utility not found.</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>{utility.name}</Text>
      </View>
      <View style={styles.tabs}>
        {(['usage', 'billing', 'settings'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'usage' ? 'Usage' : t === 'billing' ? 'Billing' : 'Settings'}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'usage' && (
          <>
            <UsageBarChart data={usageSeries} />
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Daily breakdown</Text>
              <Text style={styles.panelBody}>
                Peak usage: afternoon · Off-peak savings available on some plans.
              </Text>
            </View>
          </>
        )}
        {tab === 'billing' && (
          <>
            {bills.map((b) => (
              <View key={b.id} style={styles.billCard}>
                <Text style={styles.billAmount}>${b.amount.toFixed(2)}</Text>
                <Text style={styles.billPeriod}>
                  {b.periodStart} — {b.periodEnd}
                </Text>
                <Text style={styles.billDue}>Due {b.dueDate}</Text>
              </View>
            ))}
            {bills.length === 0 && (
              <Text style={styles.empty}>No billing rows for this utility in the sample set.</Text>
            )}
            <Text style={styles.pdfLine}>PDF viewer & payment history — coming with backend.</Text>
          </>
        )}
        {tab === 'settings' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Connection</Text>
            <Text style={styles.panelBody}>Status: {utility.status}</Text>
            <Text style={[styles.panelBody, { marginTop: spacing.sm }]}>
              Disconnect and notification preferences will live here.
            </Text>

            <View style={{ marginTop: spacing.lg }}>
              <Text style={styles.panelTitle}>Chart color</Text>
              <Text style={styles.panelBody}>Used to render this utility in the dashboard chart.</Text>

              <View style={styles.paletteRow}>
                {PALETTE.map((p) => {
                  const isSelected = (utilityColors[utility.id] ?? DEFAULT_UTILITY_COLORS[utility.category]) === p.color;
                  return (
                    <Pressable
                      key={p.category}
                      onPress={() => setUtilityColor(utility.id, p.color)}
                      style={[
                        styles.paletteSwatch,
                        { backgroundColor: p.color, borderColor: isSelected ? colors.primary : colors.border },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  backBtn: { marginBottom: spacing.sm },
  backText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabLabel: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  tabLabelActive: { color: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  panel: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  panelBody: { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  billCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  billAmount: { fontSize: 20, fontWeight: '800', color: colors.text },
  billPeriod: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  billDue: { fontSize: 14, color: colors.text, marginTop: spacing.sm },
  pdfLine: { marginTop: spacing.lg, fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  empty: { color: colors.textMuted, fontSize: 14 },
  missing: { color: colors.text, padding: spacing.lg },
  link: { color: colors.accent, paddingHorizontal: spacing.lg },
  paletteRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  paletteSwatch: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    borderWidth: 2,
  },
});

const PALETTE: Array<{ category: UtilityCategory; color: string }> = [
  { category: 'electric', color: DEFAULT_UTILITY_COLORS.electric },
  { category: 'water', color: DEFAULT_UTILITY_COLORS.water },
  { category: 'trash', color: DEFAULT_UTILITY_COLORS.trash },
  { category: 'internet', color: DEFAULT_UTILITY_COLORS.internet },
  { category: 'gas', color: DEFAULT_UTILITY_COLORS.gas },
];
