import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.midnight },
        tabBarActiveTintColor: colors.burntOrange,
        tabBarInactiveTintColor: colors.dust
      }}
    >
      <Tabs.Screen name="scores" options={{ title: 'Scores' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="articles" options={{ title: 'Articles' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
