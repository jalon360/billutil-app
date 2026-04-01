import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { ConnectUtilityScreen } from '../screens/ConnectUtilityScreen';
import { UtilityDetailScreen } from '../screens/UtilityDetailScreen';
import { MainTabs } from './MainTabs';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export function RootNavigator() {
  const { hasCompletedOnboarding, isAuthenticated } = useApp();

  // UI wireframe mapping (from `User installs BillUtil.md`):
  // - Welcome -> Onboarding -> Auth (account creation)
  // - Auth -> Main tabs (Home dashboard, Add utilities, Usage charts, Bills)
  // In this mock app, the transitions are driven by AppContext state.
  const initialRouteName = useMemo((): keyof RootStackParamList => {
    if (isAuthenticated) return 'Main';
    if (hasCompletedOnboarding) return 'Auth';
    return 'Welcome';
  }, [hasCompletedOnboarding, isAuthenticated]);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="ConnectUtility" component={ConnectUtilityScreen} />
        <Stack.Screen name="UtilityDetail" component={UtilityDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
