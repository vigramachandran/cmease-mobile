import { router } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { useAuthStore } from '../../../lib/auth-store';
import { theme } from '../../../lib/theme';

export default function OnboardingCompleteScreen() {
  const { profile, setOnboarded, fetchProfile } = useAuthStore();

  const handleGoToDashboard = async () => {
    // Re-fetch profile to ensure latest data
    await fetchProfile();
    setOnboarded(true);
    router.replace('/(app)/(tabs)');
  };

  const stateList = profile?.licenseStates?.join(', ') ?? '';
  const displayName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(' ');
  const displaySpecialty = profile?.specialty ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <CheckCircle size={72} color={theme.colors.success} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>You're all set!</Text>

        <View style={styles.summaryCard}>
          {displayName ? (
            <Text style={styles.summaryName}>Dr. {displayName}</Text>
          ) : null}
          {displaySpecialty ? (
            <Text style={styles.summaryDetail}>{displaySpecialty}</Text>
          ) : null}
          {stateList ? (
            <Text style={styles.summaryDetail}>Licensed in {stateList}</Text>
          ) : null}
        </View>

        <Text style={styles.description}>
          Your CME tracking dashboard is ready. We'll help you stay compliant
          across all your license states.
        </Text>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step 4 of 4 — Complete!</Text>
        </View>

        <Button
          title="Go to Dashboard"
          onPress={handleGoToDashboard}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },
  iconContainer: {
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: theme.fontSize.display,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[6],
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing[5],
    paddingHorizontal: theme.spacing[6],
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing[1],
    marginBottom: theme.spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
  },
  summaryDetail: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray500,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing[6],
  },
  stepIndicator: {
    backgroundColor: '#E8F5EE',
    paddingVertical: 4,
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing[6],
  },
  stepText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.semibold,
  },
});
