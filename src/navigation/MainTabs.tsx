import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, Text } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AddUtilitiesScreen } from '../screens/AddUtilitiesScreen';
import { UsageChartsScreen } from '../screens/UsageChartsScreen';
import { BillingHistoryScreen } from '../screens/BillingHistoryScreen';
import { colors } from '../theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function tabLabel(focused: boolean, label: string) {
  return <Text style={[styles.tabText, focused && styles.tabTextFocused]}>{label}</Text>;
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'web' ? 64 : 58,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: ({ focused }) => tabLabel(focused, 'Home'),
        }}
      />
      <Tab.Screen
        name="AddUtilities"
        component={AddUtilitiesScreen}
        options={{
          tabBarLabel: ({ focused }) => tabLabel(focused, 'Add'),
        }}
      />
      <Tab.Screen
        name="UsageCharts"
        component={UsageChartsScreen}
        options={{
          tabBarLabel: ({ focused }) => tabLabel(focused, 'Usage'),
        }}
      />
      <Tab.Screen
        name="BillingHistory"
        component={BillingHistoryScreen}
        options={{
          tabBarLabel: ({ focused }) => tabLabel(focused, 'Bills'),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  tabTextFocused: { color: colors.primary },
});
