import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

const STEPS = [
  {
    title: 'Add your utilities',
    body: 'Choose from providers like Flint Energies, AT&T, Houston County Water, and more.',
  },
  {
    title: 'Secure connection',
    body: 'Your login is encrypted. We connect like Mint or Rocket Money — read-only where possible.',
  },
  {
    title: 'Stay ahead of bills',
    body: 'See estimated bills, due dates, usage charts, and full billing history in one dashboard.',
  },
];

export function OnboardingScreen({ navigation }: RootStackScreenProps<'Onboarding'>) {
  const { completeOnboarding } = useApp();
  const [index, setIndex] = useState(0);

  const isLast = index === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.brand}>BillUtil</Text>
        <View style={styles.card}>
          <Text style={styles.stepLabel}>Step {index + 1} of {STEPS.length}</Text>
          <Text style={styles.title}>{STEPS[index].title}</Text>
          <Text style={styles.body}>{STEPS[index].body}</Text>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        </View>
        <View style={styles.actions}>
          {!isLast ? (
            <PrimaryButton title="Next" onPress={() => setIndex((i) => i + 1)} />
          ) : (
            <PrimaryButton
              title="Create account"
              onPress={() => {
                completeOnboarding();
                navigation.navigate('Auth', { initialMode: 'signup' });
              }}
            />
          )}
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  stepLabel: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  body: { fontSize: 16, color: colors.textMuted, lineHeight: 24 },
  dots: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 22 },
  actions: { gap: spacing.sm, paddingTop: spacing.lg },
  back: { alignItems: 'center', padding: spacing.sm },
  backText: { color: colors.textMuted, fontSize: 15 },
});
