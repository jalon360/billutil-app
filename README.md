# BillUtil (Expo)

React Native app (TypeScript) for **mobile and web**, aligned with the BillUtil product outline: onboarding, add utilities, dashboard, usage charts, and billing history.

## Run

```bash
cd billutil-app
npm install
npm start
```

- **Android:** `npm run android` (or press `a` in the dev server)
- **iOS:** `npm run ios` (macOS + Xcode, or Expo Go on a device)
- **Web:** `npm run web`

## Flow

1. **Welcome** → **Onboarding** (3 steps) → **Auth** (any email/password or “Continue as guest”)
2. **Main tabs:** Home (dashboard), Add, Usage, Bills
3. **Add** opens provider grid → **Connect** (demo “connect” with loading + success)
4. **Dashboard** cards open **Utility detail** (Usage / Billing / Settings tabs)

Data is **mock/local** until you wire a backend (auth, `/providers`, `/dashboard`, etc.).

## Project layout

- `App.tsx` — root + gesture handler + `AppProvider`
- `src/navigation/` — stack + bottom tabs
- `src/screens/` — feature screens (`.tsx`)
- `src/context/AppContext.tsx` — demo app state
- `src/data/mockData.ts` — sample providers, usage, billing

## Web build

```bash
npx expo export --platform web
```

Output is written to `dist/`.
