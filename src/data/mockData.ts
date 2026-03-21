// Matches `provider_types.category` in the backend schema (wireframe doc):
// electric, gas, water, trash, internet.
export type UtilityCategory = 'electric' | 'gas' | 'water' | 'trash' | 'internet';

export type ProviderTemplate = {
  id: string;
  name: string;
  category: UtilityCategory;
};

export const PROVIDER_CATALOG: ProviderTemplate[] = [
  { id: 'flint', name: 'Flint Energies', category: 'electric' },
  { id: 'ga-gas', name: 'Georgia Gas', category: 'gas' },
  { id: 'att', name: 'AT&T Internet', category: 'internet' },
  { id: 'houston-water', name: 'Houston County Water', category: 'water' },
  { id: 'clean-bins', name: 'Clean Bins Trash', category: 'trash' },
  { id: 'xfinity', name: 'Xfinity', category: 'internet' },
  { id: 'ga-power', name: 'Georgia Power', category: 'electric' },
];

export type ConnectedUtility = {
  // Wireframe mapping:
  // - backend table: `provider_connections`
  // - provider name/category come from `provider_types`
  // - dashboard fields combine `estimated_bills` + `billing_records` projections
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

export const MOCK_CONNECTED: ConnectedUtility[] = [
  {
    id: 'c1',
    providerId: 'flint',
    name: 'Flint Energies',
    category: 'electric',
    status: 'connected',
    estimatedBill: 142.5,
    lastBillAmount: 128.4,
    dueDate: '2026-04-05',
    usageLabel: 'This period (kWh)',
    usageValue: '1,240',
  },
  {
    id: 'c-gas',
    providerId: 'ga-gas',
    name: 'Georgia Gas',
    category: 'gas',
    status: 'connected',
    estimatedBill: 71.15,
    lastBillAmount: 66.8,
    dueDate: '2026-04-09',
    usageLabel: 'Therms used',
    usageValue: '520',
  },
  {
    id: 'c2',
    providerId: 'houston-water',
    name: 'Houston County Water',
    category: 'water',
    status: 'connected',
    estimatedBill: 48.2,
    lastBillAmount: 44.0,
    dueDate: '2026-04-12',
    usageLabel: 'Gallons used',
    usageValue: '12,400',
  },
  {
    id: 'c-trash',
    providerId: 'clean-bins',
    name: 'Clean Bins Trash',
    category: 'trash',
    status: 'connected',
    estimatedBill: 24.5,
    lastBillAmount: 23.1,
    dueDate: '2026-04-20',
    usageLabel: 'Bins collected',
    usageValue: '14',
  },
  {
    id: 'c3',
    providerId: 'att',
    name: 'AT&T Internet',
    category: 'internet',
    status: 'connected',
    estimatedBill: 79.99,
    lastBillAmount: 79.99,
    dueDate: '2026-04-01',
    usageLabel: 'Data used',
    usageValue: '420 GB',
  },
];

export type UsagePoint = { label: string; value: number };

// Sample of `usage_records` (daily/hourly usage) after a scraper normalizes provider data.
// In a real app, you’d load different usage series per `provider_connection_id`/utility.
export const MOCK_USAGE_SERIES: UsagePoint[] = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 38 },
  { label: 'Wed', value: 55 },
  { label: 'Thu', value: 48 },
  { label: 'Fri', value: 51 },
  { label: 'Sat', value: 44 },
  { label: 'Sun', value: 39 },
];

export type BillingRow = {
  id: string;
  provider: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paid: boolean;
};

export const MOCK_BILLING: BillingRow[] = [
  {
    id: 'b1',
    provider: 'Flint Energies',
    amount: 128.4,
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    dueDate: '2026-03-05',
    paid: true,
  },
  {
    id: 'b2',
    provider: 'Houston County Water',
    amount: 44.0,
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    dueDate: '2026-03-12',
    paid: true,
  },
  {
    id: 'b3',
    provider: 'AT&T Internet',
    amount: 79.99,
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    dueDate: '2026-03-01',
    paid: true,
  },
  {
    id: 'b4',
    provider: 'Flint Energies',
    amount: 135.2,
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    dueDate: '2026-02-05',
    paid: true,
  },
];
