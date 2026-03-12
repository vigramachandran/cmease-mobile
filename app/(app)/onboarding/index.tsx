import { router } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth-store';
import { theme } from '../../../lib/theme';
import { NPIData } from '../../../lib/types';

const TOTAL_STEPS = 4;
const CURRENT_STEP = 1;

export default function OnboardingNPIScreen() {
  const { profile } = useAuthStore();
  const [npi, setNpi] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [npiData, setNpiData] = useState<NPIData | null>(null);
  const [npiError, setNpiError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [credential, setCredential] = useState('');
  const [specialty, setSpecialty] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (npi.length === 10) {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
      lookupTimer.current = setTimeout(() => lookupNPI(npi), 300);
    } else {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
      if (npi.length < 10) {
        setNpiData(null);
        setNpiError('');
      }
    }
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
  }, [npi]);

  const lookupNPI = async (value: string) => {
    setLookingUp(true);
    setNpiError('');
    setNpiData(null);

    const { data, error } = await api.npi.lookup(value);
    setLookingUp(false);

    if (error || !data) {
      setNpiError(error ?? 'NPI not found. Please check the number.');
      return;
    }

    setNpiData(data);
    setFirstName(data.firstName);
    setLastName(data.lastName);
    setCredential(data.credential);
    setSpecialty(data.specialty);
  };

  const canContinue =
    (npiData !== null || npi.length === 0) &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0;

  const handleContinue = async () => {
    setSaveError('');
    setSaving(true);

    const { error } = await api.profile.update({
      npi: npi || undefined,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      credential: credential.trim(),
      specialty: specialty.trim(),
    });

    setSaving(false);

    if (error) {
      // Non-blocking — show a warning but let the user proceed.
      setSaveError(`Profile save failed (${error}) — you can continue anyway.`);
    }

    router.push({
      pathname: '/(app)/onboarding/licenses' as any,
      params: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        npi: npi || '',
        credential: credential.trim(),
        specialty: specialty.trim(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step progress bar */}
          <View style={styles.progressBar}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressPill,
                  i < CURRENT_STEP ? styles.progressPillActive : styles.progressPillInactive,
                ]}
              />
            ))}
          </View>

          <View style={styles.header}>
            <Text style={styles.stepText}>Step 1 of 4</Text>
            <Text style={styles.title}>Let's set up your profile</Text>
            <Text style={styles.subtitle}>
              Enter your NPI and we'll do the rest
            </Text>
          </View>

          {/* NPI Input with lookup indicator */}
          <View style={styles.npiContainer}>
            <Input
              label="NPI Number"
              placeholder="10-digit NPI"
              value={npi}
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '').slice(0, 10);
                setNpi(cleaned);
              }}
              keyboardType="numeric"
              maxLength={10}
              error={npiError}
            />
            {lookingUp && (
              <View style={styles.npiLoader}>
                <ActivityIndicator size="small" color={theme.colors.plum} />
              </View>
            )}
            {npiData && !lookingUp && (
              <View style={styles.npiSuccess}>
                <CheckCircle size={16} color={theme.colors.success} />
                <Text style={styles.npiSuccessText}>
                  Verified: Dr. {npiData.firstName} {npiData.lastName},{' '}
                  {npiData.specialty}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.gap} />

          <Input
            label="First Name"
            placeholder="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          <View style={styles.gap} />

          <Input
            label="Last Name"
            placeholder="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          <View style={styles.gap} />

          <Input
            label="Credential"
            placeholder="e.g. MD, DO, MBBS"
            value={credential}
            onChangeText={setCredential}
            autoCapitalize="characters"
          />

          <View style={styles.gap} />

          <Input
            label="Specialty"
            placeholder="e.g. Internal Medicine"
            value={specialty}
            onChangeText={setSpecialty}
            autoCapitalize="words"
          />

          {saveError ? (
            <Text style={styles.saveError}>{saveError}</Text>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button
              title="Continue"
              onPress={handleContinue}
              loading={saving}
              disabled={!canContinue}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
    paddingTop: theme.spacing[6],
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: theme.spacing[5],
  },
  progressPill: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressPillActive: {
    backgroundColor: theme.colors.plum,
  },
  progressPillInactive: {
    backgroundColor: theme.colors.gray300,
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  stepText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing[3],
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
  npiContainer: {
    position: 'relative',
  },
  npiLoader: {
    position: 'absolute',
    right: theme.spacing[4],
    top: 38,
  },
  npiSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing[2],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
  },
  npiSuccessText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.medium,
    flex: 1,
  },
  gap: {
    height: theme.spacing[4],
  },
  saveError: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing[3],
    padding: theme.spacing[3],
    backgroundColor: '#FDECEA',
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  buttonContainer: {
    marginTop: theme.spacing[6],
  },
});
