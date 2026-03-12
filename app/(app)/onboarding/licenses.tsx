import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth-store';
import { theme } from '../../../lib/theme';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  DC: 'D.C.', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii',
  ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska',
  NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
  UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export default function OnboardingLicensesScreen() {
  const { profile } = useAuthStore();
  const params = useLocalSearchParams<{
    firstName?: string;
    lastName?: string;
    npi?: string;
    credential?: string;
    specialty?: string;
  }>();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(profile?.licenseStates ?? [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (state: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(state)) {
        next.delete(state);
      } else {
        next.add(state);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    if (selected.size === 0) {
      setError('Please select at least one state.');
      return;
    }

    setError('');
    setSaving(true);

    // Include profile fields from step 1 (or fall back to already-saved profile)
    // so the backend always has firstName + lastName available.
    await api.profile.update({
      firstName:     params.firstName  || profile?.firstName,
      lastName:      params.lastName   || profile?.lastName,
      npi:           params.npi        || profile?.npi,
      credential:    params.credential || profile?.credential,
      specialty:     params.specialty  || profile?.specialty,
      licenseStates: Array.from(selected),
    });

    setSaving(false);

    // Non-blocking — proceed to license-details even if the save failed.
    router.push({
      pathname: '/(app)/onboarding/license-details' as any,
      params: {
        states: Array.from(selected).join(','),
        firstName: params.firstName ?? '',
        lastName: params.lastName ?? '',
        npi: params.npi ?? '',
        credential: params.credential ?? '',
        specialty: params.specialty ?? '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Step 2 of 4</Text>
          </View>
          <Text style={styles.title}>Where are you licensed?</Text>
          <Text style={styles.subtitle}>
            Select all states where you hold an active medical license
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.statesGrid}
          showsVerticalScrollIndicator={false}
        >
          {US_STATES.map((abbr) => {
            const isSelected = selected.has(abbr);
            return (
              <TouchableOpacity
                key={abbr}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggle(abbr)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <Check size={12} color={theme.colors.white} strokeWidth={3} />
                )}
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextSelected]}
                >
                  {abbr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <Button
            title={
              selected.size > 0
                ? `Continue with ${selected.size} state${selected.size > 1 ? 's' : ''}`
                : 'Continue'
            }
            onPress={handleContinue}
            loading={saving}
            fullWidth
          />
        </View>
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
    paddingHorizontal: theme.spacing[6],
  },
  header: {
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[4],
  },
  stepIndicator: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.gray100,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing[3],
  },
  stepText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
    fontWeight: theme.fontWeight.medium,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray500,
    lineHeight: 22,
  },
  statesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    paddingBottom: theme.spacing[4],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.gray300,
  },
  chipSelected: {
    backgroundColor: theme.colors.plum,
    borderColor: theme.colors.plum,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray700,
  },
  chipTextSelected: {
    color: theme.colors.white,
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing[3],
  },
  footer: {
    paddingBottom: theme.spacing[6],
    paddingTop: theme.spacing[3],
  },
});
