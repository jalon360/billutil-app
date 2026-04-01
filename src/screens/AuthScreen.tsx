import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function AuthScreen({
  navigation,
  route,
}: RootStackScreenProps<'Auth'>) {
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    route.params?.initialMode ?? 'signin'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'signin' ? 'Welcome to BillUtil' : 'Create your BillUtil account';
  const subtitle =
    mode === 'signin'
      ? 'Sign in to sync your utilities (demo — any values work).'
      : 'Create an account to connect utilities (demo — values are not sent anywhere).';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => {
                setError(null);
                setMode('signin');
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'signin' && styles.toggleTextActive,
                ]}
              >
                Sign in
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setError(null);
                setMode('signup');
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'signup' && styles.toggleTextActive,
                ]}
              >
                Sign up
              </Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.input}
            />
          </View>

          {mode === 'signup' && (
            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={styles.input}
              />
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          {mode === 'signin' ? (
            <PrimaryButton
              title="Sign in"
              onPress={() => {
                setError(null);
                // Wireframe mapping:
                // - This is the frontend for `POST /auth/login`
                // - Demo note: we don't call a backend here; the context flips `isAuthenticated`.
                signIn(email, password);
                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
              }}
              style={styles.cta}
            />
          ) : (
            <PrimaryButton
              title="Create account"
              onPress={() => {
                setError(null);
                if (!email.trim()) {
                  setError('Please enter your email.');
                  return;
                }
                if (password.length < 6) {
                  setError('Password must be at least 6 characters (demo validation).');
                  return;
                }
                if (password !== confirmPassword) {
                  setError('Passwords do not match.');
                  return;
                }

                // Wireframe mapping:
                // - This is the frontend for `POST /auth/register`
                // - Demo note: we don't call a backend here; the context flips `isAuthenticated`.
                signUp(email, password);
                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
              }}
              style={styles.cta}
            />
          )}

          <PrimaryButton
            title="Continue as guest"
            variant="outline"
            onPress={() => {
              // Guest flow mapping:
              // - a backend might create a temporary user or allow anonymous provider connections.
              signIn('guest@local', '');
              navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 22 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  toggleText: { color: colors.textMuted, fontWeight: '600' },
  toggleTextActive: { color: colors.primary },
  field: { marginBottom: spacing.md },
  label: { color: colors.textMuted, marginBottom: spacing.xs, fontSize: 13 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'web' ? 12 : 14,
    color: colors.text,
    fontSize: 16,
  },
  cta: { marginBottom: spacing.sm },
  error: { color: colors.danger, fontWeight: '600', marginBottom: spacing.sm },
});
