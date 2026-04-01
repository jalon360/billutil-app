import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_UTILITY_COLORS, useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';
import { UtilityCostStackedBarChart } from '../components/UtilityCostStackedBarChart';

export function DashboardScreen({ navigation }: MainTabScreenProps<'Dashboard'>) {
  const { utilities, billingHistory, signOut, utilityColors, updateUtility } = useApp();
  const [syncingUtilityId, setSyncingUtilityId] = useState<string | null>(null);
  const [syncLastRun, setSyncLastRun] = useState<{ [key: string]: number }>({});

  const allUtilityIds = useMemo(() => utilities.map((u) => u.id), [utilities]);
  const [selectedUtilityIds, setSelectedUtilityIds] = useState<string[]>(allUtilityIds);

  useEffect(() => {
    // Keep newly added utilities selected by default.
    setSelectedUtilityIds((prev) => {
      const set = new Set(prev);
      for (const id of allUtilityIds) set.add(id);
      return Array.from(set);
    });
  }, [allUtilityIds]);

  const handleSync = async (utilityId: string) => {
    setSyncingUtilityId(utilityId);
    try {
      const response = await fetch(`http://localhost:3001/sync/${utilityId}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Sync failed');

      const data = await response.json();

      // Update utility with new data
      if (data.success && data.usageRecords && data.billingRecords) {
        updateUtility(utilityId, {
          estimatedBill: data.usageRecords[0]?.amount ?? 0,
          lastBillAmount: data.billingRecords[0]?.billAmount ?? 0,
          dueDate: data.billingRecords[0]?.dueDate ?? '—',
          status: 'connected',
        });
      }
      setSyncLastRun((prev) => ({ ...prev, [utilityId]: Date.now() }));
    } catch (error) {
      console.error('Sync error:', error);
      updateUtility(utilityId, { status: 'error' });
    } finally {
      setSyncingUtilityId(null);
    }
  };

  const toggleUtility = (utilityId: string) => {
    setSelectedUtilityIds((prev) => {
      const set = new Set(prev);
      if (set.has(utilityId)) {
        set.delete(utilityId);
        // Never allow "no utilities" because the chart becomes empty and the UI confusing.
        if (set.size === 0) return prev;
      } else {
        set.add(utilityId);
      }
      return Array.from(set);
    });
  };

  // Wireframe mapping:
  // - This screen is populated from `GET /dashboard`:
  //   usage summaries, estimated bills, last bills, and due dates.
  const goUtility = (utilityId: string) => {
    navigation.navigate('UtilityDetail', { utilityId });
  };

  const handleSignOut = () => {
    signOut();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Estimates and recent activity</Text>
          </View>
          <Pressable onPress={handleSignOut} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        <UtilityCostStackedBarChart
          utilities={utilities}
          billingHistory={billingHistory}
          selectedUtilityIds={selectedUtilityIds}
          utilityColors={utilityColors}
        />

        <View style={styles.filterBox}>
          <Text style={styles.filterTitle}>Filters (exclude utilities)</Text>
          <View style={styles.chipsRow}>
            {utilities.map((u) => {
              const isOn = selectedUtilityIds.includes(u.id);
              const dotColor = utilityColors[u.id] ?? DEFAULT_UTILITY_COLORS[u.category];

              return (
                <Pressable
                  key={u.id}
                  onPress={() => toggleUtility(u.id)}
                  style={[styles.chip, !isOn && styles.chipOff]}
                >
                  <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
                  <Text style={[styles.chipText, !isOn && styles.chipTextOff]} numberOfLines={1}>
                    {u.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {utilities.map((u) => (
          <View key={u.id} style={styles.card}>
            <Pressable onPress={() => goUtility(u.id)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{u.name}</Text>
                <View
                  style={[
                    styles.badge,
                    u.status === 'connected' && styles.badgeOk,
                    u.status === 'syncing' && styles.badgeSync,
                    u.status === 'error' && styles.badgeErr,
                  ]}
                >
                  <Text style={styles.badgeText}>{u.status}</Text>
                </View>
              </View>
              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Est. bill</Text>
                  <Text style={styles.metricValue}>${u.estimatedBill.toFixed(2)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Last bill</Text>
                  <Text style={styles.metricValue}>${u.lastBillAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Due</Text>
                  <Text style={styles.metricValueSmall}>{u.dueDate}</Text>
                </View>
              </View>
              <View style={styles.usageRow}>
                <Text style={styles.usageLabel}>{u.usageLabel}</Text>
                <Text style={styles.usageValue}>{u.usageValue}</Text>
              </View>
              <Text style={styles.hint}>Tap for usage, billing & settings</Text>
            </Pressable>
            <Pressable
              onPress={() => handleSync(u.id)}
              disabled={syncingUtilityId === u.id}
              style={styles.syncButton}
            >
              {syncingUtilityId === u.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.syncText}>↻ Sync now</Text>
              )}
            </Pressable>
          </View>
        ))}

        <Pressable
          style={styles.addRow}
          onPress={() => navigation.navigate('AddUtilities')}
        >
          <Text style={styles.addText}>+ Add another utility</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  signOut: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  signOutText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
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
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeOk: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  badgeSync: { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  badgeErr: { backgroundColor: 'rgba(248, 113, 113, 0.15)' },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  metric: { flex: 1 },
  metricLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  metricValue: { fontSize: 17, fontWeight: '700', color: colors.text },
  metricValueSmall: { fontSize: 14, fontWeight: '600', color: colors.text },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  usageLabel: { color: colors.textMuted, fontSize: 13 },
  usageValue: { color: colors.text, fontSize: 15, fontWeight: '600' },
  hint: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted },
  syncButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  addRow: {
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
  },
  addText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  filterBox: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTitle: { color: colors.textMuted, fontWeight: '700', fontSize: 13, marginBottom: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOff: { opacity: 0.5 },
  chipDot: { width: 10, height: 10, borderRadius: 9999 },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '700', maxWidth: 160 },
  chipTextOff: { color: colors.textMuted },
});
