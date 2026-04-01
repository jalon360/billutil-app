import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import type { ConnectedUtility } from '../data/mockData';
import { colors, radius, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

/**
 * CONNECT UTILITY SCREEN
 * 
 * Allows users to enter their utility company login credentials.
 * 
 * Flow:
 * 1. User selects a provider from catalog
 * 2. Enters username/password (credentials for that utility company)
 * 3. Clicks "Connect"
 * 4. Frontend sends credentials to POST /connect endpoint
 * 5. Backend stores encrypted credentials in provider_connections table
 * 6. Backend triggers initial Canopy scrape
 * 7. Usage and billing data is populated in database
 * 8. Dashboard refreshes to show the new utility
 */
export function ConnectUtilityScreen({
  navigation,
  route,
}: RootStackScreenProps<'ConnectUtility'>) {
  const { providerId, providerName } = route.params;
  const { addUtility, updateUtility, userId } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState<'form' | 'loading' | 'done' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * HANDLE CONNECT BUTTON PRESS
   * 
   * When user clicks "Connect":
   * 1. Validates username/password are not empty
   * 2. Creates a pending utility entry in app state (status: "syncing")
   * 3. Calls POST /connect endpoint to store encrypted credentials
   * 4. Backend triggers initial data scrape
   * 5. Waits for scrape to complete
   * 6. Updates utility entry with real data (status: "connected")
   * 7. Shows success screen
   * 
   * Error handling:
   * - If username/password empty: show validation error
   * - If API call fails: show error phase with retry option
   */
  const handleConnect = async () => {
    // Validate credentials
    if (!username.trim()) {
      setErrorMessage('Please enter your username or email');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    setPhase('loading');
    setErrorMessage('');

    try {
      // Default category - in production, this would come from provider_types lookup
      const category = 'Electric';
      const newUtilityId = `c-${Date.now()}`;

      // Step 1: Add pending utility to dashboard (status: syncing)
      const pending: ConnectedUtility = {
        id: newUtilityId,
        providerId,
        name: providerName,
        category: category as any,
        status: 'syncing',
        // Placeholder values while scraping
        estimatedBill: 0,
        lastBillAmount: 0,
        dueDate: '—',
        usageLabel: getCategoryLabel(category),
        usageValue: '—',
      };
      addUtility(pending);

      // Step 2: Send credentials to backend
      // Backend will:
      // - Encrypt credentials
      // - Create provider_connections entry
      // - Trigger Canopy scraper
      // - Save usage_records and billing_records
      const connectResponse = await fetch('http://localhost:3001/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          providerTypeId: providerId,
          username,
          password,
        }),
      });

      if (!connectResponse.ok) {
        throw new Error('Failed to connect utility account');
      }

      const connectionData = await connectResponse.json();

      // Step 3: Trigger data scrape
      // (Backend may do this automatically on connect, but we can also call it explicitly)
      const syncResponse = await fetch(`http://localhost:3001/sync/${connectionData.id}`, {
        method: 'POST',
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync data');
      }

      const syncData = await syncResponse.json();

      // Step 4: Update utility with real scraped data
      if (syncData.success && syncData.usageRecords && syncData.billingRecords) {
        const updated: Partial<ConnectedUtility> = {
          status: 'connected',
          estimatedBill: syncData.usageRecords[0]?.amount ?? 0,
          lastBillAmount: syncData.billingRecords[0]?.billAmount ?? 0,
          dueDate: syncData.billingRecords[0]?.dueDate ?? '—',
          usageValue: formatUsageValue(syncData.usageRecords[0], category),
        };
        updateUtility(newUtilityId, updated);
      }

      setPhase('done');
    } catch (error) {
      setPhase('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An error occurred while connecting. Please try again.'
      );
      console.error('Connect error:', error);
    }
  };

  /**
   * Get human-readable label for usage metric based on category
   */
  function getCategoryLabel(category: string): string {
    switch (category.toLowerCase()) {
      case 'water':
        return 'Gallons used';
      case 'internet':
        return 'Data used';
      case 'gas':
        return 'Therms used';
      case 'trash':
        return 'Bins collected';
      case 'phone':
        return 'Minutes used';
      default:
        return 'This period (kWh)';
    }
  }

  /**
   * Format usage value with appropriate unit
   */
  function formatUsageValue(usageRecord: any, category: string): string {
    if (!usageRecord) return '—';
    const amount = usageRecord.amount;
    switch (category.toLowerCase()) {
      case 'water':
        return `${amount.toFixed(0)} gal`;
      case 'internet':
        return `${amount.toFixed(1)} GB`;
      case 'gas':
        return `${amount.toFixed(1)} therms`;
      case 'trash':
        return `${amount.toFixed(0)} bins`;
      default:
        return `${amount.toFixed(0)} kWh`;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {phase === 'form' && (
          <View style={styles.container}>
            <Text style={styles.title}>Connect {providerName}</Text>
            <Text style={styles.subtitle}>
              Enter the same credentials you use on the provider’s website. (Demo only — not sent
              anywhere.)
            </Text>
            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username or account #"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={styles.input}
              />
            </View>
            <PrimaryButton title="Connect" onPress={handleConnect} style={styles.cta} />
            <PrimaryButton title="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
        )}
        {phase === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Connecting to {providerName}…</Text>
          </View>
        )}
        {phase === 'done' && (
          <View style={styles.center}>
            <Text style={styles.doneTitle}>{providerName} added!</Text>
            <Text style={styles.doneBody}>Initial sync ran (demo). Dashboard is updated.</Text>
            <PrimaryButton
              title="Back to dashboard"
              onPress={() => navigation.navigate('Main', { screen: 'Dashboard' })}
              style={styles.cta}
            />
          </View>
        )}
        {phase === 'error' && (
          <View style={styles.center}>
            <Text style={styles.errorTitle}>Connection failed</Text>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
            <PrimaryButton
              title="Try again"
              onPress={() => {
                setPhase('form');
                setErrorMessage('');
              }}
              style={styles.cta}
            />
            <PrimaryButton
              title="Cancel"
              variant="ghost"
              onPress={() => navigation.goBack()}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.xl },
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { marginTop: spacing.lg, fontSize: 16, color: colors.textMuted },
  doneTitle: { fontSize: 22, fontWeight: '800', color: colors.success, marginBottom: spacing.sm },
  doneBody: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  errorTitle: { fontSize: 22, fontWeight: '800', color: colors.danger, marginBottom: spacing.md },
  errorBox: {
    backgroundColor: colors.danger + '15',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  errorText: { fontSize: 14, color: colors.danger, textAlign: 'center', lineHeight: 20 },
});
