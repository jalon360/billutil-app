import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getConnectedUtilities,
  getUsageSeries,
  getBillingRows,
  type BillingRow,
  type ConnectedUtility,
  type UtilityCategory,
  type UsagePoint,
} from '../data/mockData';

// Dashboard color mapping (wireframe requirement):
// yellow = electric, blue = water, green = trash, pink = internet, red = gas.
export const DEFAULT_UTILITY_COLORS: Record<UtilityCategory, string> = {
  Electric: '#fbbf24',
  Water: '#3b82f6',
  Trash: '#22c55e',
  Internet: '#ec4899',
  Gas: '#ef4444',
  Phone: '#8b5cf6',
};

type AppState = {
  // Frontend stores a *denormalized* view of the backend:
  // - `utilities` ~ `provider_connections` joined with `provider_types`
  // - `usageSeries` ~ sample `usage_records` (scraper output normalized)
  // - `billingHistory` ~ sample `billing_records` + `estimated_bills`
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  utilities: ConnectedUtility[];
  usageSeries: UsagePoint[];
  billingHistory: BillingRow[];
  isLoading: boolean;
  error: string | null;
};

type AppContextValue = AppState & {
  completeOnboarding: () => void;
  signIn: (email: string, userId: string, _password: string) => void;
  // Demo: maps to `POST /auth/register`
  signUp: (email: string, userId: string, _password: string) => void;
  signOut: () => void;
  addUtility: (u: ConnectedUtility) => void;
  updateUtility: (id: string, patch: Partial<ConnectedUtility>) => void;
  // Per-utility color customization for the dashboard chart.
  utilityColors: Record<string, string>;
  setUtilityColor: (utilityId: string, color: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [utilities, setUtilities] = useState<ConnectedUtility[]>([]);
  const [usageSeries, setUsageSeries] = useState<UsagePoint[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [utilityColors, setUtilityColors] = useState<Record<string, string>>({});

  // Fetch utilities when userId changes
  useEffect(() => {
    if (!userId) {
      setUtilities([]);
      setUsageSeries([]);
      setBillingHistory([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch connected utilities
        const utilitiesData = await getConnectedUtilities(userId);
        setUtilities(utilitiesData);

        // Initialize utility colors
        const colors: Record<string, string> = {};
        for (const u of utilitiesData) {
          colors[u.id] = DEFAULT_UTILITY_COLORS[u.category];
        }
        setUtilityColors(colors);

        // Fetch usage series for all utilities
        const allUsageSeries: UsagePoint[] = [];
        for (const utility of utilitiesData) {
          try {
            const usageData = await getUsageSeries(utility.id);
            allUsageSeries.push(...usageData);
          } catch (err) {
            console.warn(`Failed to fetch usage for utility ${utility.id}:`, err);
          }
        }
        setUsageSeries(allUsageSeries);

        // Fetch billing history for all utilities
        const allBillingRows: BillingRow[] = [];
        for (const utility of utilitiesData) {
          try {
            const billingData = await getBillingRows(utility.id);
            allBillingRows.push(...billingData);
          } catch (err) {
            console.warn(`Failed to fetch billing for utility ${utility.id}:`, err);
          }
        }
        setBillingHistory(allBillingRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Error fetching app data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
  }, []);

  const signIn = useCallback((_email: string, newUserId: string, _password: string) => {
    setUserId(newUserId);
    setIsAuthenticated(true);
  }, []);

  const signUp = useCallback((_email: string, newUserId: string, _password: string) => {
    // In a real backend call, you would:
    // - POST /auth/register
    // - then set an auth session/token on success
    setUserId(newUserId);
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setUserId(null);
    setUtilities([]);
    setUsageSeries([]);
    setBillingHistory([]);
  }, []);

  const addUtility = useCallback((u: ConnectedUtility) => {
    setUtilities((prev) => [...prev, u]);
    setUtilityColors((prev) => ({
      ...prev,
      [u.id]: prev[u.id] ?? DEFAULT_UTILITY_COLORS[u.category],
    }));
  }, []);

  const updateUtility = useCallback((id: string, patch: Partial<ConnectedUtility>) => {
    setUtilities((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
  }, []);

  const setUtilityColor = useCallback((utilityId: string, color: string) => {
    setUtilityColors((prev) => ({ ...prev, [utilityId]: color }));
  }, []);

  const value = useMemo(
    () => ({
      hasCompletedOnboarding,
      isAuthenticated,
      userId,
      utilities,
      usageSeries,
      billingHistory,
      isLoading,
      error,
      completeOnboarding,
      signIn,
      signUp,
      signOut,
      addUtility,
      updateUtility,
      utilityColors,
      setUtilityColor,
    }),
    [
      hasCompletedOnboarding,
      isAuthenticated,
      userId,
      utilities,
      usageSeries,
      billingHistory,
      isLoading,
      error,
      completeOnboarding,
      signIn,
      signUp,
      signOut,
      addUtility,
      updateUtility,
      utilityColors,
      setUtilityColor,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
