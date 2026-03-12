import { router, SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../lib/auth-store';
import { theme } from '../lib/theme';

SplashScreen.preventAutoHideAsync();

/**
 * RootLayout: Sets up providers and watches auth state.
 * On auth state change, redirects to the appropriate screen.
 */
export default function RootLayout() {
  const { initialize, isLoading, session, isOnboarded } = useAuthStore();
  const isInitialized = useRef(false);

  // Initialize auth on mount
  useEffect(() => {
    initialize().finally(() => {
      SplashScreen.hideAsync();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate when auth state resolves or changes
  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace('/(auth)/login');
    } else if (!isOnboarded) {
      router.replace('/(app)/onboarding');
    } else {
      if (!isInitialized.current) {
        // Only auto-navigate to tabs on first resolution
        router.replace('/(app)/(tabs)');
      }
    }
    isInitialized.current = true;
  }, [isLoading, session, isOnboarded]);

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
