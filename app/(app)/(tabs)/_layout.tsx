import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  ListMusic,
  PlusCircle,
  Search,
  Settings,
} from 'lucide-react-native';
import React from 'react';
import { theme } from '../../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.plum,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.gray100,
          paddingBottom: 8,
          height: 64,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="find-cme"
        options={{
          title: 'Find CME',
          tabBarIcon: ({ color }) => (
            <Search size={22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="playlist"
        options={{
          title: 'Playlist',
          tabBarIcon: ({ color }) => (
            <ListMusic size={22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="log-credit"
        options={{
          title: 'Log Credit',
          tabBarIcon: ({ color }) => (
            <PlusCircle size={22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Settings size={22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
