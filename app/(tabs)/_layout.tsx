import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { KikikuruTabIcon } from '@/components/ui/KikikuruTabIcon';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        /* webではラベルが画面外に切れないよう高さを確保 */
        tabBarStyle: Platform.OS === 'web' ? { height: 60, paddingBottom: 8 } : undefined,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '天気予報',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="cloud.sun.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="radar"
        options={{
          title: '衛星/レーダー',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="cloud.rain.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="kikikuru"
        options={{
          title: 'キキクル',
          tabBarIcon: ({ focused }) => <KikikuruTabIcon focused={focused} size={24} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
