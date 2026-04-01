import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function WelcomeScreen({ navigation }: RootStackScreenProps<'Welcome'>) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.logo}>BillUtil</Text>
          <Text style={styles.tagline}>Track all your utilities in one place.</Text>
          <Text style={styles.sub}>
            Connect electric, water, and internet accounts. See usage, estimates, and billing history
            at a glance.
          </Text>
        </View>
        <PrimaryButton
          title="Get started"
          onPress={() => navigation.navigate('Onboarding')}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: { flex: 1, justifyContent: 'center' },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 30,
  },
  sub: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 24,
  },
  cta: { marginBottom: spacing.md },
});
