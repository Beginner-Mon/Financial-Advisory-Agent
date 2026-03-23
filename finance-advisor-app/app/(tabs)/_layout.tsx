/**
 * Tab Navigator — 5 tabs: Home, Accounts, Transfer, Discover, Profile
 * Step 7.6 — Bottom Tab Navigator
 */
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontWeight, Shadows } from '../../constants/theme';
import { View, StyleSheet } from 'react-native';

type IoniconsName = keyof typeof Ionicons.glyphMap;

const TAB_CONFIG: {
  name: string;
  title: string;
  headerTitle: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}[] = [
  { name: 'home', title: 'Home', headerTitle: 'Finance Advisor', icon: 'home-outline', iconFocused: 'home' },
  { name: 'accounts', title: 'Accounts', headerTitle: 'Accounts', icon: 'wallet-outline', iconFocused: 'wallet' },
  { name: 'transfer', title: 'Transfer', headerTitle: 'Transfer', icon: 'swap-horizontal-outline', iconFocused: 'swap-horizontal' },
  { name: 'discover', title: 'Discover', headerTitle: 'Discover', icon: 'compass-outline', iconFocused: 'compass' },
  { name: 'profile', title: 'Profile', headerTitle: 'Profile', icon: 'person-outline', iconFocused: 'person' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: FontWeight.bold,
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.cardBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: FontWeight.semibold,
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerTitle: tab.headerTitle,
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activeIconContainer : undefined}>
                <Ionicons
                  name={focused ? tab.iconFocused : tab.icon}
                  size={22}
                  color={color}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
