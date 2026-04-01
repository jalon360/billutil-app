import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { UsagePoint } from '../data/mockData';

type Props = {
  data: UsagePoint[];
  unit?: string;
};

export function UsageBarChart({ data, unit = 'kWh' }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {data.map((point) => {
          const h = Math.round((point.value / max) * BAR_MAX_PX);
          return (
            <View key={point.label} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: h }]} />
              </View>
              <Text style={styles.barLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.caption}>Daily usage ({unit}) — sample data</Text>
    </View>
  );
}

const BAR_MAX_PX = 120;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
    minHeight: 140,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    maxWidth: 36,
    height: BAR_MAX_PX,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.chart1,
    borderRadius: radius.sm,
  },
  barLabel: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.textMuted,
  },
  caption: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
