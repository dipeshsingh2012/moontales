import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Text, View, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import HomeScreen      from '../screens/HomeScreen';
import LibraryScreen   from '../screens/LibraryScreen';
import CreateScreen    from '../screens/CreateScreen';
import SettingsScreen  from '../screens/SettingsScreen';
import StoryViewScreen from '../screens/StoryViewScreen';
import LoginScreen     from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TABS = [
  { name: 'Home',     icon: '🏠', label: 'Home',     component: HomeScreen },
  { name: 'Library',  icon: '📚', label: 'Library',  component: LibraryScreen },
  { name: 'Create',   icon: '✨', label: 'Create',   component: CreateScreen },
  { name: 'Settings', icon: '⚙️', label: 'Settings', component: SettingsScreen },
];

function TabBar({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.tabBar, borderTopColor: colors.border }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = TABS.find((t) => t.name === route.name)!;

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconWrap, isFocused && { backgroundColor: colors.primary + '33' }]}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
            </View>
            <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.textSecondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      {TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 64 }}>🌙</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main"      component={MainTabs} />
            <Stack.Screen
              name="StoryView"
              component={StoryViewScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingBottom: 8,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabIconWrap: {
    width: 44, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 2,
  },
  tabIcon:  { fontSize: 20 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  splash:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
