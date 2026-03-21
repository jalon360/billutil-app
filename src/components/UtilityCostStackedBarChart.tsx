import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import type { BillingRow, ConnectedUtility, UtilityCategory } from '../data/mockData';
import { DEFAULT_UTILITY_COLORS } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';

const CATEGORY_ORDER: UtilityCategory[] = ['electric', 'water', 'trash', 'internet', 'gas'];

type TooltipState =
  | {
      monthLabel: string;
      modeLabel: string; // Estimated / Previous
      segmentLabel: string; // utility name or "Total"
      cost: number;
      color: string;
    }
  | null;

type Props = {
  utilities: ConnectedUtility[];
  billingHistory: BillingRow[];
  selectedUtilityIds: string[];
  utilityColors: Record<string, string>;
};

function monthKeyToLabel(monthKey: string) {
  // monthKey format: YYYY-MM
  const [y, m] = monthKey.split('-');
  const monthIndex = Number(m) - 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const safeMonth = monthNames[monthIndex] ?? 'Mon';
  return `${safeMonth} ${y}`;
}

function monthKeyFromDate(dateISO: string) {
  // "2026-02-28" -> "2026-02"
  return dateISO.slice(0, 7);
}

export function UtilityCostStackedBarChart({
  utilities,
  billingHistory,
  selectedUtilityIds,
  utilityColors,
}: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const selectedUtilities = useMemo(
    () => utilities.filter((u) => selectedUtilityIds.includes(u.id)),
    [utilities, selectedUtilityIds]
  );

  const months = useMemo(() => {
    const keys = Array.from(new Set(billingHistory.map((b) => monthKeyFromDate(b.periodEnd))));
    keys.sort(); // YYYY-MM lexicographic sort is chronological
    const latest = keys[keys.length - 1];
    const previous = keys.length > 1 ? keys[keys.length - 2] : undefined;
    return previous ? [previous, latest] : latest ? [latest] : [];
  }, [billingHistory]);

  const dataForChart = useMemo(() => {
    const currentMonthKey = months[months.length - 1];

    const items = months.map((monthKey) => {
      const modeLabel = monthKey === currentMonthKey ? 'Estimated' : 'Previous';

      const segments = selectedUtilities
        .slice()
        .sort(
          (a, b) =>
            CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
        )
        .map((u) => {
          const color = utilityColors[u.id] ?? DEFAULT_UTILITY_COLORS[u.category];
          const cost =
            monthKey === currentMonthKey
              ? u.estimatedBill
              : billingHistory
                  .filter((b) => b.provider === u.name && monthKeyFromDate(b.periodEnd) === monthKey)
                  .reduce((sum, b) => sum + b.amount, 0);

          return { utility: u, color, cost };
        })
        // Hide 0-cost segments to keep the stacked bar clean.
        .filter((s) => s.cost > 0);

      const monthTotal = segments.reduce((sum, s) => sum + s.cost, 0);
      return { monthKey, modeLabel, segments, monthTotal };
    });

    const maxTotal = Math.max(1, ...items.map((i) => i.monthTotal));

    return { items, maxTotal };
  }, [billingHistory, months, selectedUtilities, utilityColors]);

  const canRender = selectedUtilities.length > 0 && dataForChart.items.length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Total utility cost</Text>
        <Text style={styles.sub}>Monthly (estimated + previous). Click/hover for details.</Text>
      </View>

      {!canRender ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Select at least one utility to render the chart.</Text>
        </View>
      ) : (
        <>
          <View style={styles.chartRow}>
            {dataForChart.items.map((item) => {
              const barKey = item.monthKey;
              const barHeight = CHART_HEIGHT;

              return (
                <View key={barKey} style={styles.barCol}>
                  <Pressable
                    onPress={() => {
                      setTooltip({
                        monthLabel: monthKeyToLabel(item.monthKey),
                        modeLabel: item.modeLabel,
                        segmentLabel: 'Total',
                        cost: item.monthTotal,
                        color: colorsForTooltip(item.modeLabel),
                      });
                    }}
                    {...(Platform.OS === 'web'
                      ? ({
                          onMouseEnter: () =>
                            setTooltip({
                              monthLabel: monthKeyToLabel(item.monthKey),
                              modeLabel: item.modeLabel,
                              segmentLabel: 'Total',
                              cost: item.monthTotal,
                              color: colorsForTooltip(item.modeLabel),
                            }),
                          onMouseLeave: () => setTooltip(null),
                        } as any)
                      : {})}
                  >
                    <View style={styles.barTrack}>
                      <View style={styles.stacked}>
                        {item.segments.map((seg) => {
                          // Height encodes the Y axis (total cost), not just relative split.
                          const h = (seg.cost / dataForChart.maxTotal) * barHeight;
                          return (
                            <Pressable
                              key={seg.utility.id}
                              onPress={() => {
                                setTooltip({
                                  monthLabel: monthKeyToLabel(item.monthKey),
                                  modeLabel: item.modeLabel,
                                  segmentLabel: seg.utility.name,
                                  cost: seg.cost,
                                  color: seg.color,
                                });
                              }}
                              {...(Platform.OS === 'web'
                                ? ({
                                    onMouseEnter: () =>
                                      setTooltip({
                                        monthLabel: monthKeyToLabel(item.monthKey),
                                        modeLabel: item.modeLabel,
                                        segmentLabel: seg.utility.name,
                                        cost: seg.cost,
                                        color: seg.color,
                                      }),
                                    onMouseLeave: () => setTooltip(null),
                                  } as any)
                                : {})}
                            >
                              <View style={[styles.segment, { height: h, backgroundColor: seg.color }]} />
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </Pressable>

                  <Text style={styles.monthLabel}>{monthKeyToLabel(item.monthKey)}</Text>
                  <Text style={styles.modeLabel}>{item.modeLabel}</Text>
                </View>
              );
            })}
          </View>

          {tooltip && (
            <View style={[styles.tooltip, { borderColor: tooltip.color }]}>
              <Text style={styles.tooltipTitle}>{tooltip.segmentLabel}</Text>
              <Text style={styles.tooltipLine}>
                {tooltip.monthLabel} • {tooltip.modeLabel}
              </Text>
              <Text style={styles.tooltipCost}>${tooltip.cost.toFixed(2)}</Text>
            </View>
          )}
        </>
      )}

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          {selectedUtilities
            .slice()
            .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
            .map((u) => {
              const color = utilityColors[u.id] ?? DEFAULT_UTILITY_COLORS[u.category];
              return (
                <View key={u.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {u.name}
                  </Text>
                </View>
              );
            })}
        </View>
      </View>
    </View>
  );
}

const CHART_HEIGHT = 160;

function colorsForTooltip(_modeLabel: string) {
  return '#94a3b8';
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  headerRow: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 12, color: colors.textMuted },

  empty: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { color: colors.textMuted },

  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 14,
  },
  barCol: { flex: 1, alignItems: 'center' },

  barTrack: {
    width: 34,
    height: CHART_HEIGHT,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'flex-end',
  },
  stacked: {
    flex: 1,
    flexDirection: 'column-reverse',
    justifyContent: 'flex-start',
    width: '100%',
  },
  segment: { width: '100%' },

  monthLabel: {
    marginTop: 8,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modeLabel: { fontSize: 10, marginTop: 4, color: colors.textMuted },

  tooltip: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  tooltipTitle: { color: colors.text, fontWeight: '800' },
  tooltipLine: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  tooltipCost: { color: colors.text, fontWeight: '900', fontSize: 16, marginTop: 6 },

  legend: { marginTop: 14 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 6 },
  legendText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
});

