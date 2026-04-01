import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { useMemo, useState, useRef, useEffect } from 'react';
import type {
  BillingRow,
  ConnectedUtility,
  UtilityCategory,
} from '../data/mockData';
import { DEFAULT_UTILITY_COLORS } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';

const CATEGORY_ORDER: UtilityCategory[] = [
  'Electric',
  'Water',
  'Trash',
  'Internet',
  'Gas',
  'Phone'
];

const CHART_HEIGHT = 160;

type Granularity = 'Day' | 'Month' | 'Year';

type TooltipState =
  | {
      label: string;
      segmentLabel: string;
      cost: number;
      color: string;
      barIndex: number;
    }
  | null;

type Props = {
  utilities: ConnectedUtility[];
  billingHistory: BillingRow[];
  selectedUtilityIds: string[];
  utilityColors: Record<string, string>;
};

function getGroupKey(dateISO: string, granularity: Granularity) {
  if (granularity === 'Day') return dateISO;
  if (granularity === 'Month') return dateISO.slice(0, 7);
  return dateISO.slice(0, 4);
}

function formatLabel(key: string, granularity: Granularity) {
  if (granularity === 'Day') return key.slice(5);
  if (granularity === 'Month') {
    const [y, m] = key.split('-');
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${names[Number(m) - 1]} ${y}`;
  }
  return key;
}

export function UtilityCostStackedBarChart({
  utilities,
  billingHistory,
  selectedUtilityIds,
  utilityColors,
}: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [granularity, setGranularity] = useState<Granularity>('Month');

  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animation.setValue(0);
    Animated.timing(animation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [granularity]);

  const selectedUtilities = useMemo(
    () => utilities.filter((u) => selectedUtilityIds.includes(u.id)),
    [utilities, selectedUtilityIds]
  );

  const timeKeys = useMemo(() => {
    const keys = Array.from(
      new Set(
        billingHistory.map((b) =>
          getGroupKey(b.periodEnd, granularity)
        )
      )
    );

    keys.sort();

    return keys.slice(
      -(granularity === 'Day' ? 7 : granularity === 'Month' ? 6 : 5)
    );
  }, [billingHistory, granularity]);

  const dataForChart = useMemo(() => {
    const items = timeKeys.map((timeKey) => {
      const segments = selectedUtilities
        .slice()
        .sort(
          (a, b) =>
            CATEGORY_ORDER.indexOf(a.category) -
            CATEGORY_ORDER.indexOf(b.category)
        )
        .map((u) => {
          const color =
            utilityColors[u.id] ??
            DEFAULT_UTILITY_COLORS[u.category];

          const cost = billingHistory
            .filter(
              (b) =>
                b.provider === u.name &&
                getGroupKey(b.periodEnd, granularity) === timeKey
            )
            .reduce((sum, b) => sum + b.amount, 0);

          return { utility: u, color, cost };
        })
        .filter((s) => s.cost > 0);

      const total = segments.reduce((sum, s) => sum + s.cost, 0);

      return { timeKey, segments, total };
    });

    const maxTotal = Math.max(1, ...items.map((i) => i.total));
    return { items, maxTotal };
  }, [billingHistory, selectedUtilities, utilityColors, timeKeys, granularity]);

  const yTicks = useMemo(() => {
    const steps = 4;
    const max = dataForChart.maxTotal;

    return Array.from({ length: steps + 1 }).map((_, i) => {
      const value = (max / steps) * i;
      return {
        value,
        label: `$${Math.round(value)}`,
        percent: i / steps,
      };
    });
  }, [dataForChart.maxTotal]);

  const canRender =
    selectedUtilities.length > 0 && dataForChart.items.length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Total utility cost</Text>

      {/* ZOOM */}
      <View style={styles.zoomRow}>
        {(['Day', 'Month', 'Year'] as const).map((g) => (
          <Pressable
            key={g}
            onPress={() => setGranularity(g)}
            style={[
              styles.zoomBtn,
              granularity === g && styles.zoomBtnActive,
            ]}
          >
            <Text
              style={[
                styles.zoomText,
                granularity === g && styles.zoomTextActive,
              ]}
            >
              {g.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {!canRender ? (
        <Text style={styles.empty}>
          Select utilities to display chart
        </Text>
      ) : (
        <View style={styles.chartContainer}>
          {/* Y AXIS */}
          <View style={styles.yAxis}>
            {yTicks.map((tick, i) => (
              <Text
                key={i}
                style={[
                  styles.yAxisLabel,
                  { bottom: `${tick.percent * 100}%` },
                ]}
              >
                {tick.label}
              </Text>
            ))}
          </View>

          {/* GRID */}
          <View style={styles.grid}>
            {yTicks.map((tick, i) => (
              <View
                key={i}
                style={[
                  styles.gridLine,
                  { bottom: `${tick.percent * 100}%` },
                ]}
              />
            ))}
          </View>

          {/* BARS */}
          <View style={styles.chartRow}>
            {dataForChart.items.map((item, index) => {
              const dimmed =
                tooltip && tooltip.barIndex !== index;

              return (
                <View key={item.timeKey} style={styles.barCol}>
                  <Text style={styles.totalLabel}>
                    ${item.total.toFixed(0)}
                  </Text>

                  <Pressable
                    onPress={() =>
                      setTooltip({
                        label: formatLabel(
                          item.timeKey,
                          granularity
                        ),
                        segmentLabel: 'Total',
                        cost: item.total,
                        color: '#94a3b8',
                        barIndex: index,
                      })
                    }
                  >
                    <View
                      style={[
                        styles.barTrack,
                        dimmed && styles.dimmed,
                      ]}
                    >
                      <View style={styles.stacked}>
                        {item.segments.map((seg, i) => {
                          const isTop =
                            i === item.segments.length - 1;

                          const height =
                            animation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [
                                0,
                                (seg.cost /
                                  dataForChart.maxTotal) *
                                  CHART_HEIGHT,
                              ],
                            });

                          return (
                            <Pressable
                              key={seg.utility.id}
                              onPress={() =>
                                setTooltip({
                                  label: formatLabel(
                                    item.timeKey,
                                    granularity
                                  ),
                                  segmentLabel:
                                    seg.utility.name,
                                  cost: seg.cost,
                                  color: seg.color,
                                  barIndex: index,
                                })
                              }
                            >
                              <Animated.View
                                style={[
                                  styles.segment,
                                  {
                                    height,
                                    backgroundColor:
                                      seg.color,
                                  },
                                  isTop &&
                                    styles.topSegment,
                                ]}
                              />
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </Pressable>

                  <Text style={styles.monthLabel}>
                    {formatLabel(
                      item.timeKey,
                      granularity
                    )}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* X AXIS */}
          <View style={styles.xAxisLine} />

          {/* TOOLTIP */}
          {tooltip && (
            <View
              style={[
                styles.tooltip,
                { borderLeftColor: tooltip.color },
              ]}
            >
              <Text style={styles.tooltipTitle}>
                {tooltip.segmentLabel}
              </Text>
              <Text style={styles.tooltipLine}>
                {tooltip.label}
              </Text>
              <Text style={styles.tooltipCost}>
                ${tooltip.cost.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* LEGEND */}
      <View style={styles.legend}>
        {selectedUtilities.map((u) => {
          const color =
            utilityColors[u.id] ??
            DEFAULT_UTILITY_COLORS[u.category];
          return (
            <View key={u.id} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: color },
                ]}
              />
              <Text style={styles.legendText}>
                {u.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },

  zoomRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  zoomBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },

  zoomBtnActive: {
    backgroundColor: colors.primary,
  },

  zoomText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },

  zoomTextActive: {
    color: '#fff',
  },

  chartContainer: {
    position: 'relative',
    paddingTop: 10,
  },

  yAxis: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 30,
    width: 36,
  },

  yAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: colors.textMuted,
  },

  grid: {
    position: 'absolute',
    left: 36,
    right: 0,
    top: 10,
    bottom: 30,
  },

  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 36,
  },

  barCol: {
    flex: 1,
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },

  barTrack: {
    width: 22,
    height: 160,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },

  stacked: {
    flex: 1,
    flexDirection: 'column-reverse',
  },

  segment: {
    width: '100%',
  },

  topSegment: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  dimmed: {
    opacity: 0.3,
  },

  monthLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },

  xAxisLine: {
    position: 'absolute',
    left: 36,
    right: 0,
    bottom: 28,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  tooltip: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 4,
    borderColor: colors.border,
    elevation: 4,
  },

  tooltipTitle: {
    fontWeight: '800',
    color: colors.text,
  },

  tooltipLine: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  tooltipCost: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 6,
    color: colors.text,
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
  },

  legendText: {
    fontSize: 11,
    color: colors.textMuted,
  },

  empty: {
    color: colors.textMuted,
    marginTop: 10,
  },
});