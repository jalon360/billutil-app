/**
 * ADD UTILITIES SCREEN
 * 
 * Enables users to search for and add new utility providers to their account.
 * 
 * Features:
 *   1. Search existing provider catalog
 *   2. Enter zipcode to auto-fill state/county (via Zipcode API)
 *   3. Manual state/county entry
 *   4. Search for providers in that area (via Canopy scraper)
 *   5. Create custom provider entry if not found
 * 
 * Data Flow:
 *   User enters zipcode → Zipcode API returns state/county
 *   → User selects category (Electric, Gas, etc)
 *   → Canopy scraper finds providers in that area
 *   → User selects provider or creates custom entry
 */

import {FlatList,Pressable,StyleSheet,Text,View,TextInput,Modal,ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState, useEffect } from 'react';
import { getProviderCatalog } from '../data/mockData';
import type { UtilityProvider } from '../data/utilityLookup';
import {
  isValidUSZipcode,
  lookupZipcodeInfo,
  searchUtilityProviders,
} from '../data/utilityLookup';
import { colors, radius, spacing } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';

const CATEGORY_LABEL: Record<string, string> = {
  electric: 'Electric',
  gas: 'Gas',
  water: 'Water',
  trash: 'Trash',
  internet: 'Internet',
  phone: 'Phone',
};

/**
 * ZIPCODE VALIDATION
 * 
 * Validates if input is a properly formatted US zipcode.
 * Accepts 5-digit or 9-digit (ZIP+4) formats.
 * Imported from utilityLookup.ts but kept here for convenience.
 * 
 * @param zipInput - User-entered zipcode
 * @returns true if valid format and in US range
 */
function isValidUSZip(zipInput: string): boolean {
  return isValidUSZipcode(zipInput);
}

/**
 * URL VALIDATION
 * 
 * Checks if a string is a valid HTTP/HTTPS URL.
 * Used to validate billing website URLs before submission.
 * 
 * @param url - URL string to validate
 * @returns true if valid URL format
 */
function isValidURL(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * WEBSITE REACHABILITY CHECK
 * 
 * Validates that a provider's billing website is accessible.
 * Should be called via backend API endpoint that does HEAD request.
 * 
 * @param url - Provider website to check
 * @returns Promise resolving to true if reachable, false otherwise
 * 
 * TODO: Replace with actual API call (node /api/check-url or similar)
 */
async function validateWebsiteReachable(url: string): Promise<boolean> {
  // TODO: replace with backend API call
  // Example: POST /api/validate-website with { url }
  return true;
}

export function AddUtilitiesScreen({ navigation }: MainTabScreenProps<'AddUtilities'>) {
  // Form field states
  const [query, setQuery] = useState('');           // Search query for provider catalog
  const [showModal, setShowModal] = useState(false); // Modal visibility toggle

  // User input fields
  const [name, setName] = useState('');       // Custom provider name
  const [zip, setZip] = useState('');         // User-entered zipcode
  const [stateVal, setStateVal] = useState(''); // State (auto-filled or manual)
  const [county, setCounty] = useState('');   // County (auto-filled or manual)
  const [website, setWebsite] = useState(''); // Billing website URL
  const [category, setCategory] = useState<'Electric' | 'Gas' | 'Water' | 'Trash' | 'Internet' | 'Phone'>('Electric');

  // UI states
  const [loadingZip, setLoadingZip] = useState(false);       // Loading state for zipcode lookup
  const [foundProviders, setFoundProviders] = useState<UtilityProvider[]>([]);  // Results from scraper
  const [searchError, setSearchError] = useState('');        // Error message display

  /**
   * SEARCH EXISTING PROVIDERS
   * 
   * Shows search results from provider lookup or provider catalog.
   * When user has performed a search, shows foundProviders.
   * Otherwise, shows empty list (user needs to search first).
   */
  const displayProviders: UtilityProvider[] = foundProviders.length > 0 
    ? foundProviders 
    : [];

  const showAddNew = query.length > 2 && foundProviders.length === 0 && searchError.length === 0;

  /**
   * ZIPCODE AUTO-FILL EFFECT
   * 
   * When user enters a valid zipcode:
   * 1. Validates zipcode format
   * 2. Calls Zipcode API to get state/county
   * 3. Auto-fills location fields
   * 4. Sets up for provider search
   * 
   * Dependencies: [zip] - triggers whenever zipcode changes
   */
  useEffect(() => {
    const performZipcodeLookup = async () => {
      // Only lookup if zipcode is valid
      if (zip.length >= 5 && isValidUSZip(zip)) {
        setLoadingZip(true);
        setSearchError('');
        try {
          // Call real Zipcode API
          const locationInfo = await lookupZipcodeInfo(zip);
          setStateVal(locationInfo.state);
          setCounty(locationInfo.county);
        } catch (error) {
          setSearchError(
            error instanceof Error 
              ? error.message 
              : 'Failed to look up zipcode'
          );
        } finally {
          setLoadingZip(false);
        }
      }
    };
    performZipcodeLookup();
  }, [zip]);

  /**
   * SEARCH FOR PROVIDERS
   * 
   * Called when user selects a category after entering zipcode.
   * Uses Canopy API scraper to find utilities serving that area.
   * 
   * @param selectedCategory - Utility type (Electric, Gas, Water, etc)
   */
  const handleSearchProviders = async (
    selectedCategory: 'Electric' | 'Gas' | 'Water' | 'Trash' | 'Internet' | 'Phone'
  ) => {
    if (!zip && !(stateVal && county)) {
      return alert('Enter ZIP OR State + County');
    }

    if (zip && !isValidUSZip(zip)) {
      return alert('Invalid ZIP code');
    }

    setLoadingZip(true);
    setSearchError('');

    try {
      const providers = await searchUtilityProviders(
        zip,
        stateVal,
        county,
        selectedCategory.toLowerCase() as any
      );
      setFoundProviders(providers);

      if (providers.length === 0) {
        setSearchError(`No ${selectedCategory} providers found for this area`);
      }
    } catch (error) {
      setSearchError(
        error instanceof Error 
          ? error.message 
          : 'Failed to search providers'
      );
    } finally {
      setLoadingZip(false);
    }
  };
  /**
   * SUBMIT CUSTOM UTILITY PROVIDER
   * 
   * Called when user creates a custom provider entry.
   * Validates all required fields and submits to backend.
   * 
   * Validation steps:
   * 1. Utility name is required (non-empty)
   * 2. Website must be valid HTTP/HTTPS URL
   * 3. Location: either zipcode OR state+county required
   * 4. Zipcode must be valid format if provided
   * 5. Website must be reachable (HEAD request check)
   * 
   * On success: Creates provider_types entry and provider_connections link
   * On error: Shows alert with validation message
   */
  const handleSubmitNew = async () => {
    // Step 1: Validate utility name
    if (!name.trim()) {
      return alert('Utility name is required');
    }

    // Step 2: Validate website is a valid URL
    if (!website.trim() || !isValidURL(website)) {
      return alert('Valid billing website is required');
    }

    // Step 3: Validate location (at least zipcode OR state+county)
    if (!zip && !(stateVal && county)) {
      return alert('Enter ZIP OR State + County');
    }

    // Step 4: If zipcode provided, validate format
    if (zip && !isValidUSZip(zip)) {
      return alert('Invalid ZIP code');
    }

    // Step 5: Check if website is actually reachable
    const reachable = await validateWebsiteReachable(website);
    if (!reachable) {
      return alert('Website is not reachable');
    }

    // TODO: Send to backend
    // POST /api/providers/custom
    // with JSON payload: { name, category, website, zipcode: zip, state, county }
    // Backend will:
    // 1. Create entry in provider_types table
    // 2. Create provider_connections entry
    // 3. Initialize scraper for this provider
    console.log('NEW UTILITY:', {
      name,
      zip,
      state: stateVal,
      county,
      website,
      category,
    });

    setShowModal(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Add utilities</Text>

        <TextInput
          placeholder="Search utility company..."
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          placeholderTextColor={colors.textMuted}
        />

        {showAddNew && (
          <Pressable style={styles.addNew} onPress={() => setShowModal(true)}>
            <Text style={styles.addNewText}>
              + Add "{query}" as new utility
            </Text>
          </Pressable>
        )}

        <FlatList
          data={displayProviders}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate('ConnectUtility', {
                  providerId: item.id,
                  providerName: item.name,
                })
              }
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {CATEGORY_LABEL[item.category]}
              </Text>
            </Pressable>
          )}
        />

        {/* MODAL */}
        <Modal visible={showModal} animationType="slide">
          <SafeAreaView style={styles.modalWrap}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Utility</Text>

              <TextInput placeholder="Utility name" style={styles.input} value={name} onChangeText={setName} />

              <TextInput
                placeholder="ZIP code"
                style={styles.input}
                value={zip}
                onChangeText={setZip}
                keyboardType="numeric"
              />

              {loadingZip && <Text style={styles.helper}>Looking up location...</Text>}

              <TextInput placeholder="State" style={styles.input} value={stateVal} onChangeText={setStateVal} />
              <TextInput placeholder="County" style={styles.input} value={county} onChangeText={setCounty} />

              <TextInput
                placeholder="Billing website (https://...)"
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
              />

              <View style={styles.categoryRow}>
                {Object.keys(CATEGORY_LABEL).map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c as any)}
                    style={[styles.catBtn, category === c && styles.catBtnActive]}
                  >
                    <Text style={[styles.catText, category === c && styles.catTextActive]}>
                      {CATEGORY_LABEL[c]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable style={styles.submit} onPress={handleSubmitNew}>
                <Text style={styles.submitText}>Submit</Text>
              </Pressable>

              <Pressable onPress={() => setShowModal(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg },

  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: spacing.md },

  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    color: colors.text,
  },

  addNew: {
    padding: 10,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },

  addNewText: { color: colors.primary, fontWeight: '600' },

  list: { paddingBottom: spacing.xl * 2 },
  row: { gap: spacing.md, marginBottom: spacing.md },

  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 100,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.primary, marginTop: 4 },

  modalWrap: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.lg },

  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: spacing.md, color: colors.text },

  input: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    color: colors.text,
  },

  helper: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },

  catBtn: { padding: 8, borderRadius: 8, backgroundColor: colors.surfaceElevated },
  catBtnActive: { backgroundColor: colors.primary },

  catText: { fontSize: 12, color: colors.textMuted },
  catTextActive: { color: '#fff' },

  submit: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },

  submitText: { color: '#fff', fontWeight: '700' },

  cancel: { textAlign: 'center', marginTop: spacing.md, color: colors.textMuted },
});