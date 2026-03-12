import { Stack } from 'expo-router';
import React from 'react';
import { theme } from '../../lib/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="onboarding"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="connect-accounts"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="provider-login"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="player"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="manage-licenses"
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
