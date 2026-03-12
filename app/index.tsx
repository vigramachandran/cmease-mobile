import { Redirect } from 'expo-router';
import React from 'react';
import { LoadingScreen } from '../components/LoadingScreen';
import { useAuthStore } from '../lib/auth-store';

/**
 * Root index — decides where to send the user based on auth state.
 * This is the first screen shown while auth initializes.
 */
export default function Index() {
  const { isLoading, session, isOnboarded } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}
