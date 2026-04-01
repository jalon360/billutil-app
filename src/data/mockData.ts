/**
 * UTILITY DATA TYPES & FETCHING MODULE
 * 
 * This module defines TypeScript interfaces for utility-related data
 * and provides async functions to fetch data from the backend API.
 * 
 * Data flow:
 * 1. Frontend calls these functions with user/provider IDs
 * 2. Functions fetch data from Node.js backend (http://localhost:3001)
 * 3. Backend queries PostgreSQL database
 * 4. Results are returned and stored in AppContext state
 */

/**
 * UTILITY CATEGORY TYPE
 * 
 * Represents all possible utility types the app supports.
 * Maps to the `provider_types.category` column in PostgreSQL schema.
 * 
 * Supported categories:
 *   - Electric: Electricity service providers
 *   - Gas: Natural gas utilities
 *   - Water: Water and sewer services
 *   - Trash: Waste management services
 *   - Internet: Internet service providers
 *   - Phone: Telecommunications providers
 */
export type UtilityCategory = 'Electric' | 'Gas' | 'Water' | 'Trash' | 'Internet' | 'Phone';

/**
 * PROVIDER TEMPLATE TYPE
 * 
 * Lightweight representation of a utility provider type.
 * Used for displaying provider catalogs and search results.
 * 
 * Example:
 *   {
 *     id: 'uuid-123',
 *     name: 'Duke Energy',
 *     category: 'Electric'
 *   }
 */
export type ProviderTemplate = {
  id: string;
  name: string;
  category: UtilityCategory;
};

/**
 * GET PROVIDER CATALOG
 * 
 * Fetches all available utility provider types from the backend.
 * This list grows as new providers are added to the `provider_types` table.
 * 
 * Used by AddUtilitiesScreen to display available providers when
 * users search for utilities to connect.
 * 
 * @returns Promise resolving to array of ProviderTemplates
 * @throws Error if backend API is unreachable
 */
export async function getProviderCatalog() {
  const res = await fetch('http://localhost:3001/providers');
  return res.json();
}

/**
 * CONNECTED UTILITY TYPE
 * 
 * Represents a utility that a user has successfully connected to their account.
 * This is the main data type displayed on the Dashboard.
 * 
 * Combines data from multiple database tables:
 *   - provider_connections: Connection metadata (id, status, last_sync)
 *   - provider_types: Provider info (name, category)
 *   - billing_records: Latest bill amounts and due dates
 *   - estimated_bills: Projected bill amounts
 *   - usage_records: Current usage metrics
 * 
 * Fields explained:
 *   - id: Unique identifier (UUID from provider_connections table)
 *   - providerId: Links to provider_types.id
 *   - name: Human-readable provider name (e.g., "Duke Energy")
 *   - category: Type of utility (Electric, Gas, etc)
 *   - status: Connection health (connected, syncing data, or error)
 *   - estimatedBill: Month-to-date estimated bill amount
 *   - lastBillAmount: Most recent paid/due bill amount
 *   - dueDate: When next bill payment is due
 *   - usageLabel: Unit of usage (kWh, gallon, GB, etc)
 *   - usageValue: Current usage amount as string for display
 * 
 * Example:
 *   {
 *     id: 'conn-uuid',
 *     providerId: 'prov-uuid',
 *     name: 'Duke Energy',
 *     category: 'Electric',
 *     status: 'connected',
 *     estimatedBill: 142.50,
 *     lastBillAmount: 138.75,
 *     dueDate: '2026-04-15',
 *     usageLabel: 'kWh',
 *     usageValue: '1247'
 *   }
 */
export type ConnectedUtility = {
  id: string;
  providerId: string;
  name: string;
  category: UtilityCategory;
  status: 'connected' | 'syncing' | 'error';
  estimatedBill: number;
  lastBillAmount: number;
  dueDate: string;
  usageLabel: string;
  usageValue: string;
};

/**
 * GET CONNECTED UTILITIES
 * 
 * Fetches all utilities connected to a specific user account.
 * Called when app initializes or after user logs in.
 * 
 * Database query (from server.js):
 *   SELECT provider_connections, provider_types, billing_records, 
 *          estimated_bills, usage_records
 *   WHERE user_id = $1
 * 
 * This query joins 5 tables to create a denormalized view optimized
 * for the dashboard display.
 * 
 * @param userId - User's UUID from user session
 * @returns Promise resolving to array of ConnectedUtilities
 * @throws Error if API fails or user not found
 * 
 * Example:
 *   const utilities = await getConnectedUtilities('user-uuid-456');
 *   // Returns array of user's connected providers (electric, gas, etc)
 */
export async function getConnectedUtilities(userId: string): Promise<ConnectedUtility[]> {
  const res = await fetch(`http://localhost:3001/connected/${userId}`);
  return res.json();
}


/**
 * USAGE POINT TYPE
 * 
 * Single data point representing usage at a specific time.
 * Used to build time-series charts on the Usage Charts screen.
 * 
 * Example usage data point:
 *   {
 *     label: '2026-03-27',  // Date the usage occurred
 *     value: 42.5           // Usage amount in provider's unit (kWh, gallons, etc)
 *   }
 * 
 * Multiple UsagePoints form a series for chart visualization.
 * Daily granularity is most common, but can be hourly for advanced users.
 */
export type UsagePoint = { label: string; value: number };

/**
 * GET USAGE SERIES
 * 
 * Fetches all usage records for a specific utility connection.
 * Data comes from the normalized scraper output in the `usage_records` table.
 * 
 * Example flow:
 * 1. User's provider scraper pulls usage from utility website (daily/hourly)
 * 2. Scraper normalizes the data (converts to standard units: kWh, gallons)
 * 3. Data is stored in usage_records table
 * 4. This function retrieves the time-series data
 * 5. UsageChartsScreen renders it in a line chart
 * 
 * Database query (from server.js):
 *   SELECT date, amount FROM usage_records
 *   WHERE provider_connection_id = $1
 *   ORDER BY date ASC
 * 
 * @param providerConnectionId - UUID of the utility connection
 * @returns Promise resolving to array of UsagePoints (date + amount pairs)
 * @throws Error if connection not found
 * 
 * Example:
 *   const usage = await getUsageSeries('conn-uuid-789');
 *   // [
 *   //   { label: '2026-03-01', value: 45.2 },
 *   //   { label: '2026-03-02', value: 43.8 },
 *   //   { label: '2026-03-03', value: 48.1 },
 *   // ]
 */
export async function getUsageSeries(providerConnectionId: string): Promise<UsagePoint[]> {
  const res = await fetch(`http://localhost:3001/usage/${providerConnectionId}`);
  return res.json();
}

/**
 * BILLING ROW TYPE
 * 
 * Represents a single billing statement from a utility provider.
 * Multiple BillingRows form the Billing History displayed in the app.
 * 
 * Each row represents one billing cycle from a provider.
 * Data comes from two database tables:
 *   - billing_records: Actual received bills
 *   - estimated_bills: Month-to-date projections
 * 
 * Fields:
 *   - id: Unique bill identifier (UUID)
 *   - provider: Provider name for display (e.g., "Duke Energy")
 *   - amount: Bill amount in dollars
 *   - periodStart: First day of billing cycle
 *   - periodEnd: Last day of billing cycle
 *   - dueDate: Payment deadline
 *   - paid: Whether bill has been paid (false = due/unpaid)
 * 
 * Example:
 *   {
 *     id: 'bill-uuid-001',
 *     provider: 'Duke Energy',
 *     amount: 138.75,
 *     periodStart: '2026-02-15',
 *     periodEnd: '2026-03-15',
 *     dueDate: '2026-03-30',
 *     paid: false
 *   }
 */
export type BillingRow = {
  id: string;
  provider: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paid: boolean;
};

/**
 * GET BILLING ROWS
 * 
 * Fetches all billing history for a specific utility connection.
 * Returns both paid and unpaid bills, sorted by recency.
 * 
 * Database query (from server.js):
 *   SELECT billing_records.*, provider_types.name as provider
 *   FROM billing_records
 *   JOIN provider_connections ON billing_records.provider_connection_id = pc.id
 *   JOIN provider_types ON provider_connections.provider_type_id = pt.id
 *   WHERE billing_records.provider_connection_id = $1
 *   ORDER BY due_date DESC
 * 
 * Used by:
 *   - BillingHistoryScreen: Displays list of all bills for all utilities
 *   - UtilityDetailScreen: Shows bills for a specific utility
 * 
 * @param providerConnectionId - UUID of the utility connection
 * @returns Promise resolving to array of BillingRows (sorted newest first)
 * @throws Error if connection not found
 * 
 * Example:
 *   const bills = await getBillingRows('conn-uuid-456');
 *   // Returns: [
 *   //   { provider: 'Duke Energy', amount: 138.75, dueDate: '2026-03-30' },
 *   //   { provider: 'Duke Energy', amount: 142.50, dueDate: '2026-02-28' },
 *   //   { provider: 'Duke Energy', amount: 135.25, dueDate: '2026-01-31' }
 *   // ]
 */
export async function getBillingRows(providerConnectionId: string): Promise<BillingRow[]> {
  const res = await fetch(`http://localhost:3001/billing/${providerConnectionId}`);
  return res.json();
}
